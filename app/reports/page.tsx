'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  Bell, User, ChevronDown, Download, CheckCircle2,
  Upload, AlertTriangle, Clock, Plus, TrendingUp, TrendingDown,
} from 'lucide-react'
import Sidebar from '../components/Sidebar'

// ── Design tokens ─────────────────────────────────────────────────────────────

const T = {
  bg: '#0a0a0f',
  surface: '#0f0f17',
  card: '#13131f',
  border: '#1a1a2e',
  borderAccent: '#2a2a3e',
  orange: '#D97706',
  orangeHover: '#B45309',
  green: '#22c55e',
  red: '#ef4444',
  primary: '#f8f8f8',
  secondary: '#8b8fa8',
  muted: '#4b5063',
}

type DateRange = 'This Week' | 'This Month' | 'Last 3 Months' | 'This Year'

// ── Helpers ───────────────────────────────────────────────────────────────────

function scoreColor(s: number) {
  if (s >= 90) return T.green
  if (s >= 80) return '#86efac'
  if (s >= 70) return T.orange
  return T.red
}

function riskLabel(s: number): { label: string; color: string } {
  if (s >= 90) return { label: 'Low Risk',    color: T.green    }
  if (s >= 80) return { label: 'Medium Risk', color: '#86efac'  }
  if (s >= 70) return { label: 'High Risk',   color: T.orange   }
  return             { label: 'Critical',     color: T.red      }
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
  label, value, trend, trendDir,
}: {
  label: string
  value: string
  trend: string
  trendDir: 'up' | 'down' | 'good-down'
}) {
  const isPositive = trendDir === 'up' || trendDir === 'good-down'
  const trendColor = isPositive ? T.green : T.orange
  const TrendIcon  = trendDir === 'good-down' ? TrendingDown : TrendingUp

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
        background: `${trendColor}18`, color: trendColor,
        border: `1px solid ${trendColor}30`,
        borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600,
      }}>
        <TrendIcon size={11} strokeWidth={2.5} />
        {trend}
      </div>
    </div>
  )
}

// ── Compliance Bar Chart ──────────────────────────────────────────────────────

const MONTHS = [
  { label: 'Jan', pct: 71 },
  { label: 'Feb', pct: 74 },
  { label: 'Mar', pct: 69 },
  { label: 'Apr', pct: 78 },
  { label: 'May', pct: 76 },
  { label: 'Jun', pct: 82 },
]

function ComplianceChart() {
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    // Small delay so CSS transition fires after mount paint
    const t = setTimeout(() => setAnimated(true), 80)
    return () => clearTimeout(t)
  }, [])

  const maxPct = Math.max(...MONTHS.map(m => m.pct))

  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', height: 160, paddingTop: 24 }}>
      {MONTHS.map((m, i) => {
        const heightPct = (m.pct / maxPct) * 100
        const isHighest = m.pct === maxPct
        return (
          <div
            key={m.label}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 6,
            }}
          >
            {/* Pct label above bar */}
            <span style={{
              fontSize: 11, fontWeight: 700,
              color: isHighest ? T.orange : T.secondary,
              transition: 'opacity 0.4s ease',
              opacity: animated ? 1 : 0,
              transitionDelay: `${i * 80 + 300}ms`,
            }}>
              {m.pct}%
            </span>

            {/* Bar track */}
            <div style={{
              flex: 1, width: '100%', borderRadius: 5,
              background: 'rgba(255,255,255,0.04)',
              position: 'relative', overflow: 'hidden',
              minHeight: 80,
            }}>
              {/* Fill */}
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                borderRadius: 5,
                background: isHighest
                  ? `linear-gradient(180deg, ${T.orange}, rgba(217,119,6,0.6))`
                  : `linear-gradient(180deg, rgba(217,119,6,0.55), rgba(217,119,6,0.25))`,
                height: animated ? `${heightPct}%` : '0%',
                transition: `height 0.75s cubic-bezier(0.34,1.56,0.64,1)`,
                transitionDelay: `${i * 80}ms`,
              }} />
            </div>

            {/* Month label */}
            <span style={{ fontSize: 11, color: T.muted, fontWeight: 500 }}>{m.label}</span>
          </div>
        )
      })}
    </div>
  )
}

