'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useUser, useAuth, UserButton } from '@clerk/nextjs'
import { createClerkSupabaseClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import {
  Bell, User, AlertTriangle,
  ArrowRight, Users, CheckCircle2, Clock,
} from 'lucide-react'
import Sidebar from '../components/Sidebar'

// Design Bible tokens (see app/page.tsx appendix) — carbon ground, graphite
// surfaces, seam hairlines. Orange is earned: verification states + primary
// CTA only. No green, no blue, no purple. Expiring = dimmed attention red
// (the Bible has no warning color; a soft failure is a quieter failure).
const T = {
  bg: '#0C0E12',        // --carbon
  card: '#171A21',      // --graphite
  border: '#262B35',    // --seam
  borderHover: '#333A47',
  orange: '#F97316',    // --verified
  red: '#E5484D',       // --attention
  redDim: '#B4565A',               // dimmed attention — lower-severity signals (expiring, secondary warnings)
  redDimText: '#D0888C',           // dimmed attention — readable text on graphite
  primary: '#F2F4F8',   // --ink-primary
  secondary: '#9AA3B2', // --ink-secondary
  muted: '#5F6774',
  voice: 'var(--font-voice), sans-serif',      // Said — headings, labels, UI copy
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

// Flat chip tones (the Bible bans pills — chips are near-rectangular, hairline
// border, mono text).
type ChipTone = 'neutral' | 'verified' | 'attention' | 'attentionDim'
const CHIP_TONES: Record<ChipTone, { color: string; border: string; background: string }> = {
  neutral:      { color: T.secondary,  border: T.border,                 background: 'transparent' },
  verified:     { color: T.orange,     border: 'rgba(249,115,22,0.35)', background: 'rgba(249,115,22,0.08)' },
  attention:    { color: T.red,        border: 'rgba(229,72,77,0.35)',  background: 'rgba(229,72,77,0.08)' },
  attentionDim: { color: T.redDimText, border: 'rgba(229,72,77,0.22)',  background: 'rgba(229,72,77,0.05)' },
}

type Vendor = {
  id: string
  name: string
  status: string
  expiration_date: string | null
}

type RequirementCheck = {
  coverage: string
  minimum: string
  actual: string
  passed: boolean
  reason: string
}

type Submission = {
  id: string
  vendor_id: string | null
  status: string
  issues_count: number
  created_at: string
  analysis_result: { expirationDate?: string; requirementsCheck?: RequirementCheck[] } | null
  // Migration 004 structured columns — already in the select('*') payload.
  // NULL on pre-backfill rows; the matrix falls back to analysis_result.
  requirements_check: RequirementCheck[] | null
  is_expired: boolean | null
  expiration_date: string | null
}

function useCountUp(target: number, duration = 1100): number {
  const [val, setVal] = useState(0)
  useEffect(() => {
    let raf: number
    const t0 = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setVal(Math.round(target * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return val
}

function MetricCard({
  label, target, tag, tagTone, icon: Icon,
}: {
  label: string
  target: number
  tag: string
  tagTone: ChipTone
  icon: React.ElementType
}) {
  const val = useCountUp(target)
  const [hov, setHov] = useState(false)
  const tone = CHIP_TONES[tagTone]

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        flex: 1, minWidth: 0,
        background: T.card, border: `1px solid ${hov ? T.borderHover : T.border}`,
        borderRadius: 8, padding: '20px 22px', position: 'relative',
        transition: 'border-color 0.2s ease',
      }}
    >
      <div style={{
        position: 'absolute', top: 18, right: 18,
        width: 30, height: 30, borderRadius: 2,
        border: `1px solid ${T.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={14} color={T.secondary} strokeWidth={2} style={{ opacity: 0.7 }} />
      </div>
      <div style={{ fontSize: 12, color: T.secondary, fontFamily: T.voice, fontWeight: 500, marginBottom: 10 }}>{label}</div>
      <div style={{ fontSize: 33, fontWeight: 500, color: T.primary, fontFamily: T.evidence, fontVariantNumeric: 'tabular-nums', lineHeight: 1, marginBottom: 12 }}>{val}</div>
      <div
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          background: tone.background, color: tone.color, border: `1px solid ${tone.border}`,
          borderRadius: 2, padding: '3px 10px', fontSize: 11, fontFamily: T.evidence,
        }}
      >
        {tag}
      </div>
    </div>
  )
}

// ── Needs attention (exceptions matrix) ─────────────────────────────────────
// One row per vendor that needs action — expired, failing a requirement,
// expiring within 30 days, or never verified — one column per requirement
// check, read from the latest submission's structured requirements_check
// column (already fetched, no new queries). Only verified-AND-passing vendors
// are excluded: they need nothing, and past ~10 vendors a complete matrix
// stops being scannable. Capped at 6 rows with a "View all" overflow link.
// The "All N vendors verified" state is therefore literally true: it can only
// render when every vendor has a verification and every one passes.

type CellState = 'pass' | 'fail' | 'na'

const MATRIX_COLUMNS: { label: string; match: RegExp }[] = [
  { label: 'GL',   match: /general liability/i },
  { label: 'Auto', match: /\bauto/i },
  { label: 'WC',   match: /workers?\s*comp/i },
  { label: 'A/I',  match: /additional insured/i },
  { label: 'WOS',  match: /waiver|subrogation/i },
]

const CELL_GLYPH: Record<CellState, { glyph: string; color: string }> = {
  pass: { glyph: '✓', color: T.orange },
  fail: { glyph: '✕', color: T.red },
  na:   { glyph: '—', color: T.secondary },
}

const MATRIX_LEGEND = [
  { glyph: '✓',      color: T.orange,    label: 'verified' },
  { glyph: '✕',      color: T.red,       label: 'failed' },
  { glyph: '≤30d',   color: T.redDim,    label: 'expiring' },
  { glyph: 'No COI', color: T.secondary, label: 'unverified' },
  { glyph: '—',      color: T.secondary, label: 'not required' },
]

// Statuses only a completed verification can set (see saveToSupabase in
// api/extract-coi). A vendor whose status is anything else has never had a
// COI checked.
const VERIFIED_STATUSES = ['active', 'expiring', 'expired', 'non_compliant']

const MATRIX_HEADER_STYLE: React.CSSProperties = {
  padding: '0 10px 10px',
  fontSize: 12, color: T.secondary, fontFamily: T.voice, fontWeight: 600,
  fontVariantCaps: 'all-small-caps', letterSpacing: '0.08em',
  borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap',
}

function CoverageMatrix({ vendors, submissions, mounted }: {
  vendors: Vendor[]
  submissions: Submission[]
  mounted: boolean
}) {
  const router = useRouter()

  const rows = useMemo(() => {
    const now = Date.now()
    return vendors.map(v => {
      // submissions arrive newest-first; the first match is the latest verification
      const latest = submissions.find(s => s.vendor_id === v.id) ?? null
      const checks = latest?.requirements_check ?? latest?.analysis_result?.requirementsCheck ?? []

      // A vendor's status is only ever set to one of these by a completed
      // verification (saveToSupabase). Anything else ("Pending Review") means
      // no COI has ever been checked — that vendor is UNVERIFIED, not healthy.
      // No data is not a passing grade.
      const unverified = !latest && !VERIFIED_STATUSES.includes(v.status)

      const cells: CellState[] = MATRIX_COLUMNS.map(col => {
        const check = checks.find(c => col.match.test(c.coverage))
        if (!check) return 'na'
        return check.passed ? 'pass' : 'fail'
      })

      const expRaw = v.expiration_date ?? latest?.expiration_date ?? latest?.analysis_result?.expirationDate ?? null
      const expDate = expRaw ? new Date(expRaw) : null
      const days = expDate && !isNaN(expDate.getTime())
        ? Math.ceil((expDate.getTime() - now) / 86_400_000)
        : null

      const expired  = !unverified && ((days !== null && days < 0) || v.status === 'expired' || latest?.is_expired === true)
      const failing  = cells.includes('fail')
      const expiring = !unverified && !expired && days !== null && days <= 30

      let expLabel: string, expColor: string
      if (unverified) {
        expLabel = 'No COI'
        expColor = T.secondary
      } else if (expired) {
        expLabel = days !== null && days < 0 ? `expired ${-days}d` : 'expired'
        expColor = T.red
      } else if (expiring) {
        expLabel = days === 0 ? 'today' : `${days} day${days === 1 ? '' : 's'}`
        expColor = T.redDim
      } else if (expDate && days !== null) {
        expLabel = expDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
        expColor = T.primary
      } else {
        expLabel = '—'
        expColor = T.muted
      }

      const urgency = unverified ? 3 : expired ? 0 : failing ? 1 : expiring ? 2 : 4
      return { vendor: v, cells, expLabel, expColor, urgency, days }
    })
      .filter(r => r.urgency < 4) // exceptions only — verified-and-passing vendors need no attention
      .sort((a, b) => a.urgency - b.urgency || (a.days ?? Infinity) - (b.days ?? Infinity))
  }, [vendors, submissions])

  const visible = rows.slice(0, 6)
  const overflow = rows.length - visible.length

  // The earned state: every vendor checked, nothing outstanding. Stated as a
  // recorded fact — mono count, one verified check — not a celebration.
  if (rows.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '38px 0' }}>
        <div style={{
          width: 32, height: 32, borderRadius: 2, flexShrink: 0,
          background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 14, fontFamily: T.evidence, color: T.orange }}>✓</span>
        </div>
        <span style={{ fontSize: 13, fontWeight: 500, color: T.primary, fontFamily: T.voice }}>
          All <span style={{ fontFamily: T.evidence, fontVariantNumeric: 'tabular-nums' }}>{vendors.length}</span> vendor{vendors.length === 1 ? '' : 's'} verified
        </span>
      </div>
    )
  }

  return (
    <>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ ...MATRIX_HEADER_STYLE, textAlign: 'left' }}>Vendor</th>
              {MATRIX_COLUMNS.map(col => (
                <th key={col.label} style={{ ...MATRIX_HEADER_STYLE, textAlign: 'center' }}>{col.label}</th>
              ))}
              <th style={{ ...MATRIX_HEADER_STYLE, textAlign: 'right' }}>Expires</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row, i) => (
              <tr
                key={row.vendor.id}
                className={mounted ? 'row-animate' : 'pre-animate'}
                style={{ cursor: 'pointer', animationDelay: mounted ? `${i * 60}ms` : undefined, transition: 'background 0.15s' }}
                onClick={() => router.push(`/vendors/${row.vendor.id}`)}
                onMouseEnter={e => (e.currentTarget.style.background = '#1C2029')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <td style={{ padding: '12px 10px', borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>
                  <Link
                    href={`/vendors/${row.vendor.id}`}
                    style={{ fontSize: 13, fontWeight: 600, color: T.primary, fontFamily: T.voice, textDecoration: 'none' }}
                    onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                    onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
                  >
                    {row.vendor.name}
                  </Link>
                </td>
                {row.cells.map((cell, j) => (
                  <td key={j} style={{
                    padding: '12px 10px', borderBottom: `1px solid ${T.border}`,
                    textAlign: 'center', fontSize: 13, fontFamily: T.evidence,
                    color: CELL_GLYPH[cell].color,
                  }}>
                    {CELL_GLYPH[cell].glyph}
                  </td>
                ))}
                <td style={{
                  padding: '12px 10px', borderBottom: `1px solid ${T.border}`,
                  textAlign: 'right', fontSize: 12, fontFamily: T.evidence,
                  fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap',
                  color: row.expColor,
                }}>
                  {row.expLabel}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, paddingTop: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {MATRIX_LEGEND.map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, fontFamily: T.evidence, color: item.color }}>{item.glyph}</span>
              <span style={{ fontSize: 11, fontFamily: T.voice, color: T.secondary }}>{item.label}</span>
            </div>
          ))}
        </div>
        {overflow > 0 && (
          <Link
            href="/reports"
            style={{ fontSize: 12, fontWeight: 500, color: T.secondary, fontFamily: T.voice, textDecoration: 'none', whiteSpace: 'nowrap', transition: 'color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.color = T.primary)}
            onMouseLeave={e => (e.currentTarget.style.color = T.secondary)}
          >
            View all {rows.length} →
          </Link>
        )}
      </div>
    </>
  )
}

// Severity gradient: full --attention red is reserved for expired/critical;
// lower-severity items (compliance issues, expiring soon) carry the dimmed
// red so the one truly urgent item reads first.
type Severity = 'critical' | 'dim'

const SEVERITY_TONES: Record<Severity, { icon: string; bg: string; bgHov: string; border: string; borderHov: string }> = {
  critical: { icon: T.red,    bg: 'rgba(229,72,77,0.05)', bgHov: 'rgba(229,72,77,0.10)', border: 'rgba(229,72,77,0.14)', borderHov: 'rgba(229,72,77,0.28)' },
  dim:      { icon: T.redDim, bg: 'rgba(180,86,90,0.05)', bgHov: 'rgba(180,86,90,0.10)', border: 'rgba(180,86,90,0.16)', borderHov: 'rgba(180,86,90,0.32)' },
}

function ActionItem({ text, severity, index, mounted }: { text: string; severity: Severity; index: number; mounted: boolean }) {
  const [hov, setHov] = useState(false)
  const tone = SEVERITY_TONES[severity]
  return (
    <Link
      href="/vendors"
      className={mounted ? 'action-animate' : 'pre-animate'}
      style={{
        display: 'flex', alignItems: 'center', gap: 11,
        padding: '11px 13px',
        background: hov ? tone.bgHov : tone.bg,
        border: `1px solid ${hov ? tone.borderHov : tone.border}`,
        borderRadius: 8, textDecoration: 'none',
        animationDelay: mounted ? `${index * 80 + 150}ms` : undefined,
        transition: 'background 0.15s, border-color 0.15s',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <AlertTriangle size={15} color={tone.icon} style={{ flexShrink: 0 }} />
      <span style={{ fontSize: 13, color: T.primary, fontFamily: T.voice, lineHeight: 1.5, fontWeight: 500, flex: 1 }}>{text}</span>
      <ArrowRight
        size={13} color={T.secondary}
        style={{ flexShrink: 0, opacity: hov ? 1 : 0, transition: 'opacity 0.15s' }}
      />
    </Link>
  )
}

export default function Dashboard() {
  const { user, isLoaded } = useUser()
  const { getToken } = useAuth()
  const supabase = useMemo(() => createClerkSupabaseClient(getToken), [getToken])
  const [mounted, setMounted] = useState(false)
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!isLoaded || !user) return
    const userId = user.id

    async function fetchData() {
      const { data: vendorData } = await supabase
        .from('vendors')
        .select('*')
        .eq('clerk_user_id', userId)

      const { data: submissionData } = await supabase
        .from('submissions')
        .select('*')
        .eq('clerk_user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10)

      setVendors(vendorData || [])
      setSubmissions(submissionData || [])
      setLoading(false)
    }

    fetchData()
  }, [user, isLoaded])

  const totalVendors    = vendors.length
  const compliantVendors = vendors.filter(v => v.status === 'active').length
  const expiringSoon    = vendors.filter(v => v.status === 'expiring').length
  const issuesFound     = vendors.filter(v => v.status === 'non_compliant' || v.status === 'expired').length
  const compliantPct    = totalVendors === 0 ? 0 : Math.round((compliantVendors / totalVendors) * 100)

  // Critical first, then dimmed — hierarchy through intensity and position.
  // Unverified vendors are an action item too: no data is not a passing grade.
  const actionItems: { text: string; severity: Severity }[] = []
  const expired = vendors.filter(v => v.status === 'expired').length
  const unverifiedCount = vendors.filter(v => !VERIFIED_STATUSES.includes(v.status)).length
  if (expired > 0)          actionItems.push({ text: `${expired} COI${expired > 1 ? 's' : ''} already expired`, severity: 'critical' })
  if (issuesFound > 0)      actionItems.push({ text: `${issuesFound} vendor${issuesFound > 1 ? 's have' : ' has'} compliance issues`, severity: 'dim' })
  if (expiringSoon > 0)     actionItems.push({ text: `${expiringSoon} COI${expiringSoon > 1 ? 's' : ''} expiring soon`, severity: 'dim' })
  if (unverifiedCount > 0)  actionItems.push({ text: `${unverifiedCount} vendor${unverifiedCount > 1 ? 's have' : ' has'} no COI on file`, severity: 'dim' })

  const vendorMap = Object.fromEntries(vendors.map(v => [v.id, v.name]))

  const userName  = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.emailAddresses[0]?.emailAddress || 'User'
  const firstName = user?.firstName || 'there'

  if (!isLoaded || loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: T.bg, fontFamily: T.voice, color: T.primary }}>
        <Sidebar />
        <main style={{ marginLeft: 240, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: T.secondary, fontSize: 14 }}>Loading...</div>
        </main>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: T.bg, fontFamily: T.voice, color: T.primary, position: 'relative', isolation: 'isolate' }}>
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(18px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes bellDot {
          0%, 100% { transform: scale(1);    opacity: 1; }
          50%       { transform: scale(0.72); opacity: 0.45; }
        }
        .pre-animate     { opacity: 0; }
        .row-animate     { animation: fadeSlideUp 0.38s ease both; }
        .action-animate  { animation: slideInRight 0.38s ease both; }
        .bell-dot        { animation: bellDot 2.8s ease-in-out infinite; }

        /* Page ledger-grid — same 24px hairline texture as the landing
           (§12 sanctioned, single instance), z -1 inside the isolated root:
           above the carbon ground, below all content. Opaque graphite cards
           cover it; it shows only in the page's open space. */
        .dash-grid {
          position: absolute; inset: 0; z-index: -1; pointer-events: none;
          --grid-line: rgba(154,163,178, 0.06);
          background-image:
            repeating-linear-gradient(to bottom, var(--grid-line) 0, var(--grid-line) 1px, transparent 1px, transparent 24px),
            repeating-linear-gradient(to right,  var(--grid-line) 0, var(--grid-line) 1px, transparent 1px, transparent 24px);
        }
      `}</style>
      <div className="dash-grid" aria-hidden="true" />

      <Sidebar />

      <main style={{ marginLeft: 240, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

        {/* Header */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 40,
          background: T.bg, borderBottom: `1px solid ${T.border}`,
          height: 64, padding: '0 28px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 600, color: T.primary, fontFamily: T.voice, letterSpacing: '-0.01em', margin: 0, lineHeight: 1.2 }}>Dashboard</h1>
            <p style={{ fontSize: 12, color: T.secondary, fontFamily: T.voice, margin: 0 }}>Welcome back, {firstName}</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button style={{
              position: 'relative', background: 'none',
              border: `1px solid ${T.border}`, borderRadius: 8,
              width: 38, height: 38, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: T.secondary, transition: 'border-color 0.15s, color 0.15s, background 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.borderHover; e.currentTarget.style.color = T.primary; e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.secondary; e.currentTarget.style.background = 'none' }}
            >
              <Bell size={17} />
              <span className="bell-dot" style={{
                position: 'absolute', top: 9, right: 9,
                width: 7, height: 7, borderRadius: '50%',
                background: T.orange, border: `2px solid ${T.bg}`,
              }} />
            </button>

            <UserButton appearance={CLERK_APPEARANCE} />
          </div>
        </header>

        {/* Content */}
        <div style={{ padding: 24, flex: 1 }}>

          {totalVendors === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 40px' }}>
              <h2 style={{ color: T.primary, fontFamily: T.voice, fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 12 }}>
                Welcome to Covira
              </h2>
              <p style={{ color: T.secondary, fontFamily: T.voice, fontSize: 16, marginBottom: 32 }}>
                Add your first vendor to start verifying compliance.
              </p>
              <a href="/vendors" style={{ background: T.orange, color: '#ffffff', fontFamily: T.voice, padding: '12px 24px', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}>
                Add Your First Vendor
              </a>
            </div>
          ) : (
            <>
              {/* Metric cards */}
              <div style={{ display: 'flex', gap: 14, marginBottom: 22 }}>
                <MetricCard label="Total Vendors" target={totalVendors}     tag={`${totalVendors} total`}                        tagTone="neutral"                                          icon={Users}         />
                <MetricCard label="Compliant"     target={compliantVendors} tag={`${compliantPct}%`}                             tagTone={compliantVendors > 0 ? 'verified' : 'neutral'}    icon={CheckCircle2}  />
                <MetricCard label="Issues Found"  target={issuesFound}      tag={issuesFound > 0 ? 'Review needed' : 'None'}     tagTone={issuesFound > 0 ? 'attention' : 'neutral'}        icon={AlertTriangle} />
                <MetricCard label="Expiring Soon" target={expiringSoon}     tag={expiringSoon > 0 ? 'Action needed' : 'None'}    tagTone={expiringSoon > 0 ? 'attentionDim' : 'neutral'}    icon={Clock}         />
              </div>

              {/* Two-column layout */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 310px', gap: 18, alignItems: 'start' }}>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                  {/* Needs attention — exceptions-only coverage matrix */}
                  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 24, transition: 'border-color 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = T.borderHover }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = T.border }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                      <h2 style={{ fontSize: 14, fontWeight: 600, color: T.primary, fontFamily: T.voice, letterSpacing: '-0.01em', margin: 0 }}>Needs attention</h2>
                    </div>
                    <CoverageMatrix vendors={vendors} submissions={submissions} mounted={mounted} />
                  </div>

                  {/* Recent Submissions */}
                  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 24, transition: 'border-color 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = T.borderHover }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = T.border }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                      <h2 style={{ fontSize: 14, fontWeight: 600, color: T.primary, fontFamily: T.voice, letterSpacing: '-0.01em', margin: 0 }}>Recent Submissions</h2>
                      <Link href="/reports"
                        style={{ fontSize: 13, color: T.secondary, fontFamily: T.voice, textDecoration: 'none', fontWeight: 500, transition: 'color 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.color = T.primary)}
                        onMouseLeave={e => (e.currentTarget.style.color = T.secondary)}
                      >
                        View all →
                      </Link>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr>
                            {['Vendor', 'COI Uploaded', 'Status', 'Issues', 'Expiration Date'].map(col => (
                              <th key={col} style={{
                                textAlign: 'left', padding: '0 12px 12px',
                                fontSize: 10, color: T.secondary, fontFamily: T.voice, fontWeight: 600,
                                textTransform: 'uppercase', letterSpacing: '0.07em',
                                borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap',
                              }}>
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {submissions.length === 0 ? (
                            <tr>
                              <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: T.secondary, fontFamily: T.voice }}>
                                No submissions yet.{' '}
                                <Link href="/upload" style={{ color: T.primary, fontWeight: 500, textDecorationColor: T.border }}>
                                  Upload your first COI
                                </Link>
                                {' '}to get started.
                              </td>
                            </tr>
                          ) : (
                            submissions.map((row, i) => {
                              const vendorName = vendorMap[row.vendor_id ?? ''] || 'Unknown Vendor'
                              const expDate = row.analysis_result?.expirationDate || '—'
                              const uploadedDate = row.created_at
                                ? new Date(row.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                : '—'
                              return (
                                <tr
                                  key={row.id}
                                  className={mounted ? 'row-animate' : 'pre-animate'}
                                  style={{ cursor: 'pointer', animationDelay: mounted ? `${i * 80}ms` : undefined, transition: 'background 0.15s' }}
                                  onMouseEnter={e => (e.currentTarget.style.background = '#1C2029')}
                                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                >
                                  <td style={{ padding: '13px 12px', borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>
                                    <Link
                                      href={row.vendor_id ? `/vendors/${row.vendor_id}` : '/vendors'}
                                      style={{ fontSize: 13, fontWeight: 600, color: T.primary, fontFamily: T.voice, textDecoration: 'none', transition: 'text-decoration-color 0.15s' }}
                                      onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                                      onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
                                    >
                                      {vendorName}
                                    </Link>
                                  </td>
                                  <td style={{ padding: '13px 12px', fontSize: 12, color: T.secondary, fontFamily: T.evidence, fontVariantNumeric: 'tabular-nums', borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>
                                    {uploadedDate}
                                  </td>
                                  <td style={{ padding: '13px 12px', borderBottom: `1px solid ${T.border}` }}>
                                    {row.status === 'Compliant' ? (
                                      <span style={{ background: 'rgba(249,115,22,0.08)', color: T.orange, border: '1px solid rgba(249,115,22,0.35)', borderRadius: 2, padding: '3px 10px', fontSize: 11, fontFamily: T.evidence, whiteSpace: 'nowrap' }}>
                                        Compliant
                                      </span>
                                    ) : (
                                      <span style={{ background: 'rgba(229,72,77,0.08)', color: T.red, border: '1px solid rgba(229,72,77,0.35)', borderRadius: 2, padding: '3px 10px', fontSize: 11, fontFamily: T.evidence, whiteSpace: 'nowrap' }}>
                                        Issues Found
                                      </span>
                                    )}
                                  </td>
                                  <td style={{ padding: '13px 12px', fontSize: 13, fontWeight: 500, color: row.issues_count > 0 ? T.red : T.muted, fontFamily: T.evidence, fontVariantNumeric: 'tabular-nums', borderBottom: `1px solid ${T.border}`, textAlign: 'center' }}>
                                    {row.issues_count}
                                  </td>
                                  <td style={{ padding: '13px 12px', fontSize: 12, color: T.secondary, fontFamily: T.evidence, fontVariantNumeric: 'tabular-nums', borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>
                                    {expDate}
                                  </td>
                                </tr>
                              )
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Action Items */}
                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 22, transition: 'border-color 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = T.borderHover }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = T.border }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                    <h2 style={{ fontSize: 14, fontWeight: 600, color: T.primary, fontFamily: T.voice, letterSpacing: '-0.01em', margin: 0 }}>Action Items</h2>
                    <Link href="/vendors"
                      style={{ fontSize: 13, color: T.secondary, fontFamily: T.voice, textDecoration: 'none', fontWeight: 500, transition: 'color 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.color = T.primary)}
                      onMouseLeave={e => (e.currentTarget.style.color = T.secondary)}
                    >
                      View all →
                    </Link>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                    {actionItems.length === 0 ? (
                      <p style={{ color: T.secondary, fontFamily: T.voice, fontSize: 14 }}>No action items. All vendors are compliant.</p>
                    ) : (
                      actionItems.map((item, i) => (
                        <ActionItem key={i} text={item.text} severity={item.severity} index={i} mounted={mounted} />
                      ))
                    )}
                  </div>

                  {actionItems.length > 0 && (
                    <div style={{
                      marginTop: 16, padding: '11px 13px',
                      background: 'rgba(255,255,255,0.025)', border: `1px solid ${T.border}`,
                      borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Users size={13} color={T.secondary} />
                        <span style={{ fontSize: 12, color: T.secondary, fontFamily: T.voice }}>Total open items</span>
                      </div>
                      <span style={{
                        color: T.primary, fontFamily: T.evidence, fontVariantNumeric: 'tabular-nums',
                        fontSize: 12, fontWeight: 500,
                        borderRadius: 2, padding: '2px 10px',
                        border: `1px solid ${T.border}`,
                      }}>
                        {actionItems.length}
                      </span>
                    </div>
                  )}
                </div>

              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
