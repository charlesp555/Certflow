'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  Bell, Download, CheckCircle2,
  Upload, AlertTriangle, Clock, TrendingUp, TrendingDown,
  FileText,
} from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { UserButton, useUser } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase'

// ── Design tokens ─────────────────────────────────────────────────────────────

const T = {
  bg: '#0a0a0f',
  surface: '#0f0f17',
  card: '#13131f',
  border: '#1a1a2e',
  borderAccent: '#2a2a3e',
  orange: '#F97316',
  orangeHover: '#EA6A0C',
  green: '#22c55e',
  amber: '#fbbf24',
  red: '#E5484D',
  primary: '#f8f8f8',
  secondary: '#8b8fa8',
  muted: '#4b5063',
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

const ENDORSEMENT_COVERAGES = new Set(['Additional Insured', 'Waiver of Subrogation'])

function isEmptyValue(v: string | null | undefined): boolean {
  if (!v) return true
  const n = v.toLowerCase().trim()
  return ['', 'n/a', '$0', '0', 'none', 'not listed', 'not included', 'missing'].includes(n)
}

// Maps a failed requirement to a short, scannable category label (e.g.
// "General Liability Below Minimum", "Waiver of Subrogation Missing"),
// derived entirely from that requirement's own coverage name and actual
// value — never a hardcoded/invented category.
function findingShortLabel(req: RequirementCheck): string {
  if (ENDORSEMENT_COVERAGES.has(req.coverage)) return `${req.coverage} Missing`
  return isEmptyValue(req.actual) ? `${req.coverage} Missing` : `${req.coverage} Below Minimum`
}

function topFindings(subs: SubRow[]): Array<{ label: string; count: number }> {
  const counts: Record<string, number> = {}
  subs.forEach(s => {
    ;(s.requirements_check ?? []).filter(r => !r.passed).forEach(r => {
      const label = findingShortLabel(r)
      counts[label] = (counts[label] ?? 0) + 1
    })
  })
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, count]) => ({ label, count }))
}

type VendorLatest = {
  name: string
  vendorId: string
  overallStatus: string | null
  status: string | null
  openFindings: number | null   // failed_requirements_count — null on pre-backfill rows
  issuesCount: number | null    // legacy fallback, real column, always populated
  lastVerified: string | null
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
  }))
}

// Prefers the structured 4-value overall_status; falls back to the legacy
// 2-value status column on pre-backfill rows where overall_status is still
// NULL. Both are real, always-populated-one-way-or-another fields.
function requiresAction(v: VendorLatest): boolean {
  if (v.overallStatus) return v.overallStatus === 'NON_COMPLIANT' || v.overallStatus === 'EXPIRED'
  return v.status === 'Issues Found'
}