// ── Top Issues ────────────────────────────────────────────────────────────────

const TOP_ISSUES = [
  { label: 'Missing Additional Insured',    pct: 80, count: 9, color: T.orange },
  { label: 'Waiver of Subrogation Missing', pct: 65, count: 7, color: T.orange },
  { label: 'Coverage Below Minimum',        pct: 45, count: 5, color: T.orange },
  { label: 'Expired Policy',                pct: 30, count: 3, color: '#ef4444' },
  { label: 'Workers Comp Gap',              pct: 20, count: 2, color: T.orange },
]

function TopIssues() {
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 120)
    return () => clearTimeout(t)
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {TOP_ISSUES.map((issue, i) => (
        <div key={issue.label}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: T.secondary, fontWeight: 500 }}>{issue.label}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: issue.color }}>{issue.count}</span>
          </div>
          <div style={{
            height: 6, borderRadius: 3,
            background: 'rgba(255,255,255,0.05)',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', borderRadius: 3,
              background: issue.color,
              width: animated ? `${issue.pct}%` : '0%',
              transition: 'width 0.6s ease',
              transitionDelay: `${i * 80}ms`,
            }} />
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Vendor Risk Summary ───────────────────────────────────────────────────────

const VENDORS = [
  { name: 'ABC Plumbing LLC',      vendorId: '1', score: 71, date: 'May 20, 2025' },
  { name: 'Pinnacle Roofing Inc.', vendorId: '4', score: 82, date: 'May 16, 2025' },
  { name: 'Bright Services',       vendorId: '5', score: 88, date: 'May 15, 2025' },
  { name: 'Summit Electric Co.',   vendorId: '2', score: 98, date: 'May 19, 2025' },
  { name: 'Bluewater HVAC',        vendorId: '3', score: 95, date: 'May 18, 2025' },
]

// ── Recent Activity ───────────────────────────────────────────────────────────

