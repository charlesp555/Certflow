'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import {
  Bell, Download, CheckCircle2,
  Upload, AlertTriangle, Clock, TrendingUp, TrendingDown,
  FileText,
} from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { COMPLIANCE_DISCLAIMER } from '../components/ComplianceDisclaimer'
import { UserButton, useUser, useAuth } from '@clerk/nextjs'
import { createClerkSupabaseClient } from '@/lib/supabase'

// ── Design tokens ─────────────────────────────────────────────────────────────

// Design Bible tokens (see app/page.tsx appendix) — carbon ground, graphite
// surfaces, seam hairlines. Orange is EARNED: verified/passing states + the
// primary CTA only. Failures carry --attention red; "needs attention" is a
// dimmed attention (the Bible has no warning color). No green, no purple.
const T = {
  bg: '#0C0E12',           // --carbon
  card: '#171A21',         // --graphite
  border: '#262B35',       // --seam
  borderAccent: '#333A47',
  orange: '#F97316',       // --verified
  orangeHover: '#EA6A0C',
  red: '#E5484D',          // --attention
  redDim: '#B4565A',              // dimmed attention — lower-severity signals (expiring, secondary warnings)
  redDimText: '#D0888C',          // dimmed attention — readable text
  primary: '#F2F4F8',      // --ink-primary
  secondary: '#9AA3B2',    // --ink-secondary
  muted: '#5F6774',
  voice: 'var(--font-voice), sans-serif',      // Said
  evidence: 'var(--font-evidence), monospace', // Recorded — every datum
}

// Clerk UserButton themed to the Bible palette — purple is banned. Function
// untouched; this only recolors the avatar ring and the popover surfaces.
const CLERK_APPEARANCE = {
  variables: {
    colorPrimary: '#F97316',
    colorBackground: '#171A21',
    colorText: '#F2F4F8',
    colorTextSecondary: '#9AA3B2',
    colorInputBackground: '#0C0E12',
    colorInputText: '#F2F4F8',
    colorNeutral: '#F2F4F8',
    borderRadius: '8px',
  },
  elements: {
    userButtonAvatarBox: { border: '1px solid #262B35' },
    userButtonPopoverCard: { background: '#171A21', border: '1px solid #262B35' },
  },
}

// ── Types ─────────────────────────────────────────────────────────────────────

type DateRange = 'This Week' | 'This Month' | 'Last 3 Months' | 'This Year'
const DATE_RANGES: DateRange[] = ['This Week', 'This Month', 'Last 3 Months', 'This Year']

type AnalysisResult = {
  insuredName?: string | null
  flags?: string[]
  overallStatus?: string | null
  isExpired?: boolean | null
  additionalInsured?: boolean | null
  waiverOfSubrogation?: boolean | null
  expirationDate?: string | null
}

type RequirementCheck = {
  coverage: string
  minimum: string
  actual: string
  passed: boolean
  reason: string
}

type SubRow = {
  id: string
  vendor_id: string | null
  status: string | null
  issues_count: number | null
  risk_score: number | null
  analysis_result: AnalysisResult | null
  created_at: string | null
  vendors: { id: string; name: string } | null

  // Migration 004/005 structured columns — real, already-computed values.
  // NULL on very old, pre-backfill rows.
  overall_status: string | null
  failed_requirements_count: number | null
  requirements_check: RequirementCheck[] | null
}

// ── Data helpers ──────────────────────────────────────────────────────────────

function rangeStart(range: DateRange): Date {
  const now = new Date()
  switch (range) {
    case 'This Week':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    case 'This Month': {
      const d = new Date(now.getFullYear(), now.getMonth(), 1)
      d.setHours(0, 0, 0, 0)
      return d
    }
    case 'Last 3 Months':
      return new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
    case 'This Year': {
      const d = new Date(now.getFullYear(), 0, 1)
      d.setHours(0, 0, 0, 0)
      return d
    }
  }
}

function applyRange(subs: SubRow[], range: DateRange): SubRow[] {
  const cutoff = rangeStart(range)
  return subs.filter(s => s.created_at && new Date(s.created_at) >= cutoff)
}