function vendorStatusBadge(v: VendorLatest): { label: string; color: string } {
  switch (v.overallStatus) {
    case 'COMPLIANT':     return { label: 'Compliant',     color: T.green }
    case 'EXPIRING':      return { label: 'Expiring',      color: T.amber }
    case 'EXPIRED':       return { label: 'Expired',       color: T.red   }
    case 'NON_COMPLIANT': return { label: 'Non-Compliant', color: T.orange }
    default:
      // Pre-backfill row — only the legacy binary status is real/known here.
      return v.status === 'Compliant'
        ? { label: 'Compliant', color: T.green }
        : { label: v.status || 'Unknown', color: T.orange }
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
      background: T.card, border: '1px solid rgba(34,197,94,0.30)',
      borderRadius: 10, padding: '12px 18px',
      display: 'flex', alignItems: 'center', gap: 10,
      boxShadow: '0 8px 32px rgba(0,0,0,0.55)',
      transition: 'opacity 0.25s ease, transform 0.25s ease',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(-12px)',
      pointerEvents: 'none',
    }}>
      <CheckCircle2 size={16} color={T.green} />
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
  const color = trendDir === 'positive' ? T.green : trendDir === 'negative' ? T.red : T.orange
  const TrendIcon = trendDir === 'negative' ? TrendingDown : TrendingUp

  return (
    <div style={{
      flex: 1, minWidth: 0,
      background: T.card, border: `1px solid ${T.border}`,
      borderRadius: 12, padding: '20px 22px',
      transition: 'border-color 0.2s, transform 0.2s, box-shadow 0.2s',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = T.borderAccent; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.4)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
    >
      <p style={{ fontSize: 12, color: T.secondary, fontWeight: 500, margin: '0 0 10px' }}>{label}</p>
      <p style={{ fontSize: 32, fontWeight: 800, color: T.primary, margin: '0 0 10px', letterSpacing: '-1.5px', lineHeight: 1 }}>
        {value}
      </p>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        background: `${color}18`, color,
        border: `1px solid ${color}30`,
        borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600,
      }}>
        {trendDir && <TrendIcon size={11} strokeWidth={2.5} />}
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
  const segments = [
    { label: 'Compliant',               count: compliant,      color: T.green },
    { label: 'Needs Attention',         count: needsAttention, color: T.amber },
    { label: 'Non-Compliant / Expired', count: nonCompliant,   color: T.red   },
  ]

  return (
    <div>
      <div style={{ display: 'flex', height: 14, borderRadius: 7, overflow: 'hidden', background: 'rgba(255,255,255,0.04)', marginBottom: 20 }}>
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
            <span style={{ fontSize: 22, fontWeight: 800, color: T.primary, letterSpacing: '-0.5px' }}>{seg.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Top Issues bars ───────────────────────────────────────────────────────────

function TopIssuesChart({ issues }: { issues: Array<{ label: string; count: number }> }) {
  const [animated, setAnimated] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 120)
    return () => clearTimeout(t)
  }, [])

  const maxCount = Math.max(...issues.map(i => i.count), 1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {issues.map((issue, i) => (
        <div key={issue.label}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: T.secondary, fontWeight: 500 }}>{issue.label}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: T.orange }}>{issue.count}</span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 3,
              background: T.orange,
              width: animated ? `${(issue.count / maxCount) * 100}%` : '0%',
              transition: 'width 0.6s ease',
              transitionDelay: `${i * 80}ms`,
            }} />
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const { user, isLoaded } = useUser()
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
    const csv = [header.join(','), ...lines].join('\n')
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
  const findingsList   = topFindings(filtered)
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
      background: T.bg, fontFamily: 'Inter, -apple-system, sans-serif',
      color: T.primary,
    }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
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
            <h1 style={{ fontSize: 16, fontWeight: 700, color: T.primary, margin: 0, lineHeight: 1.2 }}>Reports</h1>
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
                boxShadow: '0 2px 12px rgba(249,115,22,0.25)',
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
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.orange; e.currentTarget.style.color = T.primary }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.secondary }}
            >
              <Bell size={17} />
              <span style={{
                position: 'absolute', top: 9, right: 9, width: 7, height: 7,
                borderRadius: '50%', background: T.orange, border: `2px solid ${T.bg}`,
              }} />
            </button>

            <UserButton />
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
                    background: active ? T.orange : T.card,
                    color: active ? '#fff' : T.secondary,
                    border: `1px solid ${active ? T.orange : T.border}`,
                    borderRadius: 8, padding: '7px 16px',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
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
                border: `3px solid rgba(249,115,22,0.15)`,
                borderTop: `3px solid ${T.orange}`,
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
                width: 64, height: 64, borderRadius: 16,
                background: 'rgba(249,115,22,0.08)', border: `1px solid rgba(249,115,22,0.18)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 20,
              }}>
                <FileText size={28} color={T.orange} />
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
                boxShadow: '0 2px 16px rgba(249,115,22,0.3)',
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
                <StatCard
                  label="Verifications Completed"
                  value={String(totalAnalyzed)}
                  sub={`${allSubs.length} total all time`}
                  trendDir="positive"
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
                  trendDir={totalIssues === 0 ? 'positive' : 'negative'}
                />
                <StatCard
                  label="Vendors Requiring Action"
                  value={String(vendorsNeedingAction)}
                  sub={`${vendorsLatest.length} vendor${vendorsLatest.length !== 1 ? 's' : ''} tracked`}
                  trendDir={vendorsNeedingAction === 0 ? 'positive' : 'negative'}
                />
              </div>

              {/* ── Two-column layout ── */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 18, alignItems: 'start' }}>

                {/* Left column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                  {/* Verification outcomes */}
                  <div style={{
                    background: T.card, border: `1px solid ${T.border}`,
                    borderRadius: 12, padding: 24,
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

                  {/* Most common findings */}
                  <div style={{
                    background: T.card, border: `1px solid ${T.border}`,
                    borderRadius: 12, padding: 24,
                    transition: 'border-color 0.2s',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = T.borderAccent)}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = T.border)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                      <h2 style={{ fontSize: 14, fontWeight: 700, color: T.primary, margin: 0 }}>
                        Most Common Findings
                      </h2>
                      <span style={{ fontSize: 11, color: T.muted }}>{dateRange}</span>
                    </div>
                    {findingsList.length === 0 ? (
                      <div style={{ padding: '28px 0', textAlign: 'center' }}>
                        <CheckCircle2 size={28} color={T.green} style={{ marginBottom: 10 }} />
                        <p style={{ fontSize: 13, fontWeight: 600, color: T.green, margin: '0 0 4px' }}>No findings detected</p>
                        <p style={{ fontSize: 12, color: T.muted, margin: 0 }}>All verifications in this period are fully compliant.</p>
                      </div>
                    ) : (
                      <TopIssuesChart issues={findingsList} />
                    )}
                  </div>
                </div>

                {/* Right column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                  {/* Vendor risk summary */}
                  <div style={{
                    background: T.card, border: `1px solid ${T.border}`,
                    borderRadius: 12, padding: 24,
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
                            onMouseEnter={e => (e.currentTarget.style.background = '#1a1a2e')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                          >
                            <span style={{ fontSize: 12, fontWeight: 600, color: T.primary, alignSelf: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {v.vendorId ? (
                                <Link href={`/vendors/${v.vendorId}`} style={{ color: T.primary, textDecoration: 'none' }}
                                  onMouseEnter={e => (e.currentTarget.style.color = T.orange)}
                                  onMouseLeave={e => (e.currentTarget.style.color = T.primary)}
                                >
                                  {v.name}
                                </Link>
                              ) : v.name}
                            </span>
                            <span style={{ fontSize: 11, fontWeight: 600, color: badge.color, alignSelf: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {badge.label}
                            </span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: T.primary, alignSelf: 'center' }}>
                              {openFindings ?? '—'}
                            </span>
                            <span style={{ fontSize: 11, color: T.muted, alignSelf: 'center', whiteSpace: 'nowrap' }}>
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
                    borderRadius: 12, padding: 24,
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
                          const isCompliant = s.status === 'Compliant'
                          const Icon  = isCompliant ? CheckCircle2 : AlertTriangle
                          const color = isCompliant ? T.green : T.orange
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
                              onMouseEnter={e => (e.currentTarget.style.background = '#1a1a2e')}
                              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            >
                              <div style={{
                                width: 28, height: 28, borderRadius: 8, flexShrink: 0,
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
                                <span style={{ fontSize: 11, color: T.muted, whiteSpace: 'nowrap' }}>
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
