'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Shield, LayoutDashboard, Building2, FileText, TrendingUp,
  Bell, ClipboardList, FolderOpen, Puzzle, Settings, User,
  ChevronDown, AlertTriangle, ArrowRight, Users, CheckCircle2,
  Clock, Check, RotateCcw, Upload, X, ChevronLeft, Download,
  Search, Eye, TrendingDown,
} from 'lucide-react'

// ─── Theme ────────────────────────────────────────────────────────────────────

const T = {
  bg:          '#0a0a0f',
  surface:     '#0f0f17',
  card:        '#13131f',
  border:      '#1a1a2e',
  borderAccent:'#2a2a3e',
  orange:      '#D97706',
  orangeHover: '#B45309',
  green:       '#22c55e',
  amber:       '#fbbf24',
  blue:        '#8b8cf8',
  red:         '#ef4444',
  primary:     '#f8f8f8',
  secondary:   '#8b8fa8',
  muted:       '#4b5063',
}

type Phase = 'landing' | 'tour' | 'done'

// ─── Tour Steps ───────────────────────────────────────────────────────────────

const STEPS = [
  {
    heading: 'See your entire vendor portfolio at a glance',
    desc:    'The moment you log in, Covira shows you how many vendors you manage, how many are compliant, how many have issues, and which ones are expiring soon. No digging. No spreadsheets.',
    upNext:  'Your complete vendor database',
  },
  {
    heading: 'Manage every vendor in one place',
    desc:    'Every vendor lives in Covira with their compliance status, COI expiration, and last upload. Search, filter by type or status, and drill into any vendor with one click.',
    upNext:  'COI submission history',
  },
  {
    heading: 'Every COI upload — logged, analyzed, and searchable',
    desc:    "Every COI you upload is automatically logged with the vendor name, policy period, compliance status, issue count, and a 0–100 risk score. Search and filter your full history, or export to CSV for audits.",
    upNext:  'Compliance analytics',
  },
  {
    heading: 'Compliance analytics across your entire vendor base',
    desc:    "Covira tracks your compliance rate over time, surfaces the most common issues, and scores each vendor's risk on a 0–100 scale. Know exactly which vendors need attention — before something goes wrong.",
    upNext:  'Setting your coverage requirements',
  },
  {
    heading: 'Set your requirements once — Covira enforces them automatically',
    desc:    "Tell Covira what coverage you require: minimum limits, required endorsements, and policy types. Every COI is checked against these rules automatically. One standard, applied consistently.",
    upNext:  'Your organized document library',
  },
  {
    heading: 'Every vendor document — organized, searchable, always current',
    desc:    "Covira stores every COI in one place, organized by vendor. Upload a renewal and it replaces the old one automatically. Need a certificate fast? Search by vendor name and download instantly.",
    upNext:  "You're ready to verify your vendors",
  },
]

const STEP_TO_NAV = [0, 1, 2, 3, 5, 6]
const STEP_TITLES = ['Dashboard', 'Vendors', 'Submissions', 'Reports', 'Requirements', 'Documents']

// ─── Demo Data ────────────────────────────────────────────────────────────────

const TOTAL = 52, COMPLIANT = 38, ISSUES = 9, EXPIRING = 5

const SUBMISSIONS = [
  { vendor: 'ABC Plumbing LLC',      uploaded: 'May 20, 2025', policyPeriod: 'May 22, 2025 – May 22, 2026', status: 'Issues Found',  issues: 2, score: 52 },
  { vendor: 'Summit Electric Co.',   uploaded: 'May 19, 2025', policyPeriod: 'Feb 15, 2025 – Feb 15, 2027', status: 'Compliant',     issues: 0, score: 98 },
  { vendor: 'Bluewater HVAC',        uploaded: 'May 18, 2025', policyPeriod: 'Jan 10, 2025 – Jan 10, 2027', status: 'Compliant',     issues: 0, score: 97 },
  { vendor: 'Pinnacle Roofing Inc.', uploaded: 'May 16, 2025', policyPeriod: 'Jun 01, 2025 – Jun 01, 2026', status: 'Issues Found',  issues: 1, score: 75 },
  { vendor: 'Bright Services',       uploaded: 'May 15, 2025', policyPeriod: 'Jun 05, 2024 – Jun 05, 2025', status: 'Expiring Soon', issues: 0, score: 68 },
  { vendor: 'ProBuild Contractors',  uploaded: 'May 14, 2025', policyPeriod: 'Mar 12, 2025 – Mar 12, 2027', status: 'Compliant',     issues: 0, score: 96 },
]

const ACTION_ITEMS = [
  '3 vendors missing additional insured endorsement',
  '2 COIs expire within the next 30 days',
  '1 vendor has insufficient general liability limits',
  'Bright Services COI expires in 12 days',
]

const VENDORS = [
  { name: 'ABC Plumbing LLC',      type: 'Plumbing',           status: 'Issues Found',  exp: 'May 22, 2026', last: 'May 20, 2025', issues: 2 },
  { name: 'Summit Electric Co.',   type: 'Electrical',         status: 'Compliant',     exp: 'Feb 15, 2027', last: 'May 19, 2025', issues: 0 },
  { name: 'Bluewater HVAC',        type: 'HVAC',               status: 'Compliant',     exp: 'Jan 10, 2027', last: 'May 18, 2025', issues: 0 },
  { name: 'Pinnacle Roofing Inc.', type: 'Roofing',            status: 'Issues Found',  exp: 'Jun 01, 2026', last: 'May 16, 2025', issues: 1 },
  { name: 'Bright Services',       type: 'Janitorial',         status: 'Expiring Soon', exp: 'Jun 05, 2025', last: 'May 15, 2025', issues: 0 },
  { name: 'ProBuild Contractors',  type: 'General Contractor', status: 'Compliant',     exp: 'Mar 12, 2027', last: 'May 14, 2025', issues: 0 },
  { name: 'Metro Painting Co.',    type: 'Flooring',           status: 'Pending Review',exp: '—',            last: '—',            issues: 0 },
  { name: 'FastFix Maintenance',   type: 'General Contractor', status: 'Compliant',     exp: 'Dec 20, 2026', last: 'Apr 30, 2025', issues: 0 },
]

const REQUIREMENTS_DATA = [
  { type: 'General Liability',      perOccurrence: '$1,000,000', aggregate: '$2,000,000', required: true  },
  { type: 'Auto Liability',         perOccurrence: '$1,000,000', aggregate: '—',          required: true  },
  { type: "Workers' Compensation",  perOccurrence: 'Statutory',  aggregate: '—',          required: true  },
  { type: 'Umbrella / Excess',      perOccurrence: '$5,000,000', aggregate: '$5,000,000', required: false },
  { type: 'Professional Liability', perOccurrence: '$1,000,000', aggregate: '—',          required: false },
]

const ENDORSEMENTS_DATA = [
  { label: 'Additional Insured',            required: true  },
  { label: 'Waiver of Subrogation',         required: true  },
  { label: 'Primary & Non-Contributory',    required: false },
  { label: '30-Day Notice of Cancellation', required: true  },
]