// Real counts only — every submission in range falls into exactly one
// bucket. Prefers the structured overall_status; falls back to the legacy
// binary status column on pre-backfill rows (which can't distinguish
// "expiring", so those rows land in Compliant or Non-Compliant only).
function verificationOutcomes(subs: SubRow[]): { compliant: number; needsAttention: number; nonCompliant: number } {
  let compliant = 0, needsAttention = 0, nonCompliant = 0
  subs.forEach(s => {
    if (s.overall_status) {
      if (s.overall_status === 'COMPLIANT') compliant++
      else if (s.overall_status === 'EXPIRING') needsAttention++
      else nonCompliant++ // NON_COMPLIANT or EXPIRED
    } else if (s.status === 'Compliant') {
      compliant++
    } else {
      nonCompliant++
    }
  })
  return { compliant, needsAttention, nonCompliant }
}

type VendorLatest = {
  name: string
  vendorId: string
  overallStatus: string | null
  status: string | null
  openFindings: number | null   // failed_requirements_count — null on pre-backfill rows
  issuesCount: number | null    // legacy fallback, real column, always populated
  lastVerified: string | null
  expirationDate: string | null // from analysis_result — already fetched with the row
}

// Group by vendor, take each vendor's most recent submission — its current
// verification state. Every field here is a real column already loaded with
// `submissions`; nothing is derived or invented.
function latestPerVendor(subs: SubRow[]): VendorLatest[] {
  const byVendor = new Map<string, SubRow>()
  ;[...subs].sort((a, b) =>
    new Date(b.created_at ?? '').getTime() - new Date(a.created_at ?? '').getTime()
  ).forEach(s => {
    const key = s.vendor_id ?? s.analysis_result?.insuredName ?? s.id
    if (!byVendor.has(key)) byVendor.set(key, s)
  })
  return Array.from(byVendor.values()).map(s => ({
    name: s.vendors?.name ?? s.analysis_result?.insuredName ?? 'Unknown',
    vendorId: s.vendors?.id ?? s.vendor_id ?? '',
    overallStatus: s.overall_status,
    status: s.status,
    openFindings: s.failed_requirements_count,
    issuesCount: s.issues_count,
    lastVerified: s.created_at,
    expirationDate: s.analysis_result?.expirationDate ?? null,
  }))
}

// Prefers the structured 4-value overall_status; falls back to the legacy
// 2-value status column on pre-backfill rows where overall_status is still
// NULL. Both are real, always-populated-one-way-or-another fields.
function requiresAction(v: VendorLatest): boolean {
  if (v.overallStatus) return v.overallStatus === 'NON_COMPLIANT' || v.overallStatus === 'EXPIRED'
  return v.status === 'Issues Found'
}

// Verified = earned orange; failures (expired, non-compliant) = attention
// red; expiring = dimmed attention. (Design Bible §Color.)
function vendorStatusBadge(v: VendorLatest): { label: string; color: string } {
  switch (v.overallStatus) {
    case 'COMPLIANT':     return { label: 'Compliant',     color: T.orange     }
    case 'EXPIRING':      return { label: 'Expiring',      color: T.redDimText }
    case 'EXPIRED':       return { label: 'Expired',       color: T.red        }
    case 'NON_COMPLIANT': return { label: 'Non-Compliant', color: T.red        }
    default:
      // Pre-backfill row — only the legacy binary status is real/known here.
      return v.status === 'Compliant'
        ? { label: 'Compliant', color: T.orange }
        : { label: v.status || 'Unknown', color: T.red }
  }
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)   return 'just now'
  if (m < 60)  return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24)  return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div style={{
      position: 'fixed', top: 24, right: 24, zIndex: 300,
      background: T.card, border: `1px solid ${T.border}`,
      borderRadius: 8, padding: '12px 18px',
      display: 'flex', alignItems: 'center', gap: 10,
      boxShadow: '0 8px 32px rgba(0,0,0,0.55)',
      transition: 'opacity 0.25s ease, transform 0.25s ease',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(-12px)',
      pointerEvents: 'none',
    }}>
      <CheckCircle2 size={16} color={T.orange} />
      <span style={{ fontSize: 13, fontWeight: 600, color: T.primary }}>{message}</span>
    </div>
  )
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, trendDir,
}: {
  label: string
  value: string
  sub: string
  trendDir?: 'positive' | 'negative' | 'neutral'
}) {
  // positive = a passing/verified state (earned orange); negative = a failure
  // (attention red); neutral = a plain fact (ink, seam hairline). Red must
  // mean failure, never "here's a number". Flat chips — pills are banned.
  const isNeutral = trendDir === 'neutral' || !trendDir
  const color = trendDir === 'positive' ? T.orange : trendDir === 'negative' ? T.red : T.secondary
  const TrendIcon = trendDir === 'negative' ? TrendingDown : TrendingUp

  return (
    <div style={{
      flex: 1, minWidth: 0,
      background: T.card, border: `1px solid ${T.border}`,
      borderRadius: 8, padding: '20px 22px',
      transition: 'border-color 0.2s',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = T.borderAccent }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = T.border }}
    >
      <p style={{ fontSize: 12, color: T.secondary, fontWeight: 500, margin: '0 0 10px' }}>{label}</p>
      <p style={{ fontSize: 32, fontWeight: 500, fontFamily: T.evidence, fontVariantNumeric: 'tabular-nums', color: T.primary, margin: '0 0 10px', lineHeight: 1 }}>
        {value}
      </p>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        background: isNeutral ? 'transparent' : `${color}18`, color,
        border: `1px solid ${isNeutral ? T.border : `${color}30`}`,
        borderRadius: 2, padding: '3px 10px', fontSize: 11, fontFamily: T.evidence, fontVariantNumeric: 'tabular-nums',
      }}>
        {trendDir && !isNeutral && <TrendIcon size={11} strokeWidth={2.5} />}
        {sub}
      </div>
    </div>
  )
}

