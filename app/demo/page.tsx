'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Shield, LayoutDashboard, Building2, FileText, TrendingUp,
  Bell, ClipboardList, FolderOpen, Puzzle, Settings, User,
  ChevronDown, AlertTriangle, ArrowRight, Users, CheckCircle2,
  Clock, Check, RotateCcw, Upload, X, ChevronLeft,
} from 'lucide-react'

// ─── Theme ────────────────────────────────────────────────────────────────────

const T = {
  bg:        '#0a0a0f',
  surface:   '#0f0f17',
  card:      '#13131f',
  border:    '#1a1a2e',
  orange:    '#D97706',
  green:     '#22c55e',
  blue:      '#3b82f6',
  primary:   '#f8f8f8',
  secondary: '#8b8fa8',
  muted:     '#4b5063',
}

type Phase = 'landing' | 'tour' | 'done'

// ─── Tour Steps ───────────────────────────────────────────────────────────────

const STEPS = [
  {
    heading:  'See your entire vendor portfolio at a glance',
    desc:     'The moment you log in, Covira shows you exactly how many vendors you manage, how many are compliant, how many have issues, and which ones are expiring soon. No digging. No spreadsheets.',
    upNext:   'Spot vendors with compliance issues',
  },
  {
    heading:  'Instantly see which vendors have coverage gaps',
    desc:     'ABC Plumbing LLC has 2 issues flagged. Covira detected that their Additional Insured endorsement is missing and their General Liability is below your required minimum. You know this in seconds — not after something goes wrong.',
    upNext:   'What the full compliance report looks like',
  },
  {
    heading:  'Plain-English compliance reports — no insurance expertise needed',
    desc:     'Every COI upload generates a detailed compliance report. Covira checks coverage limits against your requirements, flags missing endorsements, and gives you a plain-English summary your whole team can understand. This one shows ABC Plumbing is missing Additional Insured and Waiver of Subrogation.',
    upNext:   'How expiration tracking works',
  },
  {
    heading:  'Never miss an expiring policy again',
    desc:     "Covira automatically tracks every policy expiration date across all your vendors. You get flagged 90, 60, and 30 days before anything expires. Bright Services' COI expires in 12 days — Covira already has it in your action items.",
    upNext:   'How to upload a new COI',
  },
  {
    heading:  'Upload any COI in seconds — PDF, photo, or scan',
    desc:     "Drag and drop any COI and Covira's AI reads every coverage detail automatically. General liability limits, endorsements, policy periods, expiration dates — extracted and verified against your requirements in under 15 seconds. No manual data entry.",
    upNext:   'Your vendor database',
  },
  {
    heading:  'Every vendor tracked, every document organized',
    desc:     "Covira keeps a complete compliance history for every vendor. Upload history, past COIs, compliance scores over time, and automatic status updates. When a vendor renews their policy just upload the new COI and Covira handles the rest.",
    upNext:   "You're ready to verify your vendors",
  },
]

// ─── Demo Data ────────────────────────────────────────────────────────────────

const TOTAL = 52, COMPLIANT = 38, ISSUES = 9, EXPIRING = 5

const SUBMISSIONS = [
  { vendor: 'ABC Plumbing LLC',      uploaded: 'May 20, 2025', status: 'Issues Found',  issues: 2, expiration: 'May 22, 2026' },
  { vendor: 'Summit Electric Co.',   uploaded: 'May 19, 2025', status: 'Compliant',     issues: 0, expiration: 'Feb 15, 2027' },
  { vendor: 'Bluewater HVAC',        uploaded: 'May 18, 2025', status: 'Compliant',     issues: 0, expiration: 'Jan 10, 2027' },
  { vendor: 'Pinnacle Roofing Inc.', uploaded: 'May 16, 2025', status: 'Issues Found',  issues: 1, expiration: 'Jun 01, 2026' },
  { vendor: 'Bright Services',       uploaded: 'May 15, 2025', status: 'Expiring Soon', issues: 0, expiration: 'Jun 05, 2025' },
  { vendor: 'ProBuild Contractors',  uploaded: 'May 14, 2025', status: 'Compliant',     issues: 0, expiration: 'Mar 12, 2027' },
]