const DOCUMENTS_DATA = [
  { vendor: 'ABC Plumbing LLC',      file: 'COI_ABCPlumbing_2025.pdf',     size: '428 KB', uploaded: 'May 20, 2025', expires: 'May 22, 2026', status: 'Issues Found'  },
  { vendor: 'Summit Electric Co.',   file: 'COI_SummitElectric_2025.pdf',  size: '312 KB', uploaded: 'May 19, 2025', expires: 'Feb 15, 2027', status: 'Compliant'     },
  { vendor: 'Bluewater HVAC',        file: 'COI_BluewaterHVAC_2025.pdf',   size: '501 KB', uploaded: 'May 18, 2025', expires: 'Jan 10, 2027', status: 'Compliant'     },
  { vendor: 'Pinnacle Roofing Inc.', file: 'COI_PinnacleRoofing_2025.pdf', size: '288 KB', uploaded: 'May 16, 2025', expires: 'Jun 01, 2026', status: 'Issues Found'  },
  { vendor: 'Bright Services',       file: 'COI_BrightServices_2025.pdf',  size: '356 KB', uploaded: 'May 15, 2025', expires: 'Jun 05, 2025', status: 'Expiring Soon' },
  { vendor: 'ProBuild Contractors',  file: 'COI_ProBuild_2025.pdf',        size: '445 KB', uploaded: 'May 14, 2025', expires: 'Mar 12, 2027', status: 'Compliant'     },
  { vendor: 'FastFix Maintenance',   file: 'COI_FastFix_2025.pdf',         size: '298 KB', uploaded: 'Apr 30, 2025', expires: 'Dec 20, 2026', status: 'Compliant'     },
]

// Reports analytics dummy data
const MONTHLY_COMPLIANCE = [
  { label: 'Jan', pct: 71 },
  { label: 'Feb', pct: 74 },
  { label: 'Mar', pct: 69 },
  { label: 'Apr', pct: 78 },
  { label: 'May', pct: 73 },
  { label: 'Jun', pct: 80 },
]

const TOP_ISSUES = [
  { label: 'Additional Insured endorsement missing', count: 7 },
  { label: 'Waiver of Subrogation not included',    count: 5 },
  { label: 'GL limits below $1M per occurrence',    count: 3 },
  { label: 'Certificate already expired',           count: 2 },
  { label: 'Umbrella coverage not provided',        count: 1 },
]

const VENDOR_RISK = [
  { name: 'ABC Plumbing LLC',      score: 52 },
  { name: 'Bright Services',       score: 68 },
  { name: 'Pinnacle Roofing Inc.', score: 75 },
  { name: 'Metro Painting Co.',    score: 82 },
  { name: 'Summit Electric Co.',   score: 95 },
]

const RECENT_ACTIVITY = [
  { ok: true,  label: 'COI verified compliant',    vendor: 'ProBuild Contractors', time: '2h ago'  },
  { ok: false, label: '2 issues detected',          vendor: 'ABC Plumbing LLC',     time: '6h ago'  },
  { ok: true,  label: 'COI verified compliant',    vendor: 'Bluewater HVAC',       time: '1d ago'  },
  { ok: false, label: 'Certificate expiring soon', vendor: 'Bright Services',      time: '2d ago'  },
  { ok: true,  label: 'COI verified compliant',    vendor: 'Summit Electric Co.',  time: '3d ago'  },
]

const STATUS_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  'Compliant':      { bg: 'rgba(34,197,94,0.09)',   color: T.green,  border: 'rgba(34,197,94,0.22)'  },
  'Issues Found':   { bg: 'rgba(217,119,6,0.09)',   color: T.orange, border: 'rgba(217,119,6,0.22)'  },
  'Expiring Soon':  { bg: 'rgba(251,191,36,0.09)',  color: T.amber,  border: 'rgba(251,191,36,0.22)' },
  'Pending Review': { bg: 'rgba(139,140,248,0.09)', color: T.blue,   border: 'rgba(139,140,248,0.2)' },
}

function scoreColor(s: number): string {
  if (s >= 90) return T.green
  if (s >= 80) return '#86efac'
  if (s >= 70) return T.orange
  return T.red
}

function riskLabel(s: number): { label: string; color: string } {
  if (s >= 90) return { label: 'Low Risk',    color: T.green   }
  if (s >= 80) return { label: 'Medium Risk', color: '#86efac' }
  if (s >= 70) return { label: 'High Risk',   color: T.orange  }
  return             { label: 'Critical',     color: T.red     }
}

// ─── Demo Sidebar (mirrors app/components/Sidebar.tsx) ────────────────────────

const DEMO_NAV = [
  { Icon: LayoutDashboard, label: 'Dashboard'                        },
  { Icon: Building2,       label: 'Vendors'                          },
  { Icon: FileText,        label: 'Submissions'                      },
  { Icon: TrendingUp,      label: 'Reports'                          },
  { Icon: Bell,            label: 'Alerts',       comingSoon: true   },
  { Icon: ClipboardList,   label: 'Requirements'                     },
  { Icon: FolderOpen,      label: 'Documents'                        },
  { Icon: Puzzle,          label: 'Integrations', comingSoon: true   },
  { Icon: Settings,        label: 'Settings'                         },
]

