'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Bell, ChevronDown, AlertTriangle, ArrowRight, Users,
  CheckCircle2, Clock, LayoutDashboard, Building2, FileText,
  TrendingUp, ClipboardList, FolderOpen, Puzzle, Settings, Shield, User,
} from 'lucide-react'

// ─── Constants ────────────────────────────────────────────────────────────────

const BANNER_H = 36

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

// ─── Hardcoded demo data ───────────────────────────────────────────────────────

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
  'ABC Plumbing LLC COI expires May 22, 2026',
]

// ─── Demo Sidebar (mirrors Sidebar.tsx exactly; all nav → /demo) ──────────────

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

function DemoSidebar() {
  return (
    <aside style={{
      width: 240, flexShrink: 0,
      background: T.surface,
      borderRight: `1px solid ${T.border}`,
      display: 'flex', flexDirection: 'column',
      position: 'fixed', top: BANNER_H, bottom: 0, left: 0,
      zIndex: 50,
    }}>
      <div style={{ padding: '22px 20px 18px', borderBottom: `1px solid ${T.border}` }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{
            width: 32, height: 32,
            background: 'rgba(217,119,6,0.12)', border: '1px solid rgba(217,119,6,0.25)',
            borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Shield size={17} color={T.orange} strokeWidth={2.5} />
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '0.07em', color: T.primary }}>COVIRA</span>
        </Link>
      </div>

      <nav style={{ flex: 1, padding: '10px 10px', overflowY: 'auto' }}>
        {DEMO_NAV.map(({ Icon, label }, i) => {
          const active = i === 0
          return (
            <Link
              key={label}
              href="/demo"
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 8, marginBottom: 2,
                background: active ? 'rgba(217,119,6,0.10)' : 'transparent',
                borderLeft: `2px solid ${active ? T.orange : 'transparent'}`,
                color: active ? T.orange : T.secondary,
                fontSize: 14, fontWeight: active ? 600 : 500,
                textDecoration: 'none',
                transition: 'background 0.15s, color 0.15s',
              }}
              onMouseEnter={e => {
                if (!active) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                  e.currentTarget.style.color = T.primary
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = T.secondary
                }
              }}
            >
              <Icon size={16} strokeWidth={2} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div style={{
        padding: '14px 16px', borderTop: `1px solid ${T.border}`,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
          background: 'rgba(217,119,6,0.15)', border: '1px solid rgba(217,119,6,0.28)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <User size={16} color={T.orange} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.primary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Demo Account
          </div>
          <div style={{ fontSize: 11, color: T.secondary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            demo@covira.ai
          </div>
        </div>
        <Link href="/demo" style={{
          display: 'flex', color: T.secondary, textDecoration: 'none',
          padding: 4, borderRadius: 6, transition: 'color 0.15s',
        }}
          onMouseEnter={e => (e.currentTarget.style.color = T.primary)}
          onMouseLeave={e => (e.currentTarget.style.color = T.secondary)}
        >
          <Settings size={14} />
        </Link>
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
      const eased = 1 - Math.pow(1 - p, 3)
      setVal(Math.round(target * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return val
}

// ─── MetricCard ───────────────────────────────────────────────────────────────

function MetricCard({
  label, target, tag, tagColor, icon: Icon, isIssues = false,
}: {
  label: string
  target: number
  tag: string
  tagColor: 'green' | 'orange'
  icon: React.ElementType
  isIssues?: boolean
}) {
  const val = useCountUp(target)
  const [hov, setHov] = useState(false)
  const accent = tagColor === 'green' ? T.green : T.orange
  const tagBg     = tagColor === 'green' ? 'rgba(34,197,94,0.10)'  : 'rgba(217,119,6,0.10)'
  const tagBorder = tagColor === 'green' ? 'rgba(34,197,94,0.20)'  : 'rgba(217,119,6,0.20)'

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        flex: 1, minWidth: 0,
        background: T.card, border: `1px solid ${T.border}`,
        borderTop: `2px solid ${hov ? T.orange : 'transparent'}`,
        borderRadius: 12, padding: '20px 22px', position: 'relative',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-top-color 0.2s ease',
        transform: hov ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: hov ? '0 12px 40px rgba(0,0,0,0.55)' : '0 2px 8px rgba(0,0,0,0.2)',
      }}
    >
      <div style={{
        position: 'absolute', top: 18, right: 18,
        width: 30, height: 30, borderRadius: 8,
        background: 'rgba(217,119,6,0.07)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={14} color={T.orange} strokeWidth={2} style={{ opacity: 0.6 }} />
      </div>
      <div style={{ fontSize: 12, color: T.secondary, fontWeight: 500, marginBottom: 10 }}>{label}</div>
      <div style={{ fontSize: 33, fontWeight: 800, color: T.primary, lineHeight: 1, marginBottom: 12, letterSpacing: '-1px' }}>{val}</div>
      <div
        className={isIssues ? 'issues-badge' : ''}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          background: tagBg, color: accent, border: `1px solid ${tagBorder}`,
          borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600,
        }}
      >
        {tag}
      </div>
    </div>
  )
}

// ─── AnimatedDonut ────────────────────────────────────────────────────────────

function AnimatedDonut({ compliant, issues, expiring, total }: {
  compliant: number; issues: number; expiring: number; total: number
}) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    setProgress(0)
    let raf: number
    const duration = 1050
    const t0 = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setProgress(eased)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [compliant, issues, expiring])

  const R = 70, cx = 100, cy = 100
  const C = 2 * Math.PI * R
  const safeTotal = total || 1

  const segments = [
    { pct: compliant / safeTotal, color: T.green,  label: 'Compliant',     count: compliant },
    { pct: issues    / safeTotal, color: T.orange, label: 'Issues Found',  count: issues    },
    { pct: expiring  / safeTotal, color: T.blue,   label: 'Expiring Soon', count: expiring  },
  ]

  let cum = 0
  const arcs = segments.map(seg => {
    const start = cum
    const end = cum + seg.pct
    let drawn = 0
    if (progress >= end)        drawn = seg.pct * C
    else if (progress > start)  drawn = (progress - start) * C
    cum += seg.pct
    return { ...seg, dash: drawn, gap: C - drawn, rotation: start * 360 - 90 }
  })

  const centerPct = Math.round((compliant / total) * 100 * progress)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
      <div style={{ position: 'relative', width: 200, height: 200, flexShrink: 0 }}>
        <svg width="200" height="200" viewBox="0 0 200 200" style={{ overflow: 'visible' }}>
          <circle cx={cx} cy={cy} r={R} fill="none" stroke="#1a1a2e" strokeWidth={24} />
          {arcs.map((arc, i) => (
            <circle
              key={i} cx={cx} cy={cy} r={R}
              fill="none" stroke={arc.color} strokeWidth={24}
              strokeDasharray={`${arc.dash} ${arc.gap}`}
              strokeLinecap="butt"
              style={{ transform: `rotate(${arc.rotation}deg)`, transformOrigin: `${cx}px ${cy}px` }}
            />
          ))}
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          textAlign: 'center', pointerEvents: 'none',
        }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: T.primary, lineHeight: 1.1, letterSpacing: '-1px' }}>
            {centerPct}%
          </div>
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
              <span style={{
                fontSize: 11, color: T.muted,
                background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}`,
                borderRadius: 4, padding: '1px 7px',
              }}>
                {`${Math.round(seg.pct * 100)}%`}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── ActionItem ───────────────────────────────────────────────────────────────

function ActionItem({ text, index, mounted, onAction }: {
  text: string
  index: number
  mounted: boolean
  onAction: () => void
}) {
  const [hov, setHov] = useState(false)
  return (
    <div
      className={mounted ? 'action-animate' : 'pre-animate'}
      onClick={onAction}
      style={{
        display: 'flex', alignItems: 'center', gap: 11,
        padding: '11px 13px',
        background: hov ? 'rgba(217,119,6,0.10)' : 'rgba(217,119,6,0.05)',
        border: `1px solid ${hov ? 'rgba(217,119,6,0.25)' : 'rgba(217,119,6,0.12)'}`,
        borderRadius: 9, cursor: 'pointer',
        animationDelay: mounted ? `${index * 80 + 150}ms` : undefined,
        transition: 'background 0.15s, border-color 0.15s',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <AlertTriangle size={15} color={T.orange} style={{ flexShrink: 0 }} />
      <span style={{ fontSize: 13, color: T.primary, lineHeight: 1.5, fontWeight: 500, flex: 1 }}>{text}</span>
      <ArrowRight
        size={13} color={T.secondary}
        style={{ flexShrink: 0, opacity: hov ? 1 : 0, transition: 'opacity 0.15s' }}
      />
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DemoPage() {
  const [mounted, setMounted] = useState(false)
  const [toast, setToast] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const showToast = () => {
    setToast(true)
    setTimeout(() => setToast(false), 3200)
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: T.bg, fontFamily: 'Inter, -apple-system, sans-serif', color: T.primary }}>
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(18px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes issueGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(217,119,6,0); }
          50%       { box-shadow: 0 0 10px 3px rgba(217,119,6,0.20); }
        }
        @keyframes bellDot {
          0%, 100% { transform: scale(1);    opacity: 1; }
          50%       { transform: scale(0.72); opacity: 0.45; }
        }
        .pre-animate     { opacity: 0; }
        .row-animate     { animation: fadeSlideUp 0.38s ease both; }
        .action-animate  { animation: slideInRight 0.38s ease both; }
        .issues-badge    { animation: issueGlow 3.2s ease-in-out infinite; }
        .bell-dot        { animation: bellDot 2.8s ease-in-out infinite; }
      `}</style>

      {/* ── Demo banner ── */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: BANNER_H, background: T.surface, borderBottom: `1px solid ${T.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px',
      }}>
        <span style={{ fontSize: 12, color: T.secondary }}>
          You&apos;re viewing a demo. Your data stays private.
        </span>
        <Link
          href="/sign-up"
          style={{ fontSize: 12, fontWeight: 600, color: T.orange, textDecoration: 'none', transition: 'opacity 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.75')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          Sign Up Free →
        </Link>
      </div>

      <DemoSidebar />

      <main style={{ marginLeft: 240, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', paddingTop: BANNER_H }}>

        {/* ── Header ── */}
        <header style={{
          position: 'sticky', top: BANNER_H, zIndex: 40,
          background: T.bg, borderBottom: `1px solid ${T.border}`,
          height: 64, padding: '0 28px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 700, color: T.primary, margin: 0, lineHeight: 1.2 }}>Dashboard</h1>
            <p style={{ fontSize: 12, color: T.secondary, margin: 0 }}>Welcome back, Demo</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={showToast}
              style={{
                position: 'relative', background: 'none',
                border: `1px solid ${T.border}`, borderRadius: 8,
                width: 38, height: 38, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: T.secondary, transition: 'border-color 0.15s, color 0.15s, background 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.orange; e.currentTarget.style.color = T.primary; e.currentTarget.style.background = 'rgba(217,119,6,0.06)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border;  e.currentTarget.style.color = T.secondary; e.currentTarget.style.background = 'none' }}
            >
              <Bell size={17} />
              <span className="bell-dot" style={{
                position: 'absolute', top: 9, right: 9,
                width: 7, height: 7, borderRadius: '50%',
                background: T.orange, border: `2px solid ${T.bg}`,
              }} />
            </button>

            <Link href="/sign-up" style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(217,119,6,0.15)', border: '1px solid rgba(217,119,6,0.28)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              textDecoration: 'none', flexShrink: 0,
            }}>
              <User size={15} color={T.orange} />
            </Link>
          </div>
        </header>

        {/* ── Content ── */}
        <div style={{ padding: 24, flex: 1 }}>

          {/* Metric cards */}
          <div style={{ display: 'flex', gap: 14, marginBottom: 22 }}>
            <MetricCard label="Total Vendors" target={TOTAL}     tag={`${TOTAL} total`}   tagColor="green"  icon={Users}         />
            <MetricCard label="Compliant"     target={COMPLIANT} tag="73%"                 tagColor="green"  icon={CheckCircle2}  />
            <MetricCard label="Issues Found"  target={ISSUES}    tag="Review needed"       tagColor="orange" icon={AlertTriangle} isIssues />
            <MetricCard label="Expiring Soon" target={EXPIRING}  tag="Action needed"       tagColor="orange" icon={Clock}         />
          </div>

          {/* Two-column layout */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 310px', gap: 18, alignItems: 'start' }}>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

              {/* Compliance Overview */}
              <div
                style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24, transition: 'border-color 0.2s, box-shadow 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#2a2a3e'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.4)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = T.border;  e.currentTarget.style.boxShadow = 'none' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                  <h2 style={{ fontSize: 14, fontWeight: 700, color: T.primary, margin: 0 }}>Compliance Overview</h2>
                  <button style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.border}`,
                    borderRadius: 6, padding: '5px 10px',
                    fontSize: 12, color: T.secondary, cursor: 'pointer',
                    transition: 'border-color 0.15s',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = '#2a2a3e')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = T.border)}
                  >
                    This Month <ChevronDown size={11} />
                  </button>
                </div>
                <AnimatedDonut compliant={COMPLIANT} issues={ISSUES} expiring={EXPIRING} total={TOTAL} />
              </div>

              {/* Recent Submissions */}
              <div
                style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24, transition: 'border-color 0.2s, box-shadow 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#2a2a3e'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.4)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = T.border;  e.currentTarget.style.boxShadow = 'none' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <h2 style={{ fontSize: 14, fontWeight: 700, color: T.primary, margin: 0 }}>Recent Submissions</h2>
                  <button
                    onClick={showToast}
                    style={{ fontSize: 13, color: T.orange, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, padding: 0, transition: 'opacity 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '0.75')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                  >
                    View all →
                  </button>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        {['Vendor', 'COI Uploaded', 'Status', 'Issues', 'Expiration Date'].map(col => (
                          <th key={col} style={{
                            textAlign: 'left', padding: '0 12px 12px',
                            fontSize: 10, color: T.muted, fontWeight: 600,
                            textTransform: 'uppercase', letterSpacing: '0.07em',
                            borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap',
                          }}>
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {SUBMISSIONS.map((row, i) => (
                        <tr
                          key={i}
                          className={mounted ? 'row-animate' : 'pre-animate'}
                          style={{ cursor: 'pointer', animationDelay: mounted ? `${i * 80}ms` : undefined, transition: 'background 0.15s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#1a1a2e')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                          onClick={showToast}
                        >
                          <td style={{ padding: '13px 12px', borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: T.primary }}>{row.vendor}</span>
                          </td>
                          <td style={{ padding: '13px 12px', fontSize: 12, color: T.secondary, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>
                            {row.uploaded}
                          </td>
                          <td style={{ padding: '13px 12px', borderBottom: `1px solid ${T.border}` }}>
                            {row.status === 'Compliant' ? (
                              <span style={{ background: 'rgba(34,197,94,0.09)',  color: T.green,   border: '1px solid rgba(34,197,94,0.22)',  borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>Compliant</span>
                            ) : row.status === 'Expiring Soon' ? (
                              <span style={{ background: 'rgba(251,191,36,0.09)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.22)', borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>Expiring Soon</span>
                            ) : (
                              <span style={{ background: 'rgba(217,119,6,0.09)',  color: T.orange,  border: '1px solid rgba(217,119,6,0.22)',  borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>Issues Found</span>
                            )}
                          </td>
                          <td style={{ padding: '13px 12px', fontSize: 13, fontWeight: 700, color: row.issues > 0 ? T.orange : T.muted, borderBottom: `1px solid ${T.border}`, textAlign: 'center' }}>
                            {row.issues}
                          </td>
                          <td style={{ padding: '13px 12px', fontSize: 12, color: T.secondary, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>
                            {row.expiration}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Action Items */}
            <div
              style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 22, transition: 'border-color 0.2s, box-shadow 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#2a2a3e'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.4)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border;  e.currentTarget.style.boxShadow = 'none' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: T.primary, margin: 0 }}>Action Items</h2>
                <button
                  onClick={showToast}
                  style={{ fontSize: 13, color: T.orange, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, padding: 0, transition: 'opacity 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '0.75')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                >
                  View all →
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {ACTION_ITEMS.map((text, i) => (
                  <ActionItem key={i} text={text} index={i} mounted={mounted} onAction={showToast} />
                ))}
              </div>

              <div style={{
                marginTop: 16, padding: '11px 13px',
                background: 'rgba(255,255,255,0.025)', border: `1px solid ${T.border}`,
                borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Users size={13} color={T.secondary} />
                  <span style={{ fontSize: 12, color: T.secondary }}>Total open items</span>
                </div>
                <span style={{
                  background: 'rgba(217,119,6,0.12)', color: T.orange,
                  fontSize: 12, fontWeight: 700,
                  borderRadius: 20, padding: '2px 10px',
                  border: '1px solid rgba(217,119,6,0.20)',
                }}>
                  {ACTION_ITEMS.length}
                </span>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 300,
          background: T.card, border: `1px solid rgba(217,119,6,0.25)`,
          borderRadius: 10, padding: '14px 18px',
          display: 'flex', alignItems: 'center', gap: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          animation: 'fadeSlideUp 0.25s ease both',
        }}>
          <AlertTriangle size={16} color={T.orange} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 14, color: T.primary }}>Create a free account to manage your vendors</span>
          <Link href="/sign-up" style={{
            background: T.orange, color: '#fff', fontSize: 12, fontWeight: 600,
            padding: '5px 12px', borderRadius: 6, textDecoration: 'none',
            marginLeft: 4, flexShrink: 0,
          }}>
            Sign Up →
          </Link>
        </div>
      )}
    </div>
  )
}