const ACTION_ITEMS = [
  '3 vendors missing additional insured endorsement',
  '2 COIs expire within the next 30 days',
  '1 vendor has insufficient general liability limits',
  "Bright Services COI expires in 12 days",
]

const VENDORS = [
  { name: 'ABC Plumbing LLC',      type: 'Plumbing',           status: 'Issues Found',  exp: 'May 22, 2026', last: 'May 20, 2025' },
  { name: 'Summit Electric Co.',   type: 'Electrical',         status: 'Compliant',     exp: 'Feb 15, 2027', last: 'May 19, 2025' },
  { name: 'Bluewater HVAC',        type: 'HVAC',               status: 'Compliant',     exp: 'Jan 10, 2027', last: 'May 18, 2025' },
  { name: 'Pinnacle Roofing Inc.', type: 'Roofing',            status: 'Issues Found',  exp: 'Jun 01, 2026', last: 'May 16, 2025' },
  { name: 'Bright Services',       type: 'Janitorial',         status: 'Expiring Soon', exp: 'Jun 05, 2025', last: 'May 15, 2025' },
  { name: 'ProBuild Contractors',  type: 'General Contractor', status: 'Compliant',     exp: 'Mar 12, 2027', last: 'May 14, 2025' },
  { name: 'Metro Painting Co.',    type: 'Flooring',           status: 'Pending Review',exp: '—',            last: '—'            },
  { name: 'FastFix Maintenance',   type: 'General Contractor', status: 'Compliant',     exp: 'Dec 20, 2026', last: 'Apr 30, 2025' },
]

const REQUIREMENTS = [
  { label: 'General Liability',     req: '$1M / $2M', pass: true,  note: '$2M provided' },
  { label: 'Auto Liability',        req: '$1M',       pass: true,  note: '$1M provided' },
  { label: "Workers' Compensation", req: 'Statutory', pass: true,  note: 'Statutory'    },
  { label: 'Additional Insured',    req: 'Required',  pass: false, note: 'Missing'      },
  { label: 'Waiver of Subrogation', req: 'Required',  pass: false, note: 'Missing'      },
]

const STATUS_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  'Compliant':      { bg: 'rgba(34,197,94,0.09)',  color: '#22c55e', border: 'rgba(34,197,94,0.22)'   },
  'Issues Found':   { bg: 'rgba(217,119,6,0.09)',  color: '#D97706', border: 'rgba(217,119,6,0.22)'   },
  'Expiring Soon':  { bg: 'rgba(251,191,36,0.09)', color: '#fbbf24', border: 'rgba(251,191,36,0.22)'  },
  'Pending Review': { bg: 'rgba(139,140,248,0.09)',color: '#8b8cf8', border: 'rgba(139,140,248,0.2)'  },
}

// ─── Demo Sidebar ─────────────────────────────────────────────────────────────

const DEMO_NAV = [
  { Icon: LayoutDashboard, label: 'Dashboard'    },
  { Icon: Building2,       label: 'Vendors'      },
  { Icon: FileText,        label: 'Submissions'  },
  { Icon: TrendingUp,      label: 'Reports'      },
  { Icon: Bell,            label: 'Alerts'       },
  { Icon: ClipboardList,   label: 'Requirements' },
  { Icon: FolderOpen,      label: 'Documents'    },
  { Icon: Puzzle,          label: 'Integrations' },
  { Icon: Settings,        label: 'Settings'     },
]