const ACTIVITY = [
  { icon: Upload,        color: T.orange, label: 'COI uploaded',       vendor: 'ABC Plumbing LLC',      time: '2 hours ago'  },
  { icon: AlertTriangle, color: '#ef4444',label: 'Issues detected',    vendor: 'Pinnacle Roofing Inc.', time: '1 day ago'    },
  { icon: CheckCircle2,  color: T.green,  label: 'Compliance verified',vendor: 'Summit Electric Co.',   time: '1 day ago'    },
  { icon: Bell,          color: T.orange, label: 'Renewal requested',  vendor: 'Bright Services',       time: '2 days ago'   },
  { icon: Plus,          color: '#8b8cf8',label: 'New vendor added',   vendor: 'Metro Electric Co.',    time: '3 days ago'   },
]

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [dateRange,    setDateRange]    = useState<DateRange>('This Month')
  const [toastVisible, setToastVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function showToast() {
    if (timerRef.current) clearTimeout(timerRef.current)
    setToastVisible(true)
    timerRef.current = setTimeout(() => setToastVisible(false), 3000)
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const DATE_RANGES: DateRange[] = ['This Week', 'This Month', 'Last 3 Months', 'This Year']

  return (
    <div style={{
      display: 'flex', minHeight: '100vh',
      background: T.bg, fontFamily: 'Inter, -apple-system, sans-serif',
      color: T.primary,
    }}>
      <Toast message="Report exported" visible={toastVisible} />
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
              onClick={showToast}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                background: T.orange, color: '#fff', border: 'none',
                borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                boxShadow: '0 2px 12px rgba(217,119,6,0.25)',
                transition: 'background 0.15s, transform 0.1s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = T.orangeHover; e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { e.currentTarget.style.background = T.orange; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <Download size={14} /> Export Report
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

            <button style={{
              display: 'flex', alignItems: 'center', gap: 8, background: 'none',
              border: `1px solid ${T.border}`, borderRadius: 8,
              padding: '6px 12px', cursor: 'pointer',
              transition: 'border-color 0.15s, background 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.borderAccent; e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = 'none' }}
            >
              <div style={{
                width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                background: 'rgba(217,119,6,0.13)', border: '1px solid rgba(217,119,6,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <User size={13} color={T.orange} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: T.primary }}>James Carter</span>
              <ChevronDown size={13} color={T.secondary} />
            </button>
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

          {/* Stat cards */}
          <div style={{ display: 'flex', gap: 14 }}>
            <StatCard label="COIs Analyzed"       value="47"  trend="+8 this month"  trendDir="up"       />
            <StatCard label="Compliance Rate"      value="76%" trend="-3% vs last"    trendDir="down"     />
            <StatCard label="Issues Detected"      value="12"  trend="4 critical"     trendDir="down"     />
            <StatCard label="Avg Response Time"    value="11s" trend="↓ 2s faster"    trendDir="good-down"/>
          </div>

          {/* Two-column layout */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 18, alignItems: 'start' }}>

            {/* Left */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

              {/* Compliance trend chart */}
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
                    Compliance Rate Over Time
                  </h2>
                  <span style={{ fontSize: 11, color: T.muted }}>Jan – Jun 2025</span>
                </div>
                <p style={{ fontSize: 12, color: T.muted, margin: '0 0 4px' }}>
                  Monthly compliance percentage across all vendors
                </p>
                <ComplianceChart />
              </div>

              {/* Top issues */}
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
                    Most Common Issues
                  </h2>
                  <span style={{ fontSize: 11, color: T.muted }}>Last 90 days</span>
                </div>
                <TopIssues />
              </div>
            </div>

            {/* Right */}
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
                  Vendor Risk Summary
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {/* Column headers */}
                  <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 44px 90px',
                    gap: 8, padding: '0 0 8px',
                    borderBottom: `1px solid ${T.border}`, marginBottom: 4,
                  }}>
                    {['Vendor', 'Score', 'Status'].map(col => (
                      <span key={col} style={{
                        fontSize: 10, color: T.muted, fontWeight: 600,
                        textTransform: 'uppercase', letterSpacing: '0.07em',
                      }}>{col}</span>
                    ))}
                  </div>
                  {VENDORS.map((v, i) => {
                    const risk = riskLabel(v.score)
                    return (
                      <Link
                        key={v.vendorId}
                        href={`/vendors/${v.vendorId}`}
                        style={{
                          display: 'grid', gridTemplateColumns: '1fr 44px 90px',
                          gap: 8, padding: '11px 4px',
                          borderBottom: i < VENDORS.length - 1 ? `1px solid ${T.border}` : 'none',
                          textDecoration: 'none',
                          transition: 'background 0.12s',
                          borderRadius: 4, margin: '0 -4px',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#1a1a2e')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <span style={{ fontSize: 12, fontWeight: 600, color: T.primary, alignSelf: 'center' }}>
                          {v.name}
                        </span>
                        <span style={{
                          fontSize: 14, fontWeight: 800,
                          color: scoreColor(v.score),
                          alignSelf: 'center', letterSpacing: '-0.5px',
                        }}>
                          {v.score}
                        </span>
                        <span style={{
                          fontSize: 11, fontWeight: 600, color: risk.color,
                          alignSelf: 'center',
                        }}>
                          {risk.label}
                        </span>
                      </Link>
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {ACTIVITY.map((item, i) => {
                    const Icon = item.icon
                    return (
                      <div
                        key={i}
                        style={{
                          display: 'flex', alignItems: 'flex-start', gap: 11,
                          padding: '11px 4px',
                          borderBottom: i < ACTIVITY.length - 1 ? `1px solid ${T.border}` : 'none',
                          transition: 'background 0.12s',
                          borderRadius: 4, margin: '0 -4px',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#1a1a2e')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <div style={{
                          width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                          background: `${item.color}18`,
                          border: `1px solid ${item.color}30`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Icon size={13} color={item.color} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 12, fontWeight: 600, color: T.primary, margin: '0 0 2px' }}>
                            {item.label}
                          </p>
                          <p style={{ fontSize: 11, color: T.secondary, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.vendor}
                          </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                          <Clock size={10} color={T.muted} />
                          <span style={{ fontSize: 11, color: T.muted, whiteSpace: 'nowrap' }}>{item.time}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