// ── Verification Outcomes bar ────────────────────────────────────────────────
// A single stacked bar showing the real distribution of verifications in the
// selected range — not a trend line, just an honest snapshot. Zero-count
// categories render as 0, never hidden or fabricated.

function VerificationOutcomesBar({ compliant, needsAttention, nonCompliant }: {
  compliant: number; needsAttention: number; nonCompliant: number
}) {
  const [animated, setAnimated] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 80)
    return () => clearTimeout(t)
  }, [])

  const total = compliant + needsAttention + nonCompliant
  // Compliant = earned orange; needs-attention = dimmed attention (no warning
  // color exists in the Bible); non-compliant/expired = full attention red.
  const segments = [
    { label: 'Compliant',               count: compliant,      color: T.orange },
    { label: 'Needs Attention',         count: needsAttention, color: T.redDim },
    { label: 'Non-Compliant / Expired', count: nonCompliant,   color: T.red    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', height: 14, borderRadius: 2, overflow: 'hidden', background: T.border, marginBottom: 20 }}>
        {total > 0 && segments.map(seg => seg.count > 0 && (
          <div key={seg.label} style={{
            width: animated ? `${(seg.count / total) * 100}%` : '0%',
            background: seg.color,
            transition: 'width 0.6s ease',
          }} />
        ))}
      </div>
      <div style={{ display: 'flex', gap: 20 }}>
        {segments.map(seg => (
          <div key={seg.label} style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: seg.color, flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: T.secondary, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {seg.label}
              </span>
            </div>
            <span style={{ fontSize: 22, fontWeight: 500, fontFamily: T.evidence, fontVariantNumeric: 'tabular-nums', color: T.primary }}>{seg.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Expiration timeline ──────────────────────────────────────────────────────
// Replaces the findings bar chart. Each vendor's current coverage expiration
// plotted across the next 12 months — the point is the clusters: three COIs
// lapsing in the same month is a renewal crunch you can see coming. Already-
// expired vendors collect in a gutter before the axis starts. Dates come from
// analysis_result.expirationDate on rows already fetched — no new queries.
// Flat per the Bible: seam axis, mono labels, no gradients or glow.

type MarkerState = 'expired' | 'expiring' | 'healthy'

const MARKER_COLOR: Record<MarkerState, string> = {
  expired:  T.red,     // already lapsed — full attention
  expiring: T.redDim,  // within 30 days — dimmed attention
  healthy:  T.orange,  // verified, current
}

type ExpMarkerData = { vendorId: string; name: string; dateLabel: string; state: MarkerState }

function ExpMarker({ m }: { m: ExpMarkerData }) {
  const [hov, setHov] = useState(false)
  return (
    <Link
      href={m.vendorId ? `/vendors/${m.vendorId}` : '/vendors'}
      aria-label={`${m.name} — expires ${m.dateLabel}`}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onFocus={() => setHov(true)}
      onBlur={() => setHov(false)}
      style={{
        position: 'relative', display: 'block', flexShrink: 0,
        width: 10, height: 10, borderRadius: 2,
        background: MARKER_COLOR[m.state],
        outline: hov ? `1px solid ${T.primary}` : 'none', outlineOffset: 1,
      }}
    >
      {hov && (
        <span style={{
          position: 'absolute', bottom: 'calc(100% + 7px)', left: '50%', transform: 'translateX(-50%)',
          background: '#1C2029', border: `1px solid ${T.borderAccent}`, borderRadius: 4,
          padding: '5px 9px', whiteSpace: 'nowrap', zIndex: 20, pointerEvents: 'none',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: T.primary, fontFamily: T.voice }}>{m.name}</span>
          <span style={{ fontSize: 10, color: T.secondary, fontFamily: T.evidence, fontVariantNumeric: 'tabular-nums' }}>{m.dateLabel}</span>
        </span>
      )}
    </Link>
  )
}

const TIMELINE_LEGEND: { color: string; label: string }[] = [
  { color: T.red,    label: 'expired' },
  { color: T.redDim, label: 'expiring ≤30d' },
  { color: T.orange, label: 'verified' },
]

function ExpirationTimeline({ vendors }: { vendors: VendorLatest[] }) {
  const { expired, months, undated, beyond } = useMemo(() => {
    const now = new Date()
    const startYear = now.getFullYear(), startMonth = now.getMonth()
    const expired: ExpMarkerData[] = []
    const months = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(startYear, startMonth + i, 1)
      return {
        label: d.getMonth() === 0
          ? `Jan ’${String(d.getFullYear()).slice(2)}`
          : d.toLocaleDateString('en-US', { month: 'short' }),
        markers: [] as ExpMarkerData[],
      }
    })
    let undated = 0, beyond = 0

    vendors.forEach(v => {
      const d = v.expirationDate ? new Date(v.expirationDate) : null
      if (!d || isNaN(d.getTime())) { undated++; return }
      const days = Math.ceil((d.getTime() - now.getTime()) / 86_400_000)
      const base = {
        vendorId: v.vendorId,
        name: v.name,
        dateLabel: d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }),
      }
      if (days < 0) { expired.push({ ...base, state: 'expired' }); return }
      const idx = (d.getFullYear() - startYear) * 12 + (d.getMonth() - startMonth)
      if (idx > 11) { beyond++; return }
      months[Math.max(idx, 0)].markers.push({ ...base, state: days <= 30 ? 'expiring' : 'healthy' })
    })

    return { expired, months, undated, beyond }
  }, [vendors])

  const plotted = expired.length + months.reduce((n, m) => n + m.markers.length, 0)
  if (plotted === 0) {
    return (
      <p style={{ fontSize: 13, color: T.muted, textAlign: 'center', padding: '18px 0', margin: 0 }}>
        No coverage expiration dates on file yet.
      </p>
    )
  }

  const notShown = [
    beyond > 0  ? `${beyond} beyond 12 months` : null,
    undated > 0 ? `${undated} without a date`  : null,
  ].filter(Boolean).join(' · ')

  const columnStyle: React.CSSProperties = {
    flex: 1, minWidth: 0, minHeight: 110,
    display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
    alignItems: 'center', gap: 4, paddingBottom: 10,
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 14 }}>

        {/* Expired gutter — before the axis starts. Its baseline is
            deliberately unconnected to the month axis: these are off the
            timeline, not early on it. */}
        <div style={{ width: 52, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ ...columnStyle, flex: 1 }}>
            {expired.map(m => <ExpMarker key={m.vendorId || m.name} m={m} />)}
          </div>
          <div style={{ height: 1 }} />
          <div style={{ paddingTop: 8, textAlign: 'center' }}>
            <span style={{ fontSize: 10, fontFamily: T.evidence, color: expired.length > 0 ? T.red : T.muted }}>
              Expired
            </span>
          </div>
        </div>

        <div style={{ width: 1, background: T.border, flexShrink: 0 }} />

        {/* 12-month axis */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', flex: 1 }}>
            {months.map(col => (
              <div key={col.label} style={columnStyle}>
                {col.markers.map(m => <ExpMarker key={m.vendorId || m.name} m={m} />)}
              </div>
            ))}
          </div>
          <div style={{ height: 1, background: T.border }} />
          <div style={{ display: 'flex', paddingTop: 8 }}>
            {months.map(col => (
              <div key={col.label} style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
                <span style={{ fontSize: 10, fontFamily: T.evidence, color: T.secondary, whiteSpace: 'nowrap' }}>{col.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 18 }}>
        {TIMELINE_LEGEND.map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: item.color, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: T.secondary }}>{item.label}</span>
          </div>
        ))}
        {notShown && (
          <span style={{ marginLeft: 'auto', fontSize: 10, color: T.muted, fontFamily: T.evidence }}>
            Not shown: {notShown}
          </span>
        )}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const { user, isLoaded } = useUser()
  const { getToken } = useAuth()
  const supabase = useMemo(() => createClerkSupabaseClient(getToken), [getToken])
  const [allSubs,      setAllSubs]      = useState<SubRow[]>([])
  const [loading,      setLoading]      = useState(true)
  const [dateRange,    setDateRange]    = useState<DateRange>('This Month')
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  useEffect(() => {
    if (!isLoaded) return
    if (!user) { setLoading(false); return }

    async function fetchSubs() {
      const { data, error } = await supabase
        .from('submissions')
        .select(`
          id, vendor_id, status, issues_count, risk_score, analysis_result, created_at, vendors(id, name),
          overall_status, failed_requirements_count, requirements_check
        `)
        .eq('clerk_user_id', user!.id)
        .order('created_at', { ascending: false })

      if (!error && data) setAllSubs(data as unknown as SubRow[])
      setLoading(false)
    }

    fetchSubs()
  }, [isLoaded, user])

  function showToast(msg: string) {
    setToastMessage(msg)
    if (timerRef.current) clearTimeout(timerRef.current)
    setToastVisible(true)
    timerRef.current = setTimeout(() => setToastVisible(false), 3000)
  }

  function handleExport() {
    const rows = filtered.length > 0 ? filtered : allSubs
    if (rows.length === 0) return
    const header = ['Date', 'Vendor', 'Status', 'Compliance Score', 'Open Findings', 'Flags', 'Policy Expiration']
    const lines = rows.map(s => {
      const ar = s.analysis_result
      const vendor = (s.vendors?.name ?? ar?.insuredName ?? 'Unknown').replace(/,/g, ' ')
      const date = s.created_at ? new Date(s.created_at).toLocaleDateString('en-US') : ''
      const flags = `"${(ar?.flags ?? []).join('; ')}"`
      return [
        date,
        vendor,
        s.status ?? '',
        s.risk_score ?? 0,
        s.issues_count ?? 0,
        flags,
        ar?.expirationDate ?? '',
      ].join(',')
    })
    // Legal requirement: the disclaimer ships with every exported compliance
    // report. Quoted so its commas stay inside one cell.
    const csv = [header.join(','), ...lines, '', `"${COMPLIANCE_DISCLAIMER}"`].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `covira-report-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    showToast('Report downloaded')
  }

  // Filtered slice for stats / issues / activity
  const filtered = applyRange(allSubs, dateRange)

  // Derived analytics
  const totalAnalyzed  = filtered.length
  const compliantCount = filtered.filter(s => s.status === 'Compliant').length
  const complianceRate = totalAnalyzed === 0 ? 0 : Math.round((compliantCount / totalAnalyzed) * 100)
  const totalIssues    = filtered.reduce((acc, s) => acc + (s.issues_count ?? 0), 0)

  const outcomes       = verificationOutcomes(filtered)
  const vendorsLatest  = latestPerVendor(allSubs)
  const vendorsNeedingAction = vendorsLatest.filter(requiresAction).length
  const vendorSummary  = [...vendorsLatest]
    .sort((a, b) => (b.openFindings ?? b.issuesCount ?? 0) - (a.openFindings ?? a.issuesCount ?? 0))
    .slice(0, 5)
  const recentSubs     = allSubs.slice(0, 5)

  const hasData = allSubs.length > 0

  return (
    <div style={{
      display: 'flex', minHeight: '100vh',
      background: T.bg, fontFamily: T.voice,
      color: T.primary, position: 'relative', isolation: 'isolate',
    }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Page ledger-grid — same 24px hairline texture as the landing and
           the other app pages, z -1 inside the isolated root: above the
           carbon ground, below all content. */
        .page-ledger-grid {
          position: absolute; inset: 0; z-index: -1; pointer-events: none;
          --grid-line: rgba(154,163,178, 0.06);
          background-image:
            repeating-linear-gradient(to bottom, var(--grid-line) 0, var(--grid-line) 1px, transparent 1px, transparent 24px),
            repeating-linear-gradient(to right,  var(--grid-line) 0, var(--grid-line) 1px, transparent 1px, transparent 24px);
        }
      `}</style>
      <div className="page-ledger-grid" aria-hidden="true" />
      <Toast message={toastMessage} visible={toastVisible} />
      <Sidebar />

      <main style={{ marginLeft: 240, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

        {/* ── Header ── */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 40,
          background: T.bg, borderBottom: `1px solid ${T.border}`,
          height: 64, padding: '0 28px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em', color: T.primary, margin: 0, lineHeight: 1.2 }}>Reports</h1>
            <p style={{ fontSize: 12, color: T.secondary, margin: 0 }}>
              Compliance analytics and audit-ready exports
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={handleExport}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                background: T.orange, color: '#fff', border: 'none',
                borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'background 0.15s, transform 0.1s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = T.orangeHover; e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { e.currentTarget.style.background = T.orange; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <Download size={14} /> Export Compliance Report
            </button>

            <button style={{
              position: 'relative', background: 'none',
              border: `1px solid ${T.border}`, borderRadius: 8,
              width: 38, height: 38, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: T.secondary, transition: 'border-color 0.15s, color 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.borderAccent; e.currentTarget.style.color = T.primary }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.secondary }}
            >
              <Bell size={17} />
              <span style={{
                position: 'absolute', top: 9, right: 9, width: 7, height: 7,
                borderRadius: '50%', background: T.orange, border: `2px solid ${T.bg}`,
              }} />
            </button>

            <UserButton appearance={CLERK_APPEARANCE} />
          </div>
        </header>

        {/* ── Content ── */}
        <div style={{ padding: 28, flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Date range pills */}
          <div style={{ display: 'flex', gap: 8 }}>
            {DATE_RANGES.map(dr => {
              const active = dateRange === dr
              return (
                <button
                  key={dr}
                  onClick={() => setDateRange(dr)}
                  style={{
                    // Active = raised graphite + brighter hairline + primary
                    // ink. A nav control never earns the orange fill (§Color).
                    background: active ? '#1C2029' : T.card,
                    color: active ? T.primary : T.secondary,
                    border: `1px solid ${active ? T.borderAccent : T.border}`,
                    borderRadius: 8, padding: '7px 16px',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = T.borderAccent; e.currentTarget.style.color = T.primary } }}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.secondary } }}
                >
                  {dr}
                </button>
              )
            })}
          </div>

          {loading ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 0' }}>
              <div style={{
                width: 36, height: 36,
                border: `3px solid rgba(154,163,178,0.15)`,
                borderTop: `3px solid ${T.secondary}`,
                borderRadius: '50%',
                animation: 'spin 0.85s linear infinite',
              }} />
            </div>
          ) : !hasData ? (
            /* ── Empty state ── */
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              padding: '72px 24px', textAlign: 'center',
            }}>
              <div style={{
                width: 64, height: 64, borderRadius: 8,
                background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 20,
              }}>
                <FileText size={28} color={T.secondary} />
              </div>
              <p style={{ fontSize: 18, fontWeight: 700, color: T.primary, margin: '0 0 10px' }}>
                No reports yet
              </p>
              <p style={{ fontSize: 14, color: T.secondary, margin: '0 0 28px', maxWidth: 360, lineHeight: 1.6 }}>
                Upload a COI to see your compliance analytics, issue breakdown, and vendor compliance summary here.
              </p>
              <Link href="/upload" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: T.orange, color: '#fff', textDecoration: 'none',
                borderRadius: 8, padding: '11px 22px', fontSize: 14, fontWeight: 600,
                transition: 'background 0.15s',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = T.orangeHover)}
                onMouseLeave={e => (e.currentTarget.style.background = T.orange)}
              >
                <Upload size={15} /> Upload a COI
              </Link>
            </div>
          ) : (
            <>
              {/* ── Stat cards ── */}
              <div style={{ display: 'flex', gap: 14 }}>
                {/* Badge semantics: "N total all time", "N submissions with
                    flags" and "N vendors tracked" are plain counts → neutral.
                    Only the compliance-rate badge states a pass/fail. */}
                <StatCard
                  label="Verifications Completed"
                  value={String(totalAnalyzed)}
                  sub={`${allSubs.length} total all time`}
                  trendDir="neutral"
                />
                <StatCard
                  label="Compliance Rate"
                  value={`${complianceRate}%`}
                  sub={`${compliantCount} of ${totalAnalyzed} compliant`}
                  trendDir={complianceRate >= 70 ? 'positive' : 'negative'}
                />
                <StatCard
                  label="Open Compliance Findings"
                  value={String(totalIssues)}
                  sub={`${filtered.filter(s => (s.issues_count ?? 0) > 0).length} submissions with flags`}
                  trendDir="neutral"
                />
                <StatCard
                  label="Vendors Requiring Action"
                  value={String(vendorsNeedingAction)}
                  sub={`${vendorsLatest.length} vendor${vendorsLatest.length !== 1 ? 's' : ''} tracked`}
                  trendDir="neutral"
                />
              </div>

              {/* ── Two-column layout ── */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 18, alignItems: 'start' }}>

                {/* Left column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                  {/* Verification outcomes */}
                  <div style={{
                    background: T.card, border: `1px solid ${T.border}`,
                    borderRadius: 8, padding: 24,
                    transition: 'border-color 0.2s',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = T.borderAccent)}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = T.border)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <h2 style={{ fontSize: 14, fontWeight: 700, color: T.primary, margin: 0 }}>
                        Verification Outcomes
                      </h2>
                      <span style={{ fontSize: 11, color: T.muted }}>{dateRange}</span>
                    </div>
                    <p style={{ fontSize: 12, color: T.muted, margin: '0 0 20px' }}>
                      Compliance breakdown across verifications in this period
                    </p>
                    {totalAnalyzed === 0 ? (
                      <p style={{ fontSize: 13, color: T.muted, textAlign: 'center', padding: '18px 0', margin: 0 }}>
                        No verifications in this period.
                      </p>
                    ) : (
                      <VerificationOutcomesBar {...outcomes} />
                    )}
                  </div>

                  {/* Expiration timeline — forward-looking 12-month window,
                      so the date-range filter above doesn't apply here. */}
                  <div style={{
                    background: T.card, border: `1px solid ${T.border}`,
                    borderRadius: 8, padding: 24,
                    transition: 'border-color 0.2s',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = T.borderAccent)}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = T.border)}
                  >
                    <h2 style={{ fontSize: 14, fontWeight: 700, color: T.primary, margin: '0 0 4px' }}>
                      Expiration timeline
                    </h2>
                    <p style={{ fontSize: 12, color: T.muted, margin: '0 0 20px' }}>
                      When coverage lapses across your vendors
                    </p>
                    <ExpirationTimeline vendors={vendorsLatest} />
                  </div>
                </div>

                {/* Right column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                  {/* Vendor risk summary */}
                  <div style={{
                    background: T.card, border: `1px solid ${T.border}`,
                    borderRadius: 8, padding: 24,
                    transition: 'border-color 0.2s',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = T.borderAccent)}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = T.border)}
                  >
                    <h2 style={{ fontSize: 14, fontWeight: 700, color: T.primary, margin: '0 0 18px' }}>
                      Vendor Compliance Summary
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                      <div style={{
                        display: 'grid', gridTemplateColumns: '1.3fr 78px 50px 58px',
                        gap: 8, padding: '0 0 8px',
                        borderBottom: `1px solid ${T.border}`, marginBottom: 4,
                      }}>
                        {['Vendor', 'Status', 'Findings', 'Verified'].map(col => (
                          <span key={col} style={{
                            fontSize: 10, color: T.muted, fontWeight: 600,
                            textTransform: 'uppercase', letterSpacing: '0.07em',
                          }}>{col}</span>
                        ))}
                      </div>
                      {vendorSummary.length === 0 ? (
                        <p style={{ fontSize: 13, color: T.muted, padding: '16px 0', margin: 0, textAlign: 'center' }}>
                          No vendor data yet
                        </p>
                      ) : vendorSummary.map((v, i) => {
                        const badge        = vendorStatusBadge(v)
                        const openFindings = v.openFindings ?? v.issuesCount
                        return (
                          <div
                            key={v.vendorId || i}
                            style={{
                              display: 'grid', gridTemplateColumns: '1.3fr 78px 50px 58px',
                              gap: 8, padding: '11px 4px',
                              borderBottom: i < vendorSummary.length - 1 ? `1px solid ${T.border}` : 'none',
                              transition: 'background 0.12s',
                              borderRadius: 4, margin: '0 -4px',
                              cursor: v.vendorId ? 'pointer' : 'default',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = '#1C2029')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                          >
                            <span style={{ fontSize: 12, fontWeight: 600, color: T.primary, alignSelf: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {v.vendorId ? (
                                <Link href={`/vendors/${v.vendorId}`} style={{ color: T.primary, textDecoration: 'none' }}
                                  onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                                  onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
                                >
                                  {v.name}
                                </Link>
                              ) : v.name}
                            </span>
                            <span style={{ fontSize: 11, fontFamily: T.evidence, color: badge.color, alignSelf: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {badge.label}
                            </span>
                            <span style={{ fontSize: 12, fontWeight: 500, fontFamily: T.evidence, fontVariantNumeric: 'tabular-nums', color: T.primary, alignSelf: 'center' }}>
                              {openFindings ?? '—'}
                            </span>
                            <span style={{ fontSize: 11, color: T.muted, fontFamily: T.evidence, fontVariantNumeric: 'tabular-nums', alignSelf: 'center', whiteSpace: 'nowrap' }}>
                              {v.lastVerified ? relativeTime(v.lastVerified) : '—'}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Recent activity */}
                  <div style={{
                    background: T.card, border: `1px solid ${T.border}`,
                    borderRadius: 8, padding: 24,
                    transition: 'border-color 0.2s',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = T.borderAccent)}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = T.border)}
                  >
                    <h2 style={{ fontSize: 14, fontWeight: 700, color: T.primary, margin: '0 0 18px' }}>
                      Recent Activity
                    </h2>
                    {recentSubs.length === 0 ? (
                      <p style={{ fontSize: 13, color: T.muted, margin: 0, textAlign: 'center', padding: '16px 0' }}>
                        No recent activity
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                        {recentSubs.map((s, i) => {
                          // Verified = earned orange; a verification that
                          // found findings is a failure signal = red (§Color).
                          const isCompliant = s.status === 'Compliant'
                          const Icon  = isCompliant ? CheckCircle2 : AlertTriangle
                          const color = isCompliant ? T.orange : T.red
                          const label = isCompliant
                            ? 'Vendor verified compliant'
                            : `Verification found ${s.issues_count ?? 0} finding${(s.issues_count ?? 0) !== 1 ? 's' : ''}`
                          const vendor = s.vendors?.name ?? s.analysis_result?.insuredName ?? 'Unknown Vendor'
                          return (
                            <div
                              key={s.id}
                              style={{
                                display: 'flex', alignItems: 'flex-start', gap: 11,
                                padding: '11px 4px',
                                borderBottom: i < recentSubs.length - 1 ? `1px solid ${T.border}` : 'none',
                                transition: 'background 0.12s',
                                borderRadius: 4, margin: '0 -4px',
                              }}
                              onMouseEnter={e => (e.currentTarget.style.background = '#1C2029')}
                              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            >
                              <div style={{
                                width: 28, height: 28, borderRadius: 2, flexShrink: 0,
                                background: `${color}18`, border: `1px solid ${color}30`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}>
                                <Icon size={13} color={color} />
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontSize: 12, fontWeight: 600, color: T.primary, margin: '0 0 2px' }}>
                                  {label}
                                </p>
                                <p style={{ fontSize: 11, color: T.secondary, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {vendor}
                                </p>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                                <Clock size={10} color={T.muted} />
                                <span style={{ fontSize: 11, color: T.muted, fontFamily: T.evidence, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                                  {s.created_at ? relativeTime(s.created_at) : '—'}
                                </span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