function DemoSidebar({ onAction }: { onAction: () => void }) {
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
        {DEMO_NAV.map(({ Icon, label }, i) => {
          const active = i === 0
          return (
            <div key={label} onClick={active ? undefined : onAction}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 8, marginBottom: 2,
                background: active ? 'rgba(217,119,6,0.10)' : 'transparent',
                borderLeft: `2px solid ${active ? T.orange : 'transparent'}`,
                color: active ? T.orange : T.secondary,
                fontSize: 14, fontWeight: active ? 600 : 500,
                cursor: active ? 'default' : 'pointer',
                transition: 'background 0.15s, color 0.15s',
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = T.primary } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.secondary } }}
            >
              <Icon size={16} strokeWidth={2} />{label}
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

// ─── MetricCard ───────────────────────────────────────────────────────────────

function MetricCard({ label, target, tag, tagColor, icon: Icon, isIssues = false }: {
  label: string; target: number; tag: string; tagColor: 'green' | 'orange'; icon: React.ElementType; isIssues?: boolean
}) {
  const val = useCountUp(target)
  const [hov, setHov] = useState(false)
  const accent     = tagColor === 'green' ? T.green  : T.orange
  const tagBg      = tagColor === 'green' ? 'rgba(34,197,94,0.10)'  : 'rgba(217,119,6,0.10)'
  const tagBorder  = tagColor === 'green' ? 'rgba(34,197,94,0.20)'  : 'rgba(217,119,6,0.20)'
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

// ─── AnimatedDonut ────────────────────────────────────────────────────────────

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
    { pct: 38 / 52, color: T.green,  label: 'Compliant',     count: 38 },
    { pct:  9 / 52, color: T.orange, label: 'Issues Found',  count:  9 },
    { pct:  5 / 52, color: T.blue,   label: 'Expiring Soon', count:  5 },
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
                {`${Math.round(seg.pct * 100)}%`}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Submissions Table ────────────────────────────────────────────────────────

function SubmissionsTable({ highlightRow, onAction, mounted }: { highlightRow: boolean; onAction: () => void; mounted: boolean }) {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24 }}>
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
            {SUBMISSIONS.map((row, i) => {
              const isABC = i === 0 && highlightRow
              return (
                <tr key={i}
                  className={mounted ? 'row-animate' : 'pre-animate'}
                  onClick={onAction}
                  style={{ cursor: 'pointer', animationDelay: `${i * 60}ms`, background: isABC ? 'rgba(59,130,246,0.07)' : 'transparent', outline: isABC ? '2px solid rgba(59,130,246,0.5)' : 'none', outlineOffset: '-1px', transition: 'background 0.15s' }}
                  onMouseEnter={e => { if (!isABC) e.currentTarget.style.background = '#1a1a2e' }}
                  onMouseLeave={e => { e.currentTarget.style.background = isABC ? 'rgba(59,130,246,0.07)' : 'transparent' }}
                >
                  <td style={{ padding: '13px 12px', borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: T.primary }}>{row.vendor}</span>
                  </td>
                  <td style={{ padding: '13px 12px', fontSize: 12, color: T.secondary, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{row.uploaded}</td>
                  <td style={{ padding: '13px 12px', borderBottom: `1px solid ${T.border}` }}>
                    {row.status === 'Compliant' ? (
                      <span style={{ background: 'rgba(34,197,94,0.09)', color: T.green, border: '1px solid rgba(34,197,94,0.22)', borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>Compliant</span>
                    ) : row.status === 'Expiring Soon' ? (
                      <span style={{ background: 'rgba(251,191,36,0.09)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.22)', borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>Expiring Soon</span>
                    ) : (
                      <span style={{ background: 'rgba(217,119,6,0.09)', color: T.orange, border: '1px solid rgba(217,119,6,0.22)', borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>Issues Found</span>
                    )}
                  </td>
                  <td style={{ padding: '13px 12px', fontSize: 13, fontWeight: 700, color: row.issues > 0 ? T.orange : T.muted, borderBottom: `1px solid ${T.border}`, textAlign: 'center' }}>{row.issues}</td>
                  <td style={{ padding: '13px 12px', fontSize: 12, color: T.secondary, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{row.expiration}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Action Items Panel ───────────────────────────────────────────────────────

function ActionItemsPanel({ highlighted, onAction, mounted }: { highlighted: boolean; onAction: () => void; mounted: boolean }) {
  return (
    <div className={highlighted ? 'demo-highlight' : ''}
      style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 22, transition: 'border-color 0.2s, box-shadow 0.2s' }}
      onMouseEnter={e => { if (!highlighted) { e.currentTarget.style.borderColor = '#2a2a3e'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.4)' } }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = highlighted ? '' : T.border; e.currentTarget.style.boxShadow = 'none' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: T.primary, margin: 0 }}>Action Items</h2>
        <button onClick={onAction} style={{ fontSize: 13, color: T.orange, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, padding: 0 }}>View all →</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {ACTION_ITEMS.map((text, i) => {
          const [hov, setHov] = useState(false)
          return (
            <div key={i} onClick={onAction}
              className={mounted ? 'action-animate' : 'pre-animate'}
              style={{ display: 'flex', alignItems: 'flex-start', gap: 11, padding: '11px 13px', background: hov ? 'rgba(217,119,6,0.10)' : 'rgba(217,119,6,0.05)', border: `1px solid ${hov ? 'rgba(217,119,6,0.25)' : 'rgba(217,119,6,0.12)'}`, borderRadius: 9, cursor: 'pointer', animationDelay: `${i * 80 + 150}ms`, transition: 'background 0.15s, border-color 0.15s' }}
              onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
            >
              <AlertTriangle size={14} color={T.orange} style={{ flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: 13, color: T.primary, lineHeight: 1.5, fontWeight: 500, flex: 1 }}>{text}</span>
              <ArrowRight size={12} color={T.secondary} style={{ flexShrink: 0, opacity: hov ? 1 : 0, marginTop: 2, transition: 'opacity 0.15s' }} />
            </div>
          )
        })}
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
  )
}

// ─── Compliance Report Card (Step 3) ─────────────────────────────────────────

function ComplianceReportCard() {
  return (
    <div className="demo-highlight" style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Building2 size={14} color={T.orange} />
            <h2 style={{ fontSize: 15, fontWeight: 700, color: T.primary, margin: 0 }}>ABC Plumbing LLC</h2>
            <span style={{ background: 'rgba(217,119,6,0.09)', color: T.orange, border: '1px solid rgba(217,119,6,0.22)', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>Issues Found</span>
          </div>
          <div style={{ fontSize: 12, color: T.secondary }}>COI uploaded May 20, 2025 · Expires May 22, 2026</div>
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.orange, background: 'rgba(217,119,6,0.08)', border: '1px solid rgba(217,119,6,0.2)', borderRadius: 8, padding: '5px 10px', flexShrink: 0 }}>2 Issues</div>
      </div>
      <div style={{ borderRadius: 8, overflow: 'hidden', border: `1px solid ${T.border}`, marginBottom: 14 }}>
        <div style={{ padding: '8px 14px', background: 'rgba(255,255,255,0.02)', borderBottom: `1px solid ${T.border}` }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Coverage Requirements</span>
        </div>
        {REQUIREMENTS.map((req, i) => (
          <div key={req.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: i < REQUIREMENTS.length - 1 ? `1px solid ${T.border}` : 'none', background: !req.pass ? 'rgba(217,119,6,0.03)' : 'transparent' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {req.pass ? (
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Check size={10} color={T.green} strokeWidth={3} />
                </div>
              ) : (
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(217,119,6,0.12)', border: '1px solid rgba(217,119,6,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <X size={10} color={T.orange} strokeWidth={3} />
                </div>
              )}
              <span style={{ fontSize: 13, color: req.pass ? T.secondary : T.primary, fontWeight: req.pass ? 400 : 600 }}>{req.label}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: T.muted }}>{req.req}</span>
              <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: req.pass ? 'rgba(34,197,94,0.09)' : 'rgba(217,119,6,0.09)', color: req.pass ? T.green : T.orange, border: `1px solid ${req.pass ? 'rgba(34,197,94,0.22)' : 'rgba(217,119,6,0.22)'}` }}>{req.note}</span>
            </div>
          </div>
        ))}
      </div>
      <div style={{ padding: '12px 14px', background: 'rgba(217,119,6,0.04)', border: '1px solid rgba(217,119,6,0.15)', borderRadius: 8 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: T.orange, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>AI Summary</div>
        <p style={{ fontSize: 13, color: T.secondary, margin: 0, lineHeight: 1.6 }}>
          ABC Plumbing meets general liability and auto coverage minimums. Missing Additional Insured endorsement and Waiver of Subrogation. Request updated certificate before authorizing on-site work.
        </p>
      </div>
    </div>
  )
}

// ─── Upload Card (Step 5) ─────────────────────────────────────────────────────

function UploadCard() {
  return (
    <div className="demo-highlight" style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24 }}>
      <h2 style={{ fontSize: 14, fontWeight: 700, color: T.primary, margin: '0 0 20px' }}>Upload Certificate of Insurance</h2>
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.secondary, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Vendor</label>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 14px' }}>
          <span style={{ fontSize: 14, color: T.primary }}>ABC Plumbing LLC</span>
          <ChevronDown size={14} color={T.secondary} />
        </div>
      </div>
      <div style={{ border: '2px dashed rgba(217,119,6,0.3)', borderRadius: 12, padding: '52px 24px', textAlign: 'center', background: 'rgba(217,119,6,0.03)', marginBottom: 16 }}>
        <div style={{ width: 52, height: 52, borderRadius: 12, background: 'rgba(217,119,6,0.10)', border: '1px solid rgba(217,119,6,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
          <Upload size={22} color={T.orange} />
        </div>
        <div style={{ fontSize: 15, fontWeight: 600, color: T.primary, marginBottom: 6 }}>Drop your COI here</div>
        <div style={{ fontSize: 13, color: T.secondary, marginBottom: 18 }}>PDF, JPG, PNG — any scan or photo works</div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(217,119,6,0.10)', border: '1px solid rgba(217,119,6,0.25)', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 600, color: T.orange }}>
          Browse Files
        </div>
      </div>
      <div style={{ padding: '12px 14px', background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: T.green, flexShrink: 0 }} />
        <span style={{ fontSize: 13, color: T.secondary }}>AI extraction completes in under 15 seconds. No manual data entry needed.</span>
      </div>
    </div>
  )
}

// ─── Vendors Table (Step 6) ───────────────────────────────────────────────────

function VendorsTable({ onAction }: { onAction: () => void }) {
  return (
    <div className="demo-highlight" style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '18px 24px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: T.primary, margin: 0 }}>Vendor Database</h2>
        <span style={{ fontSize: 12, color: T.secondary }}>52 vendors total</span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>{['Vendor Name', 'Type', 'Status', 'COI Expiration', 'Last Upload'].map(col => (
              <th key={col} style={{ textAlign: 'left', padding: '14px 16px 12px', fontSize: 10, color: T.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{col}</th>
            ))}</tr>
          </thead>
          <tbody>
            {VENDORS.map((v, i) => {
              const s = STATUS_STYLES[v.status] || STATUS_STYLES['Pending Review']
              return (
                <tr key={i} onClick={onAction}
                  style={{ borderBottom: i < VENDORS.length - 1 ? `1px solid ${T.border}` : 'none', cursor: 'pointer', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#1a1a2e')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Building2 size={13} color={T.muted} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: T.primary }}>{v.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: T.secondary, whiteSpace: 'nowrap' }}>{v.type}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>{v.status}</span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: T.secondary, whiteSpace: 'nowrap' }}>{v.exp}</td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: T.muted, whiteSpace: 'nowrap' }}>{v.last}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Dashboard (shown behind tour) ───────────────────────────────────────────

function DashboardContent({ step, mounted, onAction }: { step: number; mounted: boolean; onAction: () => void }) {
  useEffect(() => {
    setTimeout(() => {
      const el = document.querySelector<HTMLElement>('.demo-highlight')
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 80)
  }, [step])

  const showDonut       = [1, 2, 4].includes(step)
  const showSubmissions = [1, 2, 3, 4].includes(step)
  const showReport      = step === 3
  const showUpload      = step === 5
  const showVendors     = step === 6

  return (
    <div style={{ padding: 24, paddingBottom: 340 }}>

      {/* Metric cards — highlighted in step 1 */}
      <div className={step === 1 ? 'demo-highlight' : ''}
        style={{ display: 'flex', gap: 14, marginBottom: 22, borderRadius: 12 }}
      >
        <MetricCard label="Total Vendors" target={TOTAL}     tag={`${TOTAL} total`}  tagColor="green"  icon={Users}         />
        <MetricCard label="Compliant"     target={COMPLIANT} tag="73%"                tagColor="green"  icon={CheckCircle2}  />
        <MetricCard label="Issues Found"  target={ISSUES}    tag="Review needed"      tagColor="orange" icon={AlertTriangle} isIssues />
        <MetricCard label="Expiring Soon" target={EXPIRING}  tag="Action needed"      tagColor="orange" icon={Clock}         />
      </div>

      {/* Step 6 — full-width vendors table */}
      {showVendors && <VendorsTable onAction={onAction} />}

      {/* Steps 1–5 — two-column grid */}
      {!showVendors && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 310px', gap: 18, alignItems: 'start' }}>

          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Compliance donut — steps 1, 2, 4 */}
            {showDonut && (
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                  <h2 style={{ fontSize: 14, fontWeight: 700, color: T.primary, margin: 0 }}>Compliance Overview</h2>
                  <button style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.border}`, borderRadius: 6, padding: '5px 10px', fontSize: 12, color: T.secondary, cursor: 'default' }}>
                    This Month <ChevronDown size={11} />
                  </button>
                </div>
                <AnimatedDonut />
              </div>
            )}

            {/* Compliance report — step 3 */}
            {showReport && <ComplianceReportCard />}

            {/* Upload UI — step 5 */}
            {showUpload && <UploadCard />}

            {/* Submissions table — steps 1, 2, 3, 4 */}
            {showSubmissions && (
              <div className={step === 2 ? 'demo-highlight' : ''} style={{ borderRadius: 12 }}>
                <SubmissionsTable highlightRow={step === 2} onAction={onAction} mounted={mounted} />
              </div>
            )}
          </div>

          {/* Right column — action items; highlighted in step 4 */}
          <ActionItemsPanel highlighted={step === 4} onAction={onAction} mounted={mounted} />
        </div>
      )}
    </div>
  )
}

// ─── Tour Card ────────────────────────────────────────────────────────────────

function TourCard({ step, onNext, onBack, onExit, onRestart }: {
  step: number; onNext: () => void; onBack: () => void; onExit: () => void; onRestart: () => void
}) {
  const s   = STEPS[step - 1]
  const pct = Math.round((step / 6) * 100)

  return (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 150, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
      <div className="tour-card-outer" style={{ width: '100%', maxWidth: 720, padding: '0 20px 20px', pointerEvents: 'auto' }}>
        <div className="tour-card" style={{ background: '#0d0d16', border: '1px solid rgba(217,119,6,0.28)', borderRadius: 16, padding: '18px 22px', boxShadow: '0 -8px 48px rgba(0,0,0,0.65), 0 0 0 1px rgba(217,119,6,0.08)' }}>

          {/* Header */}
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

          {/* Progress */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: T.orange, textTransform: 'uppercase', letterSpacing: '0.09em' }}>Step {step} of 6</span>
            <span style={{ fontSize: 10, color: T.muted }}>{pct}% complete</span>
          </div>
          <div style={{ height: 3, background: T.border, borderRadius: 2, marginBottom: 14 }}>
            <div style={{ height: '100%', width: `${pct}%`, background: T.orange, borderRadius: 2, transition: 'width 0.4s ease' }} />
          </div>

          {/* Content */}
          <h3 style={{ fontSize: 16, fontWeight: 700, color: T.primary, margin: '0 0 7px', lineHeight: 1.3 }}>{s.heading}</h3>
          <p style={{ fontSize: 13, color: T.secondary, margin: '0 0 8px', lineHeight: 1.65 }}>{s.desc}</p>
          {step < 6 && (
            <p style={{ fontSize: 11, color: T.muted, margin: '0 0 14px' }}>
              <span style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Up Next: </span>{s.upNext}
            </p>
          )}

          {/* Nav */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button onClick={onBack} disabled={step === 1}
              style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, color: step === 1 ? T.muted : T.secondary, cursor: step === 1 ? 'default' : 'pointer', opacity: step === 1 ? 0.4 : 1, transition: 'border-color 0.15s, color 0.15s' }}
              onMouseEnter={e => { if (step > 1) { e.currentTarget.style.borderColor = T.orange; e.currentTarget.style.color = T.primary } }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.secondary }}
            ><ChevronLeft size={14} /> Back</button>
            <button onClick={onNext}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: T.orange, border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer', transition: 'background 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#b45309')}
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
          A 2-minute guided tour showing exactly how Covira verifies vendor insurance compliance.
        </p>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: '20px 24px', marginBottom: 32, textAlign: 'left' }}>
          {[
            'How Covira tracks vendors and compliance status',
            'What a real compliance report looks like',
            'How coverage gaps and missing endorsements get flagged',
            'How expiration tracking works automatically',
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: i < 3 ? 12 : 0 }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                <Check size={10} color={T.green} strokeWidth={3} />
              </div>
              <span style={{ fontSize: 14, color: T.secondary, lineHeight: 1.5 }}>{item}</span>
            </div>
          ))}
        </div>
        <button onClick={onStart}
          onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: hov ? '#b45309' : T.orange, color: '#fff', fontSize: 16, fontWeight: 700, padding: '15px 32px', borderRadius: 10, border: 'none', cursor: 'pointer', transition: 'background 0.15s', marginBottom: 14 }}
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
    'Vendor compliance dashboard overview',
    'Coverage gap and endorsement detection',
    'Plain-English compliance reports',
    'Automatic expiration tracking',
    'COI upload and AI verification',
    'Complete vendor database management',
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
        <p style={{ fontSize: 15, color: T.secondary, margin: '0 0 26px' }}>Here&apos;s what happened in this tour:</p>
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
  const [phase, setPhase] = useState<Phase>('landing')
  const [step, setStep] = useState(1)
  const [mounted, setMounted] = useState(false)
  const [toast, setToast] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const showToast = () => { setToast(true); setTimeout(() => setToast(false), 3200) }
  const startTour  = () => { setStep(1); setPhase('tour') }
  const exitTour   = () => setPhase('landing')
  const restartTour = () => setStep(1)
  const nextStep   = () => { if (step < 6) setStep(s => s + 1); else setPhase('done') }
  const prevStep   = () => { if (step > 1) setStep(s => s - 1) }

  if (phase === 'landing') return <LandingScreen onStart={startTour} />
  if (phase === 'done')    return <CompletionScreen onRestart={startTour} />

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: T.bg, fontFamily: 'Inter, -apple-system, sans-serif', color: T.primary }}>
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(16px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes issueGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(217,119,6,0); }
          50%       { box-shadow: 0 0 10px 3px rgba(217,119,6,0.20); }
        }
        @keyframes bellDot {
          0%, 100% { transform: scale(1); opacity: 1; }
          50%       { transform: scale(0.72); opacity: 0.45; }
        }
        .pre-animate    { opacity: 0; }
        .row-animate    { animation: fadeSlideUp 0.35s ease both; }
        .action-animate { animation: slideInRight 0.35s ease both; }
        .issues-badge   { animation: issueGlow 3.2s ease-in-out infinite; }
        .bell-dot       { animation: bellDot 2.8s ease-in-out infinite; }
        .demo-highlight {
          box-shadow: 0 0 0 3px rgba(59,130,246,0.8), 0 0 28px rgba(59,130,246,0.18) !important;
          border-radius: 12px !important;
        }
        @media (max-width: 639px) {
          .tour-card-outer { padding: 0 !important; }
          .tour-card { border-radius: 12px 12px 0 0 !important; }
        }
      `}</style>

      <DemoSidebar onAction={showToast} />

      <main style={{ marginLeft: 240, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <header style={{ position: 'sticky', top: 0, zIndex: 40, background: T.bg, borderBottom: `1px solid ${T.border}`, height: 64, padding: '0 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 700, color: T.primary, margin: 0, lineHeight: 1.2 }}>Dashboard</h1>
            <p style={{ fontSize: 12, color: T.secondary, margin: 0 }}>Welcome back, Demo</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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

        <DashboardContent step={step} mounted={mounted} onAction={showToast} />
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
