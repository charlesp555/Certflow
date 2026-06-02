'use client'

import Link from 'next/link'
import {
  ChevronDown, User, Bell, AlertTriangle, Users,
} from 'lucide-react'
import Sidebar from '../components/Sidebar'

// ─── Types ────────────────────────────────────────────────────────────────────

type Submission = {
  vendor: string
  vendorId: string
  uploaded: string
  status: 'compliant' | 'issues'
  issues: number
  expiration: string
}

type ActionItem = {
  text: string
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const SUBMISSIONS: Submission[] = [
  { vendor: 'ABC Plumbing LLC',       vendorId: '1', uploaded: 'May 20, 2025', status: 'issues',    issues: 2, expiration: 'May 22, 2026' },
  { vendor: 'Summit Electric Co.',    vendorId: '2', uploaded: 'May 19, 2025', status: 'compliant', issues: 0, expiration: 'Feb 15, 2027' },
  { vendor: 'Bluewater HVAC',         vendorId: '3', uploaded: 'May 18, 2025', status: 'compliant', issues: 0, expiration: 'Jan 10, 2027' },
  { vendor: 'Pinnacle Roofing Inc.',  vendorId: '4', uploaded: 'May 16, 2025', status: 'issues',    issues: 1, expiration: 'Jun 01, 2026' },
]

const ACTION_ITEMS: ActionItem[] = [
  { text: '3 vendors missing additional insured' },
  { text: '2 COIs expire within 30 days' },
  { text: '1 vendor has low general liability limits' },
  { text: '4 vendors need follow-up' },
]

// ─── Donut Chart (inline SVG) ─────────────────────────────────────────────────

function DonutChart() {
  const R = 70
  const cx = 100
  const cy = 100
  const circumference = 2 * Math.PI * R

  const segments = [
    { pct: 0.69, color: '#22c55e', label: 'Compliant',  count: 29 },
    { pct: 0.21, color: '#D97706', label: 'Issues',     count: 9  },
    { pct: 0.10, color: '#3b82f6', label: 'Expiring',   count: 4  },
  ]

  let offset = 0
  const arcs = segments.map((seg) => {
    const dash = seg.pct * circumference
    const gap = circumference - dash
    const rotation = offset * 360
    offset += seg.pct
    return { ...seg, dash, gap, rotation }
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
      <div style={{ position: 'relative', width: 200, height: 200 }}>
        <svg width="200" height="200" viewBox="0 0 200 200">
          {arcs.map((arc, i) => (
            <circle
              key={i}
              cx={cx} cy={cy} r={R}
              fill="none"
              stroke={arc.color}
              strokeWidth="28"
              strokeDasharray={`${arc.dash} ${arc.gap}`}
              strokeDashoffset={0}
              style={{ transform: `rotate(${arc.rotation * 1 - 90}deg)`, transformOrigin: '100px 100px' }}
            />
          ))}
          <circle cx={cx} cy={cy} r={R - 18} fill="#111118" />
        </svg>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#f0ede8', lineHeight: 1.1 }}>69%</div>
          <div style={{ fontSize: 12, color: '#8a8599', marginTop: 2 }}>Compliant</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
        {[
          { color: '#22c55e', label: 'Compliant', count: 29 },
          { color: '#D97706', label: 'Issues',    count: 9  },
          { color: '#3b82f6', label: 'Expiring',  count: 4  },
          { color: '#4b5563', label: 'Pending',   count: 0  },
        ].map(({ color, label, count }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: '#8a8599' }}>{label}</span>
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#f0ede8' }}>{count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: 'compliant' | 'issues' }) {
  if (status === 'compliant') {
    return (
      <span style={{ background: '#052e16', color: '#22c55e', border: '1px solid #166534', borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
        Compliant
      </span>
    )
  }
  return (
    <span style={{ background: '#1c0a00', color: '#D97706', border: '1px solid #92400e', borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
      Issues Found
    </span>
  )
}

// ─── Metric Card ──────────────────────────────────────────────────────────────

function MetricCard({ label, value, tag, tagColor }: { label: string; value: string | number; tag: string; tagColor: 'green' | 'orange' }) {
  const color = tagColor === 'green' ? '#22c55e' : '#D97706'
  const bg    = tagColor === 'green' ? 'rgba(34,197,94,0.10)' : 'rgba(217,119,6,0.10)'
  return (
    <div style={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: 12, padding: '20px 24px', flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 12, color: '#8a8599', marginBottom: 10, fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 30, fontWeight: 800, color: '#f0ede8', lineHeight: 1, marginBottom: 10 }}>{value}</div>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: bg, color, borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>
        {tag}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0a0f', fontFamily: 'Inter, -apple-system, sans-serif' }}>
      <Sidebar />

      <main style={{ marginLeft: 240, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Top bar */}
        <header style={{
          padding: '0 32px', height: 64,
          borderBottom: '1px solid #1e1e2e',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#0a0a0f', position: 'sticky', top: 0, zIndex: 40,
        }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: '#f0ede8', margin: 0 }}>Dashboard</h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button style={{ position: 'relative', background: 'transparent', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8, color: '#8a8599', transition: 'color 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#f0ede8' }}
              onMouseLeave={e => { e.currentTarget.style.color = '#8a8599' }}
            >
              <Bell size={20} />
              <span style={{ position: 'absolute', top: 5, right: 5, width: 8, height: 8, background: '#D97706', borderRadius: '50%', border: '2px solid #0a0a0f' }} />
            </button>

            <button style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'transparent', border: '1px solid #1e1e2e', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.16)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e1e2e'; e.currentTarget.style.background = 'transparent' }}
            >
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(217,119,6,0.20)', border: '1px solid rgba(217,119,6,0.30)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={13} color="#D97706" />
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#f0ede8' }}>James Carter</span>
              <ChevronDown size={14} color="#8a8599" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <div style={{ padding: 32, flex: 1 }}>

          {/* Metric cards */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 28 }}>
            <MetricCard label="Total Vendors"  value={42} tag="+12% vs last month" tagColor="green"  />
            <MetricCard label="Compliant"      value={29} tag="69%"                tagColor="green"  />
            <MetricCard label="Issues Found"   value={9}  tag="21%"                tagColor="orange" />
            <MetricCard label="Expiring Soon"  value={4}  tag="10%"                tagColor="orange" />
          </div>

          {/* Two-column layout */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>

            {/* Left column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Compliance Overview */}
              <div style={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: 12, padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                  <h2 style={{ fontSize: 15, fontWeight: 700, color: '#f0ede8', margin: 0 }}>Compliance Overview</h2>
                  <button style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.04)', border: '1px solid #1e1e2e', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: 12, color: '#8a8599', transition: 'all 0.15s' }}>
                    This Month <ChevronDown size={12} />
                  </button>
                </div>
                <DonutChart />
              </div>

              {/* Recent Submissions */}
              <div style={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: 12, padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <h2 style={{ fontSize: 15, fontWeight: 700, color: '#f0ede8', margin: 0 }}>Recent Submissions</h2>
                  <Link href="/report" style={{ fontSize: 13, color: '#D97706', textDecoration: 'none', fontWeight: 500 }}
                    onMouseEnter={e => { e.currentTarget.style.textDecoration = 'underline' }}
                    onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none' }}
                  >
                    View all
                  </Link>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        {['Vendor', 'COI Uploaded', 'Status', 'Issues', 'Expiration Date'].map(col => (
                          <th key={col} style={{ textAlign: 'left', padding: '0 12px 12px', fontSize: 11, color: '#8a8599', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #1e1e2e', whiteSpace: 'nowrap' }}>
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {SUBMISSIONS.map((row, i) => (
                        <tr key={i} style={{ transition: 'background 0.12s', cursor: 'pointer' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.025)' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                        >
                          <td style={{ padding: '14px 12px', fontSize: 14, fontWeight: 600, borderBottom: '1px solid #1e1e2e', whiteSpace: 'nowrap' }}>
                            <Link href={`/vendors/${row.vendorId}`} style={{ color: '#f0ede8', textDecoration: 'none' }}
                              onMouseEnter={e => (e.currentTarget.style.color = '#D97706')}
                              onMouseLeave={e => (e.currentTarget.style.color = '#f0ede8')}
                            >
                              {row.vendor}
                            </Link>
                          </td>
                          <td style={{ padding: '14px 12px', fontSize: 13, color: '#8a8599', borderBottom: '1px solid #1e1e2e', whiteSpace: 'nowrap' }}>{row.uploaded}</td>
                          <td style={{ padding: '14px 12px', borderBottom: '1px solid #1e1e2e' }}><StatusBadge status={row.status} /></td>
                          <td style={{ padding: '14px 12px', fontSize: 13, fontWeight: 600, color: row.issues > 0 ? '#D97706' : '#8a8599', borderBottom: '1px solid #1e1e2e', textAlign: 'center' }}>{row.issues}</td>
                          <td style={{ padding: '14px 12px', fontSize: 13, color: '#8a8599', borderBottom: '1px solid #1e1e2e', whiteSpace: 'nowrap' }}>{row.expiration}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right column */}
            <div>
              <div style={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: 12, padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <h2 style={{ fontSize: 15, fontWeight: 700, color: '#f0ede8', margin: 0 }}>Action Items</h2>
                  <Link href="/vendors" style={{ fontSize: 13, color: '#D97706', textDecoration: 'none', fontWeight: 500 }}
                    onMouseEnter={e => { e.currentTarget.style.textDecoration = 'underline' }}
                    onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none' }}
                  >
                    View all
                  </Link>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {ACTION_ITEMS.map((item, i) => (
                    <Link
                      key={i}
                      href="/vendors"
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: 12,
                        background: 'rgba(217,119,6,0.06)', border: '1px solid rgba(217,119,6,0.15)',
                        borderRadius: 10, padding: '12px 14px',
                        cursor: 'pointer', textDecoration: 'none',
                        transition: 'background 0.15s, border-color 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(217,119,6,0.12)'; e.currentTarget.style.borderColor = 'rgba(217,119,6,0.30)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(217,119,6,0.06)'; e.currentTarget.style.borderColor = 'rgba(217,119,6,0.15)' }}
                    >
                      <AlertTriangle size={16} color="#D97706" style={{ flexShrink: 0, marginTop: 1 }} />
                      <span style={{ fontSize: 13, color: '#f0ede8', lineHeight: 1.5, fontWeight: 500 }}>{item.text}</span>
                    </Link>
                  ))}
                </div>

                <div style={{ marginTop: 20, padding: '12px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid #1e1e2e', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Users size={14} color="#8a8599" />
                    <span style={{ fontSize: 12, color: '#8a8599' }}>Total open items</span>
                  </div>
                  <span style={{ background: 'rgba(217,119,6,0.15)', color: '#D97706', fontSize: 12, fontWeight: 700, borderRadius: 20, padding: '2px 10px' }}>
                    {ACTION_ITEMS.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