function DemoSidebar({ activeTab, onAction }: { activeTab: number; onAction: () => void }) {
  return (
    <aside style={{
      width: 240, flexShrink: 0, background: T.surface,
      borderRight: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column',
      position: 'fixed', top: 0, bottom: 0, left: 0, zIndex: 50,
    }}>
      <div style={{ padding: '22px 20px 18px', borderBottom: `1px solid ${T.border}` }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 32, height: 32, background: 'rgba(217,119,6,0.12)', border: '1px solid rgba(217,119,6,0.25)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={17} color={T.orange} strokeWidth={2.5} />
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '0.07em', color: T.primary }}>COVIRA</span>
        </Link>
      </div>

      <nav style={{ flex: 1, padding: '10px', overflowY: 'auto' }}>
        {DEMO_NAV.map(({ Icon, label, comingSoon }, i) => {
          const active = i === activeTab
          const color  = comingSoon ? '#3d4158' : (active ? T.orange : T.secondary)
          return (
            <div key={label} onClick={active || comingSoon ? undefined : onAction}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 8, marginBottom: 2,
                background: active ? 'rgba(217,119,6,0.10)' : 'transparent',
                borderLeft: `2px solid ${active ? T.orange : 'transparent'}`,
                color, fontSize: 14, fontWeight: active ? 600 : 500,
                cursor: active || comingSoon ? 'default' : 'pointer',
                transition: 'background 0.15s, color 0.15s',
              }}
              onMouseEnter={e => { if (!active && !comingSoon) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = T.primary } }}
              onMouseLeave={e => { if (!active && !comingSoon) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.secondary } }}
            >
              <Icon size={16} strokeWidth={2} style={{ flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{label}</span>
              {comingSoon && (
                <span style={{ fontSize: 9, fontWeight: 700, color: '#3d4158', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '1px 6px', letterSpacing: '0.05em', lineHeight: 1.6, flexShrink: 0 }}>
                  SOON
                </span>
              )}
            </div>
          )
        })}
      </nav>

      <div style={{ padding: '14px 16px', borderTop: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, background: 'rgba(217,119,6,0.15)', border: '1px solid rgba(217,119,6,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <User size={16} color={T.orange} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.primary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Demo Account</div>
          <div style={{ fontSize: 11, color: T.secondary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>demo@covira.ai</div>
        </div>
        <Settings size={14} color={T.secondary} />
      </div>
    </aside>
  )
}

// ─── useCountUp ───────────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 1100): number {
  const [val, setVal] = useState(0)
  useEffect(() => {
    let raf: number
    const t0 = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1)
      setVal(Math.round(target * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return val
}

// ─── MetricCard (mirrors app/dashboard/page.tsx MetricCard) ──────────────────

function MetricCard({ label, target, tag, tagColor, icon: Icon, isIssues = false }: {
  label: string; target: number; tag: string; tagColor: 'green' | 'orange'; icon: React.ElementType; isIssues?: boolean
}) {
  const val = useCountUp(target)
  const [hov, setHov] = useState(false)
  const accent    = tagColor === 'green' ? T.green  : T.orange
  const tagBg     = tagColor === 'green' ? 'rgba(34,197,94,0.10)'  : 'rgba(217,119,6,0.10)'
  const tagBorder = tagColor === 'green' ? 'rgba(34,197,94,0.20)'  : 'rgba(217,119,6,0.20)'
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ flex: 1, minWidth: 0, background: T.card, border: `1px solid ${T.border}`, borderTop: `2px solid ${hov ? T.orange : 'transparent'}`, borderRadius: 12, padding: '20px 22px', position: 'relative', transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-top-color 0.2s ease', transform: hov ? 'translateY(-2px)' : 'none', boxShadow: hov ? '0 12px 40px rgba(0,0,0,0.55)' : '0 2px 8px rgba(0,0,0,0.2)' }}
    >
      <div style={{ position: 'absolute', top: 18, right: 18, width: 30, height: 30, borderRadius: 8, background: 'rgba(217,119,6,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={14} color={T.orange} strokeWidth={2} style={{ opacity: 0.6 }} />
      </div>
      <div style={{ fontSize: 12, color: T.secondary, fontWeight: 500, marginBottom: 10 }}>{label}</div>
      <div style={{ fontSize: 33, fontWeight: 800, color: T.primary, lineHeight: 1, marginBottom: 12, letterSpacing: '-1px' }}>{val}</div>
      <div className={isIssues ? 'issues-badge' : ''} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: tagBg, color: accent, border: `1px solid ${tagBorder}`, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>
        {tag}
      </div>
    </div>
  )
}

// ─── AnimatedDonut (mirrors app/dashboard/page.tsx) ───────────────────────────

function AnimatedDonut() {
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    setProgress(0)
    let raf: number
    const t0 = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - t0) / 1050, 1)
      setProgress(1 - Math.pow(1 - p, 3))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const R = 70, cx = 100, cy = 100, C = 2 * Math.PI * R
  const segments = [
    { pct: 38/52, color: T.green,  label: 'Compliant',    count: 38 },
    { pct:  9/52, color: T.orange, label: 'Issues Found', count:  9 },
    { pct:  5/52, color: T.blue,   label: 'Expiring Soon',count:  5 },
  ]
  let cum = 0
  const arcs = segments.map(seg => {
    const start = cum, end = cum + seg.pct
    let drawn = 0
    if (progress >= end) drawn = seg.pct * C
    else if (progress > start) drawn = (progress - start) * C
    cum += seg.pct
    return { ...seg, dash: drawn, gap: C - drawn, rotation: start * 360 - 90 }
  })

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
      <div style={{ position: 'relative', width: 200, height: 200, flexShrink: 0 }}>
        <svg width="200" height="200" viewBox="0 0 200 200" style={{ overflow: 'visible' }}>
          <circle cx={cx} cy={cy} r={R} fill="none" stroke="#1a1a2e" strokeWidth={24} />
          {arcs.map((arc, i) => (
            <circle key={i} cx={cx} cy={cy} r={R} fill="none" stroke={arc.color} strokeWidth={24}
              strokeDasharray={`${arc.dash} ${arc.gap}`} strokeLinecap="butt"
              style={{ transform: `rotate(${arc.rotation}deg)`, transformOrigin: `${cx}px ${cy}px` }}
            />
          ))}
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', pointerEvents: 'none' }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: T.primary, lineHeight: 1.1, letterSpacing: '-1px' }}>{Math.round(73 * progress)}%</div>
          <div style={{ fontSize: 12, color: T.secondary, marginTop: 4 }}>Compliant</div>
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {segments.map(seg => (
          <div key={seg.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 9, height: 9, borderRadius: '50%', background: seg.color, flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: T.secondary }}>{seg.label}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: T.primary }}>{seg.count}</span>
              <span style={{ fontSize: 11, color: T.muted, background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}`, borderRadius: 4, padding: '1px 7px' }}>
                {Math.round(seg.pct * 100)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── StatusBadge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES['Pending Review']
  return (
    <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
      {status}
    </span>
  )
}

// ─── DemoFilterSelect ─────────────────────────────────────────────────────────

function DemoFilterSelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div style={{ position: 'relative' }}>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 32px 8px 12px', fontSize: 13, color: T.primary, cursor: 'pointer', appearance: 'none', outline: 'none', minWidth: 148, transition: 'border-color 0.15s' }}
        onFocus={e => (e.target.style.borderColor = T.orange)}
        onBlur={e => (e.target.style.borderColor = T.border)}
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown size={13} color={T.secondary} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
    </div>
  )
}

// ─── ActionItem (extracted to avoid hook-in-map) ─────────────────────────────

function ActionItem({ text, idx, mounted, onAction }: { text: string; idx: number; mounted: boolean; onAction: () => void }) {
  const [hov, setHov] = useState(false)
  return (
    <div onClick={onAction} className={mounted ? 'action-animate' : 'pre-animate'}
      style={{ display: 'flex', alignItems: 'flex-start', gap: 11, padding: '11px 13px', background: hov ? 'rgba(217,119,6,0.10)' : 'rgba(217,119,6,0.05)', border: `1px solid ${hov ? 'rgba(217,119,6,0.25)' : 'rgba(217,119,6,0.12)'}`, borderRadius: 9, cursor: 'pointer', animationDelay: `${idx * 80 + 150}ms`, transition: 'background 0.15s, border-color 0.15s' }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
    >
      <AlertTriangle size={14} color={T.orange} style={{ flexShrink: 0, marginTop: 1 }} />
      <span style={{ fontSize: 13, color: T.primary, lineHeight: 1.5, fontWeight: 500, flex: 1 }}>{text}</span>
      <ArrowRight size={12} color={T.secondary} style={{ flexShrink: 0, opacity: hov ? 1 : 0, marginTop: 2, transition: 'opacity 0.15s' }} />
    </div>
  )
}

// ─── Dashboard Tab (mirrors app/dashboard/page.tsx) ───────────────────────────

function DashboardView({ mounted, onAction }: { mounted: boolean; onAction: () => void }) {
  const [hovAI, setHovAI] = useState(false)
  return (
    <div style={{ padding: 24, paddingBottom: 340 }}>
      <div className="demo-highlight" style={{ display: 'flex', gap: 14, marginBottom: 22, borderRadius: 12 }}>
        <MetricCard label="Total Vendors" target={TOTAL}     tag={`${TOTAL} total`} tagColor="green"  icon={Users}         />
        <MetricCard label="Compliant"     target={COMPLIANT} tag="73%"               tagColor="green"  icon={CheckCircle2}  />
        <MetricCard label="Issues Found"  target={ISSUES}    tag="Review needed"     tagColor="orange" icon={AlertTriangle} isIssues />
        <MetricCard label="Expiring Soon" target={EXPIRING}  tag="Action needed"     tagColor="orange" icon={Clock}         />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 310px', gap: 18, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Compliance Overview */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24, transition: 'border-color 0.2s, box-shadow 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = T.borderAccent; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.4)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.boxShadow = 'none' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: T.primary, margin: 0 }}>Compliance Overview</h2>
              <button style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.border}`, borderRadius: 6, padding: '5px 10px', fontSize: 12, color: T.secondary, cursor: 'default', transition: 'border-color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = T.borderAccent)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = T.border)}
              >
                This Month <ChevronDown size={11} />
              </button>
            </div>
            <AnimatedDonut />
          </div>
          {/* Recent Submissions */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24, transition: 'border-color 0.2s, box-shadow 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = T.borderAccent; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.4)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.boxShadow = 'none' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: T.primary, margin: 0 }}>Recent Submissions</h2>
              <button onClick={onAction} style={{ fontSize: 13, color: T.orange, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, padding: 0 }}>View all →</button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>{['Vendor', 'COI Uploaded', 'Status', 'Issues', 'Expiration Date'].map(col => (
                    <th key={col} style={{ textAlign: 'left', padding: '0 12px 12px', fontSize: 10, color: T.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{col}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {SUBMISSIONS.map((row, i) => (
                    <tr key={i} className={mounted ? 'row-animate' : 'pre-animate'} onClick={onAction}
                      style={{ cursor: 'pointer', animationDelay: `${i * 60}ms`, transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#1a1a2e')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '13px 12px', borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: T.primary }}>{row.vendor}</span>
                      </td>
                      <td style={{ padding: '13px 12px', fontSize: 12, color: T.secondary, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{row.uploaded}</td>
                      <td style={{ padding: '13px 12px', borderBottom: `1px solid ${T.border}` }}><StatusBadge status={row.status} /></td>
                      <td style={{ padding: '13px 12px', fontSize: 13, fontWeight: 700, color: row.issues > 0 ? T.orange : T.muted, borderBottom: `1px solid ${T.border}`, textAlign: 'center' }}>{row.issues}</td>
                      <td style={{ padding: '13px 12px', fontSize: 12, color: T.secondary, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{row.policyPeriod.split(' – ')[1] || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        {/* Action Items */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 22, transition: 'border-color 0.2s, box-shadow 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = T.borderAccent; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.4)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.boxShadow = 'none' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: T.primary, margin: 0 }}>Action Items</h2>
            <button onClick={onAction} style={{ fontSize: 13, color: T.orange, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, padding: 0 }}>View all →</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {ACTION_ITEMS.map((text, i) => (
              <ActionItem key={i} text={text} idx={i} mounted={mounted} onAction={onAction} />
            ))}
          </div>
          <div style={{ marginTop: 16, padding: '11px 13px', background: 'rgba(255,255,255,0.025)', border: `1px solid ${T.border}`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={13} color={T.secondary} />
              <span style={{ fontSize: 12, color: T.secondary }}>Total open items</span>
            </div>
            <span style={{ background: 'rgba(217,119,6,0.12)', color: T.orange, fontSize: 12, fontWeight: 700, borderRadius: 20, padding: '2px 10px', border: '1px solid rgba(217,119,6,0.20)' }}>
              {ACTION_ITEMS.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Vendors Tab (mirrors app/vendors/page.tsx) ───────────────────────────────

function VendorsView({ onAction }: { onAction: () => void }) {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('All')
  const [filterType,   setFilterType]   = useState('All')

  const filtered = VENDORS.filter(v => {
    if (search && !v.name.toLowerCase().includes(search.toLowerCase())) return false
    if (filterStatus !== 'All' && v.status !== filterStatus) return false
    if (filterType   !== 'All' && v.type   !== filterType)   return false
    return true
  })

  return (
    <div style={{ padding: 24, paddingBottom: 340 }}>
      {/* Search + filters row */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: 220 }}>
          <Search size={14} color={T.muted} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input type="text" placeholder="Search vendors..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px 8px 36px', fontSize: 13, color: T.primary, outline: 'none', boxSizing: 'border-box' }}
            onFocus={e => (e.target.style.borderColor = T.orange)}
            onBlur={e => (e.target.style.borderColor = T.border)}
          />
        </div>
        <DemoFilterSelect value={filterStatus} onChange={setFilterStatus} options={['All', 'Compliant', 'Issues Found', 'Expiring Soon', 'Pending Review']} />
        <DemoFilterSelect value={filterType}   onChange={setFilterType}   options={['All', 'Plumbing', 'Electrical', 'HVAC', 'Roofing', 'Janitorial', 'General Contractor', 'Flooring']} />
        <DemoFilterSelect value="All"          onChange={() => {}}        options={['All', 'This Month', 'Next 30 Days', 'Next 90 Days']} />
      </div>

      {/* Table */}
      <div className="demo-highlight" style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {['Vendor Name', 'Type', 'Status', 'Expiration Date', 'Issues', 'Last Uploaded', 'Actions'].map(col => (
                  <th key={col} style={{ textAlign: 'left', padding: '14px 16px', fontSize: 11, color: T.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((v, i) => (
                <tr key={i} style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${T.border}` : 'none', transition: 'background 0.12s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Building2 size={14} color={T.muted} />
                      <span style={{ fontSize: 14, fontWeight: 600, color: T.primary }}>{v.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: T.secondary, whiteSpace: 'nowrap' }}>{v.type}</td>
                  <td style={{ padding: '14px 16px' }}><StatusBadge status={v.status} /></td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: T.secondary, whiteSpace: 'nowrap' }}>{v.exp}</td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: v.issues > 0 ? T.orange : T.muted }}>{v.issues}</span>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: T.muted, whiteSpace: 'nowrap' }}>{v.last}</td>
                  <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={onAction}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(217,119,6,0.10)', color: T.orange, border: '1px solid rgba(217,119,6,0.25)', fontSize: 12, fontWeight: 600, padding: '6px 12px', borderRadius: 6, cursor: 'pointer', transition: 'background 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(217,119,6,0.20)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(217,119,6,0.10)')}
                      >
                        <Upload size={12} /> Upload COI
                      </button>
                      <button onClick={onAction}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.04)', color: T.secondary, border: `1px solid ${T.border}`, fontSize: 12, fontWeight: 600, padding: '6px 12px', borderRadius: 6, cursor: 'pointer', transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = T.primary }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = T.secondary }}
                      >
                        <Eye size={12} /> View
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '12px 16px', borderTop: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, color: T.secondary }}>Showing {filtered.length} of {VENDORS.length} vendors</span>
        </div>
      </div>
    </div>
  )
}

// ─── Submissions Tab (mirrors app/submissions/page.tsx) ───────────────────────

function SubmissionsView({ mounted, onAction }: { mounted: boolean; onAction: () => void }) {
  const [search,       setSearch]  = useState('')
  const [statusFilter, setStatus]  = useState('All')
  const [dateFilter,   setDate]    = useState('All Time')

  const filtered = SUBMISSIONS.filter(s => {
    if (search && !s.vendor.toLowerCase().includes(search.toLowerCase())) return false
    if (statusFilter !== 'All' && s.status !== statusFilter) return false
    return true
  })

  const total     = SUBMISSIONS.length
  const compliant = SUBMISSIONS.filter(s => s.status === 'Compliant').length
  const issues    = SUBMISSIONS.filter(s => s.status === 'Issues Found').length
  const pending   = 0

  return (
    <div style={{ padding: 28, paddingBottom: 340 }}>
      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 220 }}>
          <Search size={14} color={T.muted} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input type="text" placeholder="Search submissions..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px 8px 36px', fontSize: 13, color: T.primary, outline: 'none', transition: 'border-color 0.15s', boxSizing: 'border-box' }}
            onFocus={e => (e.target.style.borderColor = T.orange)}
            onBlur={e => (e.target.style.borderColor = T.border)}
          />
        </div>
        <DemoFilterSelect value={statusFilter} onChange={setStatus} options={['All', 'Compliant', 'Issues Found', 'Expiring Soon', 'Pending Review']} />
        <DemoFilterSelect value={dateFilter}   onChange={setDate}   options={['This Month', 'Last 3 Months', 'This Year', 'All Time']} />
        <button onClick={onAction}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'none', border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 500, color: T.secondary, cursor: 'pointer', transition: 'border-color 0.15s, color 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = T.borderAccent; e.currentTarget.style.color = T.primary }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.secondary }}
        >
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* Summary stats bar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Total',        value: total,     pct: null,                                      color: T.secondary },
          { label: 'Compliant',    value: compliant, pct: Math.round(compliant/total*100),           color: T.green    },
          { label: 'Issues Found', value: issues,    pct: Math.round(issues/total*100),              color: T.orange   },
          { label: 'Pending',      value: pending,   pct: 0,                                        color: T.blue     },
        ].map(stat => (
          <div key={stat.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '7px 14px' }}>
            <span style={{ fontSize: 12, color: T.secondary }}>{stat.label}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: stat.color }}>{stat.value}</span>
            {stat.pct !== null && (
              <span style={{ fontSize: 11, color: T.muted, background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}`, borderRadius: 4, padding: '1px 6px' }}>{stat.pct}%</span>
            )}
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="demo-highlight" style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {['Vendor', 'COI Uploaded', 'Policy Period', 'Status', 'Issues', 'Score', 'Actions'].map(col => (
                  <th key={col} style={{ textAlign: 'left', padding: '12px 16px', fontSize: 10, color: T.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap' }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, i) => (
                <tr key={i} className={mounted ? 'row-animate' : 'pre-animate'} onClick={onAction}
                  style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${T.border}` : 'none', cursor: 'pointer', animationDelay: `${i * 60}ms`, transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#1a1a2e')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 7, flexShrink: 0, background: 'rgba(217,119,6,0.08)', border: '1px solid rgba(217,119,6,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FileText size={12} color={T.orange} style={{ opacity: 0.7 }} />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: T.primary }}>{row.vendor}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 12, color: T.secondary, whiteSpace: 'nowrap' }}>{row.uploaded}</td>
                  <td style={{ padding: '14px 16px', fontSize: 12, color: T.secondary, whiteSpace: 'nowrap' }}>{row.policyPeriod}</td>
                  <td style={{ padding: '14px 16px' }}><StatusBadge status={row.status} /></td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: row.issues > 0 ? T.orange : T.muted }}>{row.issues}</span>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: scoreColor(row.score), letterSpacing: '-0.3px' }}>{row.score}</span>
                  </td>
                  <td style={{ padding: '14px 16px' }} onClick={e => e.stopPropagation()}>
                    <button onClick={onAction}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.04)', color: T.secondary, border: `1px solid ${T.border}`, borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(217,119,6,0.10)'; e.currentTarget.style.color = T.orange; e.currentTarget.style.borderColor = 'rgba(217,119,6,0.25)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = T.secondary; e.currentTarget.style.borderColor = T.border }}
                    >
                      <Eye size={12} /> View Report
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '11px 16px', borderTop: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, color: T.muted }}>Showing {filtered.length} of {SUBMISSIONS.length} submissions</span>
          <button onClick={onAction} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: T.orange, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
            <Upload size={12} /> Upload new COI
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Reports Tab (mirrors app/reports/page.tsx) ───────────────────────────────

function DemoComplianceChart({ data }: { data: Array<{ label: string; pct: number }> }) {
  const [animated, setAnimated] = useState(false)
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 80); return () => clearTimeout(t) }, [])
  const maxPct = Math.max(...data.map(m => m.pct), 1)
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', height: 160, paddingTop: 24 }}>
      {data.map((m, i) => {
        const heightPct = (m.pct / maxPct) * 100
        const isHighest = m.pct === maxPct && m.pct > 0
        return (
          <div key={m.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: m.pct === 0 ? T.muted : isHighest ? T.orange : T.secondary, transition: 'opacity 0.4s ease', opacity: animated ? 1 : 0, transitionDelay: `${i * 80 + 300}ms` }}>
              {m.pct > 0 ? `${m.pct}%` : '—'}
            </span>
            <div style={{ flex: 1, width: '100%', borderRadius: 5, background: 'rgba(255,255,255,0.04)', position: 'relative', overflow: 'hidden', minHeight: 80 }}>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, borderRadius: 5, background: isHighest ? `linear-gradient(180deg, ${T.orange}, rgba(217,119,6,0.6))` : `linear-gradient(180deg, rgba(217,119,6,0.55), rgba(217,119,6,0.25))`, height: animated ? `${heightPct}%` : '0%', transition: 'height 0.75s cubic-bezier(0.34,1.56,0.64,1)', transitionDelay: `${i * 80}ms` }} />
            </div>
            <span style={{ fontSize: 11, color: T.muted, fontWeight: 500 }}>{m.label}</span>
          </div>
        )
      })}
    </div>
  )
}

function DemoTopIssuesChart({ issues }: { issues: Array<{ label: string; count: number }> }) {
  const [animated, setAnimated] = useState(false)
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 120); return () => clearTimeout(t) }, [])
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
            <div style={{ height: '100%', borderRadius: 3, background: T.orange, width: animated ? `${(issue.count / maxCount) * 100}%` : '0%', transition: 'width 0.6s ease', transitionDelay: `${i * 80}ms` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function DemoStatCard({ label, value, sub, trendDir }: { label: string; value: string; sub: string; trendDir?: 'positive' | 'negative' | 'neutral' }) {
  const color = trendDir === 'positive' ? T.green : trendDir === 'negative' ? T.red : T.orange
  const TrendIcon = trendDir === 'negative' ? TrendingDown : TrendingUp
  return (
    <div style={{ flex: 1, minWidth: 0, background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: '20px 22px', transition: 'border-color 0.2s, transform 0.2s, box-shadow 0.2s' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = T.borderAccent; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.4)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
    >
      <p style={{ fontSize: 12, color: T.secondary, fontWeight: 500, margin: '0 0 10px' }}>{label}</p>
      <p style={{ fontSize: 32, fontWeight: 800, color: T.primary, margin: '0 0 10px', letterSpacing: '-1.5px', lineHeight: 1 }}>{value}</p>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: `${color}18`, color, border: `1px solid ${color}30`, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>
        {trendDir && <TrendIcon size={11} strokeWidth={2.5} />}
        {sub}
      </div>
    </div>
  )
}

function ReportsView({ onAction }: { onAction: () => void }) {
  const [dateRange, setDateRange] = useState('This Month')
  const DATE_RANGES = ['This Week', 'This Month', 'Last 3 Months', 'This Year']

  return (
    <div style={{ padding: 28, paddingBottom: 340 }}>
      {/* Date range pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {DATE_RANGES.map(dr => {
          const active = dateRange === dr
          return (
            <button key={dr} onClick={() => setDateRange(dr)}
              style={{ background: active ? T.orange : T.card, color: active ? '#fff' : T.secondary, border: `1px solid ${active ? T.orange : T.border}`, borderRadius: 8, padding: '7px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = T.borderAccent; e.currentTarget.style.color = T.primary } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.secondary } }}
            >
              {dr}
            </button>
          )
        })}
      </div>

      {/* Stat cards */}
      <div className="demo-highlight" style={{ display: 'flex', gap: 14, marginBottom: 20, borderRadius: 12 }}>
        <DemoStatCard label="COIs Analyzed"   value="22"  sub="48 total all time"          trendDir="positive" />
        <DemoStatCard label="Compliance Rate" value="73%" sub="16 of 22 compliant"         trendDir="positive" />
        <DemoStatCard label="Issues Detected" value="11"  sub="6 submissions with flags"   trendDir="negative" />
        <DemoStatCard label="Avg Risk Score"  value="83"  sub="Low overall risk"            trendDir="positive" />
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 18, alignItems: 'start' }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Compliance trend chart */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24, transition: 'border-color 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = T.borderAccent)}
            onMouseLeave={e => (e.currentTarget.style.borderColor = T.border)}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: T.primary, margin: 0 }}>Compliance Rate Over Time</h2>
              <span style={{ fontSize: 11, color: T.muted }}>Last 6 months</span>
            </div>
            <p style={{ fontSize: 12, color: T.muted, margin: '0 0 4px' }}>Monthly compliance percentage across your COI submissions</p>
            <DemoComplianceChart data={MONTHLY_COMPLIANCE} />
          </div>

          {/* Top issues */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24, transition: 'border-color 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = T.borderAccent)}
            onMouseLeave={e => (e.currentTarget.style.borderColor = T.border)}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: T.primary, margin: 0 }}>Most Common Issues</h2>
              <span style={{ fontSize: 11, color: T.muted }}>{dateRange}</span>
            </div>
            <DemoTopIssuesChart issues={TOP_ISSUES} />
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Vendor Risk Summary */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24, transition: 'border-color 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = T.borderAccent)}
            onMouseLeave={e => (e.currentTarget.style.borderColor = T.border)}
          >
            <h2 style={{ fontSize: 14, fontWeight: 700, color: T.primary, margin: '0 0 18px' }}>Vendor Risk Summary</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 44px 90px', gap: 8, padding: '0 0 8px', borderBottom: `1px solid ${T.border}`, marginBottom: 4 }}>
              {['Vendor', 'Score', 'Status'].map(col => (
                <span key={col} style={{ fontSize: 10, color: T.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{col}</span>
              ))}
            </div>
            {VENDOR_RISK.map((v, i) => {
              const risk = riskLabel(v.score)
              return (
                <div key={v.name} onClick={onAction}
                  style={{ display: 'grid', gridTemplateColumns: '1fr 44px 90px', gap: 8, padding: '11px 4px', borderBottom: i < VENDOR_RISK.length - 1 ? `1px solid ${T.border}` : 'none', transition: 'background 0.12s', borderRadius: 4, margin: '0 -4px', cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#1a1a2e')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <span style={{ fontSize: 12, fontWeight: 600, color: T.primary, alignSelf: 'center' }}>{v.name}</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: scoreColor(v.score), alignSelf: 'center', letterSpacing: '-0.5px' }}>{v.score}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: risk.color, alignSelf: 'center' }}>{risk.label}</span>
                </div>
              )
            })}
          </div>

          {/* Recent Activity */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24, transition: 'border-color 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = T.borderAccent)}
            onMouseLeave={e => (e.currentTarget.style.borderColor = T.border)}
          >
            <h2 style={{ fontSize: 14, fontWeight: 700, color: T.primary, margin: '0 0 18px' }}>Recent Activity</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {RECENT_ACTIVITY.map((a, i) => (
                <div key={i}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 11, padding: '11px 4px', borderBottom: i < RECENT_ACTIVITY.length - 1 ? `1px solid ${T.border}` : 'none', transition: 'background 0.12s', borderRadius: 4, margin: '0 -4px' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#1a1a2e')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, background: a.ok ? 'rgba(34,197,94,0.10)' : 'rgba(217,119,6,0.10)', border: `1px solid ${a.ok ? 'rgba(34,197,94,0.22)' : 'rgba(217,119,6,0.22)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {a.ok ? <CheckCircle2 size={13} color={T.green} /> : <AlertTriangle size={13} color={T.orange} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: T.primary, margin: '0 0 2px' }}>{a.label}</p>
                    <p style={{ fontSize: 11, color: T.secondary, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.vendor}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                    <Clock size={10} color={T.muted} />
                    <span style={{ fontSize: 11, color: T.muted, whiteSpace: 'nowrap' }}>{a.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Requirements Tab (mirrors app/requirements/page.tsx) ─────────────────────

function RequirementsView() {
  return (
    <div style={{ padding: 24, paddingBottom: 340 }}>
      <div className="demo-highlight" style={{ display: 'flex', flexDirection: 'column', gap: 18, borderRadius: 12 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: T.primary, margin: '0 0 2px' }}>Coverage Minimums</h2>
              <span style={{ fontSize: 12, color: T.secondary }}>Applied automatically to all vendors</span>
            </div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>{['Coverage Type', 'Per Occurrence', 'Aggregate', 'Status'].map(col => (
                <th key={col} style={{ textAlign: 'left', padding: '10px 20px', fontSize: 10, color: T.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{col}</th>
              ))}</tr>
            </thead>
            <tbody>
              {REQUIREMENTS_DATA.map((r, i) => (
                <tr key={r.type} style={{ borderBottom: i < REQUIREMENTS_DATA.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                  <td style={{ padding: '13px 20px', fontSize: 13, fontWeight: 600, color: T.primary }}>{r.type}</td>
                  <td style={{ padding: '13px 20px', fontSize: 13, color: T.secondary }}>{r.perOccurrence}</td>
                  <td style={{ padding: '13px 20px', fontSize: 13, color: T.secondary }}>{r.aggregate}</td>
                  <td style={{ padding: '13px 20px' }}>
                    {r.required
                      ? <span style={{ background: 'rgba(34,197,94,0.09)', color: T.green, border: '1px solid rgba(34,197,94,0.22)', borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>Required</span>
                      : <span style={{ background: 'rgba(255,255,255,0.04)', color: T.muted, border: `1px solid ${T.border}`, borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>Optional</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: T.primary, margin: '0 0 16px' }}>Required Endorsements</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {ENDORSEMENTS_DATA.map(e => (
              <div key={e.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', background: 'rgba(255,255,255,0.02)', border: `1px solid ${e.required ? 'rgba(34,197,94,0.15)' : T.border}`, borderRadius: 9 }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: e.required ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.04)', border: `1px solid ${e.required ? 'rgba(34,197,94,0.28)' : T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {e.required ? <Check size={10} color={T.green} strokeWidth={3} /> : <X size={10} color={T.muted} strokeWidth={2} />}
                </div>
                <span style={{ fontSize: 13, color: e.required ? T.primary : T.secondary, fontWeight: e.required ? 500 : 400, flex: 1 }}>{e.label}</span>
                {e.required && <span style={{ fontSize: 10, color: T.orange, fontWeight: 700, letterSpacing: '0.04em' }}>Required</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Documents Tab (mirrors app/documents/page.tsx) ───────────────────────────

function DocumentsView({ onAction }: { onAction: () => void }) {
  const [search, setSearch] = useState('')
  const filtered = DOCUMENTS_DATA.filter(d =>
    !search || d.vendor.toLowerCase().includes(search.toLowerCase())
  )
  return (
    <div style={{ padding: 24, paddingBottom: 340 }}>
      {/* Filter row */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: 220 }}>
          <Search size={14} color={T.muted} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input type="text" placeholder="Search documents..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px 8px 36px', fontSize: 13, color: T.primary, outline: 'none', boxSizing: 'border-box' }}
            onFocus={e => (e.target.style.borderColor = T.orange)}
            onBlur={e => (e.target.style.borderColor = T.border)}
          />
        </div>
        <DemoFilterSelect value="All Statuses" onChange={() => {}} options={['All Statuses', 'Compliant', 'Issues Found', 'Expiring Soon']} />
        <button onClick={onAction}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: T.orange, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'background 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.background = T.orangeHover)}
          onMouseLeave={e => (e.currentTarget.style.background = T.orange)}
        >
          <Upload size={13} /> Upload COI
        </button>
      </div>

      <div className="demo-highlight" style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: T.primary, margin: '0 0 2px' }}>Document Library</h2>
            <span style={{ fontSize: 12, color: T.secondary }}>{DOCUMENTS_DATA.length} certificates on file</span>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>{['Vendor', 'File', 'Uploaded', 'Expires', 'Status', ''].map((col, i) => (
                <th key={i} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 10, color: T.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{col}</th>
              ))}</tr>
            </thead>
            <tbody>
              {filtered.map((doc, i) => (
                <tr key={i} onClick={onAction}
                  style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${T.border}` : 'none', cursor: 'pointer', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#1a1a2e')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <Building2 size={13} color={T.muted} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: T.primary }}>{doc.vendor}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <FileText size={12} color={T.muted} />
                      <span style={{ fontSize: 12, color: T.secondary }}>{doc.file}</span>
                      <span style={{ fontSize: 10, color: T.muted, background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.border}`, borderRadius: 4, padding: '1px 5px' }}>{doc.size}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: T.secondary, whiteSpace: 'nowrap' }}>{doc.uploaded}</td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: T.secondary, whiteSpace: 'nowrap' }}>{doc.expires}</td>
                  <td style={{ padding: '12px 16px' }}><StatusBadge status={doc.status} /></td>
                  <td style={{ padding: '12px 16px' }}>
                    <button onClick={e => { e.stopPropagation(); onAction() }}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: `1px solid ${T.border}`, borderRadius: 6, padding: '5px 10px', fontSize: 11, color: T.secondary, cursor: 'pointer', transition: 'border-color 0.15s, color 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = T.orange; e.currentTarget.style.color = T.orange }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.secondary }}
                    >
                      <Download size={11} /> Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '11px 16px', borderTop: `1px solid ${T.border}` }}>
          <span style={{ fontSize: 12, color: T.muted }}>Showing {filtered.length} of {DOCUMENTS_DATA.length} documents</span>
        </div>
      </div>
    </div>
  )
}

// ─── TabContent ───────────────────────────────────────────────────────────────

function TabContent({ step, mounted, onAction }: { step: number; mounted: boolean; onAction: () => void }) {
  useEffect(() => {
    const t = setTimeout(() => {
      const el = document.querySelector<HTMLElement>('.demo-highlight')
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }, 80)
    return () => clearTimeout(t)
  }, [step])

  switch (step) {
    case 1: return <DashboardView    mounted={mounted} onAction={onAction} />
    case 2: return <VendorsView      onAction={onAction} />
    case 3: return <SubmissionsView  mounted={mounted} onAction={onAction} />
    case 4: return <ReportsView      onAction={onAction} />
    case 5: return <RequirementsView />
    case 6: return <DocumentsView    onAction={onAction} />
    default: return null
  }
}

// ─── TourCard ─────────────────────────────────────────────────────────────────

function TourCard({ step, onNext, onBack, onExit, onRestart }: {
  step: number; onNext: () => void; onBack: () => void; onExit: () => void; onRestart: () => void
}) {
  const s   = STEPS[step - 1]
  const pct = Math.round((step / 6) * 100)

  return (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 150, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
      <div className="tour-card-outer" style={{ width: '100%', maxWidth: 720, padding: '0 20px 20px', pointerEvents: 'auto' }}>
        <div className="tour-card" style={{ background: '#0d0d16', border: '1px solid rgba(217,119,6,0.28)', borderRadius: 16, padding: '18px 22px', boxShadow: '0 -8px 48px rgba(0,0,0,0.65), 0 0 0 1px rgba(217,119,6,0.08)' }}>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <Shield size={12} color={T.orange} />
              <span style={{ fontSize: 10, fontWeight: 800, color: T.orange, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Covira Tour</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <button onClick={onRestart} title="Restart" style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: T.muted, fontSize: 12, padding: 0, transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = T.secondary)}
                onMouseLeave={e => (e.currentTarget.style.color = T.muted)}
              ><RotateCcw size={12} /></button>
              <button onClick={onExit} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: T.secondary, fontSize: 12, fontWeight: 500, padding: 0, transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = T.primary)}
                onMouseLeave={e => (e.currentTarget.style.color = T.secondary)}
              ><X size={12} /> Exit</button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: T.orange, textTransform: 'uppercase', letterSpacing: '0.09em' }}>Step {step} of 6</span>
            <span style={{ fontSize: 10, color: T.muted }}>{pct}% complete</span>
          </div>
          <div style={{ height: 3, background: T.border, borderRadius: 2, marginBottom: 14 }}>
            <div style={{ height: '100%', width: `${pct}%`, background: T.orange, borderRadius: 2, transition: 'width 0.4s ease' }} />
          </div>

          <h3 style={{ fontSize: 16, fontWeight: 700, color: T.primary, margin: '0 0 7px', lineHeight: 1.3 }}>{s.heading}</h3>
          <p style={{ fontSize: 13, color: T.secondary, margin: '0 0 8px', lineHeight: 1.65 }}>{s.desc}</p>
          {step < 6 && (
            <p style={{ fontSize: 11, color: T.muted, margin: '0 0 14px' }}>
              <span style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Up Next: </span>{s.upNext}
            </p>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button onClick={onBack} disabled={step === 1}
              style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, color: step === 1 ? T.muted : T.secondary, cursor: step === 1 ? 'default' : 'pointer', opacity: step === 1 ? 0.4 : 1, transition: 'border-color 0.15s, color 0.15s' }}
              onMouseEnter={e => { if (step > 1) { e.currentTarget.style.borderColor = T.orange; e.currentTarget.style.color = T.primary } }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.secondary }}
            ><ChevronLeft size={14} /> Back</button>
            <button onClick={onNext}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: T.orange, border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer', transition: 'background 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.background = T.orangeHover)}
              onMouseLeave={e => (e.currentTarget.style.background = T.orange)}
            >{step === 6 ? 'Finish' : 'Next'} <ArrowRight size={14} /></button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Landing Screen ───────────────────────────────────────────────────────────

function LandingScreen({ onStart }: { onStart: () => void }) {
  const [hov, setHov] = useState(false)
  return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', fontFamily: 'Inter, -apple-system, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 540, textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(217,119,6,0.10)', border: '1px solid rgba(217,119,6,0.22)', borderRadius: 100, padding: '5px 14px', marginBottom: 24 }}>
          <Shield size={12} color={T.orange} />
          <span style={{ fontSize: 10, fontWeight: 800, color: T.orange, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Live Demo</span>
        </div>
        <h1 style={{ fontSize: 'clamp(30px, 5vw, 46px)', fontWeight: 800, color: T.primary, margin: '0 0 14px', letterSpacing: '-1.5px', lineHeight: 1.1 }}>
          See Covira in Action
        </h1>
        <p style={{ fontSize: 16, color: T.secondary, margin: '0 0 36px', lineHeight: 1.65 }}>
          A 2-minute guided tour of the real product — filled with sample data so you see exactly what a live account looks like.
        </p>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: '20px 24px', marginBottom: 32, textAlign: 'left' }}>
          {[
            'Vendor compliance dashboard with real-time status',
            'Vendor table with search, filters, and COI actions',
            'Submission history with risk scores and policy periods',
            'Compliance analytics — trend charts, issue breakdown, vendor risk',
            'Coverage requirements and endorsement enforcement',
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: i < 4 ? 12 : 0 }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                <Check size={10} color={T.green} strokeWidth={3} />
              </div>
              <span style={{ fontSize: 14, color: T.secondary, lineHeight: 1.5 }}>{item}</span>
            </div>
          ))}
        </div>
        <button onClick={onStart} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: hov ? T.orangeHover : T.orange, color: '#fff', fontSize: 16, fontWeight: 700, padding: '15px 32px', borderRadius: 10, border: 'none', cursor: 'pointer', transition: 'background 0.15s', marginBottom: 14 }}
        >
          Start Guided Tour <ArrowRight size={16} />
        </button>
        <Link href="/" style={{ fontSize: 13, color: T.secondary, textDecoration: 'none', transition: 'color 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.color = T.primary)}
          onMouseLeave={e => (e.currentTarget.style.color = T.secondary)}
        >
          ← Back to covira.ai
        </Link>
      </div>
    </div>
  )
}

// ─── Completion Screen ────────────────────────────────────────────────────────

function CompletionScreen({ onRestart }: { onRestart: () => void }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => { const t = setTimeout(() => setVisible(true), 60); return () => clearTimeout(t) }, [])

  const DONE = [
    'Vendor portfolio dashboard with compliance metrics',
    'Vendor database with search, filtering, and COI actions',
    'Submission history with risk scores and policy periods',
    'Compliance analytics — trend charts and issue breakdown',
    'Coverage requirements configuration and enforcement',
    'Organized document library with download access',
  ]

  return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', fontFamily: 'Inter, -apple-system, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 500, textAlign: 'center' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(34,197,94,0.12)', border: '2px solid rgba(34,197,94,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', transform: visible ? 'scale(1)' : 'scale(0)', opacity: visible ? 1 : 0, transition: 'transform 0.45s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease' }}>
          <Check size={34} color={T.green} strokeWidth={2.5} />
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: T.primary, margin: '0 0 8px', letterSpacing: '-0.8px' }}>
          You&apos;ve seen how Covira works
        </h1>
        <p style={{ fontSize: 15, color: T.secondary, margin: '0 0 26px' }}>Here&apos;s what you just explored:</p>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: '20px 24px', marginBottom: 26, textAlign: 'left' }}>
          {DONE.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: i < DONE.length - 1 ? 11 : 0 }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Check size={10} color={T.green} strokeWidth={3} />
              </div>
              <span style={{ fontSize: 14, color: T.secondary }}>{item}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          <Link href="/sign-up" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: T.orange, color: '#fff', fontSize: 15, fontWeight: 700, padding: '14px 28px', borderRadius: 10, textDecoration: 'none' }}>
            Start Verifying Free <ArrowRight size={15} />
          </Link>
          <a href="https://calendly.com/charles-covira/30min" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', color: T.primary, fontSize: 14, fontWeight: 600, padding: '13px 28px', borderRadius: 10, textDecoration: 'none', border: `1px solid ${T.border}` }}>
            Book a Consultation
          </a>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
          <Link href="/pricing" style={{ fontSize: 13, color: T.secondary, textDecoration: 'none', transition: 'color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.color = T.orange)}
            onMouseLeave={e => (e.currentTarget.style.color = T.secondary)}
          >View Pricing →</Link>
          <button onClick={onRestart} style={{ fontSize: 13, color: T.secondary, background: 'none', border: 'none', cursor: 'pointer', padding: 0, transition: 'color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.color = T.orange)}
            onMouseLeave={e => (e.currentTarget.style.color = T.secondary)}
          >Try Tour Again →</button>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DemoPage() {
  const [phase,   setPhase]   = useState<Phase>('landing')
  const [step,    setStep]    = useState(1)
  const [mounted, setMounted] = useState(false)
  const [toast,   setToast]   = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const showToast   = () => { setToast(true); setTimeout(() => setToast(false), 3200) }
  const startTour   = () => { setStep(1); setPhase('tour') }
  const exitTour    = () => setPhase('landing')
  const restartTour = () => setStep(1)
  const nextStep    = () => { if (step < 6) setStep(s => s + 1); else setPhase('done') }
  const prevStep    = () => { if (step > 1) setStep(s => s - 1) }

  if (phase === 'landing') return <LandingScreen onStart={startTour} />
  if (phase === 'done')    return <CompletionScreen onRestart={startTour} />

  const activeTab = STEP_TO_NAV[step - 1]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: T.bg, fontFamily: 'Inter, -apple-system, sans-serif', color: T.primary }}>
      <style>{`
        @keyframes fadeSlideUp   { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideInRight  { from { opacity: 0; transform: translateX(16px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes issueGlow     { 0%, 100% { box-shadow: 0 0 0 0 rgba(217,119,6,0); } 50% { box-shadow: 0 0 10px 3px rgba(217,119,6,0.20); } }
        @keyframes bellDot       { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(0.72); opacity: 0.45; } }
        .pre-animate    { opacity: 0; }
        .row-animate    { animation: fadeSlideUp 0.35s ease both; }
        .action-animate { animation: slideInRight 0.35s ease both; }
        .issues-badge   { animation: issueGlow 3.2s ease-in-out infinite; }
        .bell-dot       { animation: bellDot 2.8s ease-in-out infinite; }
        .demo-highlight {
          box-shadow: 0 0 0 3px rgba(59,130,246,0.8), 0 0 28px rgba(59,130,246,0.18) !important;
          border-radius: 12px !important;
        }
        select option { background: #13131f; color: #f8f8f8; }
        @media (max-width: 639px) {
          .tour-card-outer { padding: 0 !important; }
          .tour-card { border-radius: 12px 12px 0 0 !important; }
        }
      `}</style>

      <DemoSidebar activeTab={activeTab} onAction={showToast} />

      <main style={{ marginLeft: 240, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <header style={{ position: 'sticky', top: 0, zIndex: 40, background: T.bg, borderBottom: `1px solid ${T.border}`, height: 64, padding: '0 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 700, color: T.primary, margin: 0, lineHeight: 1.2 }}>{STEP_TITLES[step - 1]}</h1>
            <p style={{ fontSize: 12, color: T.secondary, margin: 0 }}>Welcome back, Demo</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {step === 3 && (
              <button onClick={showToast} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: T.orange, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 12px rgba(217,119,6,0.25)', transition: 'background 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.background = T.orangeHover)}
                onMouseLeave={e => (e.currentTarget.style.background = T.orange)}
              >
                <Upload size={14} /> Upload New COI
              </button>
            )}
            {step === 4 && (
              <button onClick={showToast} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: T.orange, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 12px rgba(217,119,6,0.25)', transition: 'background 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.background = T.orangeHover)}
                onMouseLeave={e => (e.currentTarget.style.background = T.orange)}
              >
                <Download size={14} /> Export Report
              </button>
            )}
            {step === 2 && (
              <button onClick={showToast} style={{ background: T.orange, color: '#fff', fontSize: 14, fontWeight: 600, padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', transition: 'background 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.background = T.orangeHover)}
                onMouseLeave={e => (e.currentTarget.style.background = T.orange)}
              >
                + Add Vendor
              </button>
            )}
            <button onClick={showToast} style={{ position: 'relative', background: 'none', border: `1px solid ${T.border}`, borderRadius: 8, width: 38, height: 38, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.secondary, transition: 'border-color 0.15s, color 0.15s, background 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.orange; e.currentTarget.style.background = 'rgba(217,119,6,0.06)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = 'none' }}
            >
              <Bell size={17} />
              <span className="bell-dot" style={{ position: 'absolute', top: 9, right: 9, width: 7, height: 7, borderRadius: '50%', background: T.orange, border: `2px solid ${T.bg}` }} />
            </button>
            <Link href="/sign-up" style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(217,119,6,0.15)', border: '1px solid rgba(217,119,6,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', flexShrink: 0 }}>
              <User size={15} color={T.orange} />
            </Link>
          </div>
        </header>

        <TabContent step={step} mounted={mounted} onAction={showToast} />
      </main>

      <TourCard step={step} onNext={nextStep} onBack={prevStep} onExit={exitTour} onRestart={restartTour} />

      {toast && (
        <div style={{ position: 'fixed', bottom: 340, right: 24, zIndex: 300, background: T.card, border: '1px solid rgba(217,119,6,0.25)', borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', animation: 'fadeSlideUp 0.25s ease both' }}>
          <AlertTriangle size={16} color={T.orange} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 14, color: T.primary }}>Sign up to access this feature</span>
          <Link href="/sign-up" style={{ background: T.orange, color: '#fff', fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 6, textDecoration: 'none', marginLeft: 4, flexShrink: 0 }}>Sign Up →</Link>
        </div>
      )}
    </div>
  )
}
