'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Shield, LayoutDashboard, Building2, FileText,
  TrendingUp, AlertTriangle, Clock, User,
} from 'lucide-react'

// ─── Data ─────────────────────────────────────────────────────────────────────

const SUBMISSIONS = [
  { vendor: 'ABC Plumbing LLC',      date: 'May 20, 2025', status: 'Issues Found',  issues: 2, expiration: 'May 22, 2026' },
  { vendor: 'Summit Electric Co.',   date: 'May 19, 2025', status: 'Compliant',     issues: 0, expiration: 'Feb 15, 2027' },
  { vendor: 'Bluewater HVAC',        date: 'May 18, 2025', status: 'Compliant',     issues: 0, expiration: 'Jan 10, 2027' },
  { vendor: 'Pinnacle Roofing Inc.', date: 'May 16, 2025', status: 'Issues Found',  issues: 1, expiration: 'Jun 01, 2026' },
  { vendor: 'Bright Services',       date: 'May 15, 2025', status: 'Expiring Soon', issues: 0, expiration: 'Jun 05, 2025' },
  { vendor: 'ProBuild Contractors',  date: 'May 14, 2025', status: 'Compliant',     issues: 0, expiration: 'Mar 12, 2027' },
]

const VENDORS = [
  { name: 'ABC Plumbing LLC',      type: 'Plumbing',           status: 'Issues Found',  expiration: 'May 22, 2026' },
  { name: 'Summit Electric Co.',   type: 'Electrical',         status: 'Compliant',     expiration: 'Feb 15, 2027' },
  { name: 'Bluewater HVAC',        type: 'HVAC',               status: 'Compliant',     expiration: 'Jan 10, 2027' },
  { name: 'Pinnacle Roofing Inc.', type: 'Roofing',            status: 'Issues Found',  expiration: 'Jun 01, 2026' },
  { name: 'Bright Services',       type: 'Janitorial',         status: 'Expiring Soon', expiration: 'Jun 05, 2025' },
  { name: 'ProBuild Contractors',  type: 'General Contractor', status: 'Compliant',     expiration: 'Mar 12, 2027' },
  { name: 'Metro Painting Co.',    type: 'Flooring',           status: 'Pending Review',expiration: '—'            },
  { name: 'FastFix Maintenance',   type: 'General Contractor', status: 'Compliant',     expiration: 'Dec 20, 2026' },
]

const STATUS_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  'Compliant':      { bg: 'rgba(34,197,94,0.08)',  color: '#22c55e', border: 'rgba(34,197,94,0.2)'  },
  'Issues Found':   { bg: 'rgba(217,119,6,0.08)',  color: '#D97706', border: 'rgba(217,119,6,0.22)' },
  'Expiring Soon':  { bg: 'rgba(251,191,36,0.08)', color: '#fbbf24', border: 'rgba(251,191,36,0.22)'},
  'Pending Review': { bg: 'rgba(139,140,248,0.08)',color: '#8b8cf8', border: 'rgba(139,140,248,0.2)'},
}

const SIDEBAR_NAV = [
  { Icon: LayoutDashboard, label: 'Dashboard' },
  { Icon: Building2,       label: 'Vendors' },
  { Icon: FileText,        label: 'Submissions' },
  { Icon: TrendingUp,      label: 'Reports' },
]

// ─── Donut chart arc paths (cx=70, cy=70, r=54) ───────────────────────────────
// Green 73%: 0° → 262.8°  | Orange 17%: 262.8° → 324°  | Blue 10%: 324° → 360°
// Points calculated from: x = cx + r·sin(θ), y = cy − r·cos(θ)
const ARCS = [
  { d: 'M 70 16 A 54 54 0 1 1 16.43 76.77',         color: '#22c55e' },  // green  73%
  { d: 'M 16.43 76.77 A 54 54 0 0 1 38.26 26.31',   color: '#D97706' },  // orange 17%
  { d: 'M 38.26 26.31 A 54 54 0 0 1 70 16',         color: '#60a5fa' },  // blue   10%
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DemoPage() {
  const [toast, setToast] = useState(false)

  const showToast = () => {
    setToast(true)
    setTimeout(() => setToast(false), 3000)
  }

  return (
    <div style={{ background: '#0a0a0f', minHeight: '100vh', fontFamily: 'Inter, -apple-system, sans-serif' }}>

      {/* ── Banner ── */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
        background: '#D97706', height: 48,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px',
      }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>
          🎯 Live Demo — This is sample data. Sign up free to add your own vendors.
        </span>
        <Link href="/sign-up" style={{
          background: '#fff', color: '#D97706', fontSize: 13, fontWeight: 700,
          padding: '6px 16px', borderRadius: 8, textDecoration: 'none', flexShrink: 0,
        }}>
          Start Free →
        </Link>
      </div>

      {/* ── Below banner ── */}
      <div style={{ paddingTop: 48, display: 'flex', minHeight: '100vh' }}>

        {/* ── Sidebar ── */}
        <aside style={{
          width: 240, flexShrink: 0,
          background: '#0d0d15', borderRight: '1px solid #1a1a2e',
          display: 'flex', flexDirection: 'column',
          position: 'fixed', top: 48, bottom: 0, left: 0, zIndex: 50,
          overflowY: 'auto',
        }}>
          {/* Logo */}
          <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #1a1a2e' }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
              <div style={{
                width: 32, height: 32,
                background: 'rgba(217,119,6,0.12)', border: '1px solid rgba(217,119,6,0.25)',
                borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Shield size={17} color="#D97706" strokeWidth={2.5} />
              </div>
              <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '0.07em', color: '#f8f8f8' }}>COVIRA</span>
            </Link>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: '10px 10px' }}>
            {SIDEBAR_NAV.map(({ Icon, label }, i) => (
              <Link key={label} href="/demo" style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 8, marginBottom: 2,
                background: i === 0 ? 'rgba(217,119,6,0.10)' : 'transparent',
                borderLeft: `2px solid ${i === 0 ? '#D97706' : 'transparent'}`,
                color: i === 0 ? '#D97706' : '#7a7e9a',
                fontSize: 14, fontWeight: i === 0 ? 600 : 500,
                textDecoration: 'none',
              }}>
                <Icon size={16} strokeWidth={2} />
                {label}
              </Link>
            ))}
          </nav>

          {/* Demo user */}
          <div style={{
            padding: '14px 16px', borderTop: '1px solid #1a1a2e',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
              background: 'rgba(217,119,6,0.12)', border: '1px solid rgba(217,119,6,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <User size={16} color="#D97706" />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#f0ede8' }}>Demo Account</div>
              <div style={{ fontSize: 11, color: '#7a7e9a' }}>demo@covira.ai</div>
            </div>
          </div>
        </aside>

        {/* ── Main ── */}
        <main style={{ marginLeft: 240, flex: 1, display: 'flex', flexDirection: 'column' }}>

          {/* Topbar */}
          <header style={{
            padding: '0 32px', height: 64,
            borderBottom: '1px solid #1e1e2e',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: '#0a0a0f', position: 'sticky', top: 48, zIndex: 40,
          }}>
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 700, color: '#f0ede8', margin: 0 }}>Dashboard</h1>
              <p style={{ fontSize: 12, color: '#6b6e87', margin: '2px 0 0' }}>Demo — sample data only</p>
            </div>
            <Link href="/sign-up" style={{
              background: '#D97706', color: '#fff', fontSize: 13, fontWeight: 600,
              padding: '8px 18px', borderRadius: 8, textDecoration: 'none',
            }}>
              Sign Up Free
            </Link>
          </header>

          {/* Content */}
          <div style={{ padding: '28px 32px', flex: 1 }}>

            {/* ── Metric cards ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
              {[
                { label: 'Total Vendors',  value: '52', sub: 'Active vendors',  dot: '#8b8cf8' },
                { label: 'Compliant',      value: '38', sub: '73% of vendors',  dot: '#22c55e' },
                { label: 'Issues Found',   value: '9',  sub: '17% of vendors',  dot: '#D97706' },
                { label: 'Expiring Soon',  value: '5',  sub: '10% of vendors',  dot: '#fbbf24' },
              ].map(card => (
                <div key={card.label} style={{
                  background: '#111118', border: '1px solid #1e1e2e', borderRadius: 12, padding: '20px 22px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontSize: 11, color: '#6b6e87', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                      {card.label}
                    </span>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: card.dot }} />
                  </div>
                  <div style={{ fontSize: 38, fontWeight: 800, color: '#f0ede8', lineHeight: 1, marginBottom: 6 }}>
                    {card.value}
                  </div>
                  <div style={{ fontSize: 12, color: '#6b6e87' }}>{card.sub}</div>
                </div>
              ))}
            </div>

            {/* ── Chart + Action items ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20, marginBottom: 24 }}>

              {/* Donut chart */}
              <div style={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: 12, padding: '24px' }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f0ede8', margin: '0 0 20px' }}>Compliance Overview</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                  <div style={{ flexShrink: 0 }}>
                    <svg width="140" height="140" viewBox="0 0 140 140">
                      <circle cx="70" cy="70" r="54" fill="none" stroke="#1e1e2e" strokeWidth="18" />
                      {ARCS.map((arc, i) => (
                        <path key={i} d={arc.d} fill="none" stroke={arc.color} strokeWidth="18" strokeLinecap="butt" />
                      ))}
                      <text x="70" y="66" textAnchor="middle" fill="#f0ede8" fontSize="19" fontWeight="800" fontFamily="Inter, -apple-system, sans-serif">73%</text>
                      <text x="70" y="82" textAnchor="middle" fill="#6b6e87" fontSize="10" fontFamily="Inter, -apple-system, sans-serif">Compliant</text>
                    </svg>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[
                      { color: '#22c55e', label: 'Compliant',     value: '38', pct: '73%' },
                      { color: '#D97706', label: 'Issues Found',  value: '9',  pct: '17%' },
                      { color: '#60a5fa', label: 'Expiring Soon', value: '5',  pct: '10%' },
                    ].map(item => (
                      <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: 13, color: '#f0ede8', fontWeight: 600 }}>{item.label}</div>
                          <div style={{ fontSize: 11, color: '#6b6e87' }}>{item.value} vendors · {item.pct}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action items */}
              <div style={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: 12, padding: '24px' }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f0ede8', margin: '0 0 20px' }}>Action Items</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                  {[
                    { Icon: AlertTriangle, color: '#D97706', bg: 'rgba(217,119,6,0.07)',  border: 'rgba(217,119,6,0.2)',  text: '3 vendors missing additional insured endorsement' },
                    { Icon: Clock,         color: '#fbbf24', bg: 'rgba(251,191,36,0.07)', border: 'rgba(251,191,36,0.2)', text: '2 COIs expire within the next 30 days' },
                    { Icon: AlertTriangle, color: '#f87171', bg: 'rgba(248,113,113,0.07)',border: 'rgba(248,113,113,0.2)',text: '1 vendor has insufficient general liability limits' },
                  ].map((item, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      background: item.bg, border: `1px solid ${item.border}`,
                      borderRadius: 10, padding: '13px 16px',
                    }}>
                      <item.Icon size={15} color={item.color} style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: 14, color: '#e8e4f0' }}>{item.text}</span>
                    </div>
                  ))}
                </div>
                <Link href="/sign-up" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: '#D97706', color: '#fff',
                  fontSize: 13, fontWeight: 600, padding: '10px 18px',
                  borderRadius: 8, textDecoration: 'none',
                }}>
                  Fix These Issues →
                </Link>
              </div>
            </div>

            {/* ── Recent Submissions ── */}
            <div style={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: 12, overflow: 'hidden', marginBottom: 36 }}>
              <div style={{ padding: '18px 24px', borderBottom: '1px solid #1e1e2e' }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f0ede8', margin: 0 }}>Recent Submissions</h3>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #1e1e2e' }}>
                      {['Vendor', 'Submitted', 'Status', 'Issues', 'COI Expiration'].map(col => (
                        <th key={col} style={{
                          textAlign: 'left', padding: '11px 16px',
                          fontSize: 11, color: '#6b6e87', fontWeight: 600,
                          textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap',
                        }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {SUBMISSIONS.map((row, i) => {
                      const s = STATUS_STYLES[row.status] || STATUS_STYLES['Pending Review']
                      return (
                        <tr key={i} style={{ borderBottom: i < SUBMISSIONS.length - 1 ? '1px solid #1a1a28' : 'none' }}>
                          <td style={{ padding: '13px 16px', fontSize: 14, fontWeight: 600, color: '#f0ede8', whiteSpace: 'nowrap' }}>{row.vendor}</td>
                          <td style={{ padding: '13px 16px', fontSize: 13, color: '#6b6e87', whiteSpace: 'nowrap' }}>{row.date}</td>
                          <td style={{ padding: '13px 16px' }}>
                            <span style={{
                              background: s.bg, color: s.color, border: `1px solid ${s.border}`,
                              borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
                            }}>{row.status}</span>
                          </td>
                          <td style={{ padding: '13px 16px', textAlign: 'center' }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: row.issues > 0 ? '#D97706' : '#6b6e87' }}>{row.issues}</span>
                          </td>
                          <td style={{ padding: '13px 16px', fontSize: 13, color: '#6b6e87', whiteSpace: 'nowrap' }}>{row.expiration}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Vendors ── */}
            <h2 style={{ fontSize: 17, fontWeight: 700, color: '#f0ede8', margin: '0 0 16px' }}>Vendors</h2>

            <div style={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: 12, overflow: 'hidden', marginBottom: 36 }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #1e1e2e' }}>
                      {['Vendor Name', 'Type', 'Status', 'COI Expiration', 'Actions'].map(col => (
                        <th key={col} style={{
                          textAlign: 'left', padding: '13px 16px',
                          fontSize: 11, color: '#6b6e87', fontWeight: 600,
                          textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap',
                        }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {VENDORS.map((vendor, i) => {
                      const s = STATUS_STYLES[vendor.status] || STATUS_STYLES['Pending Review']
                      return (
                        <tr
                          key={i}
                          style={{ borderBottom: i < VENDORS.length - 1 ? '1px solid #1a1a28' : 'none', transition: 'background 0.1s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <td style={{ padding: '13px 16px', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <Building2 size={14} color="#4a4e6a" />
                              <span style={{ fontSize: 14, fontWeight: 600, color: '#f0ede8' }}>{vendor.name}</span>
                            </div>
                          </td>
                          <td style={{ padding: '13px 16px', fontSize: 13, color: '#6b6e87', whiteSpace: 'nowrap' }}>{vendor.type}</td>
                          <td style={{ padding: '13px 16px' }}>
                            <span style={{
                              background: s.bg, color: s.color, border: `1px solid ${s.border}`,
                              borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
                            }}>{vendor.status}</span>
                          </td>
                          <td style={{ padding: '13px 16px', fontSize: 13, color: '#6b6e87', whiteSpace: 'nowrap' }}>{vendor.expiration}</td>
                          <td style={{ padding: '13px 16px', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button onClick={showToast} style={{
                                background: 'rgba(217,119,6,0.08)', color: '#D97706',
                                border: '1px solid rgba(217,119,6,0.22)',
                                fontSize: 12, fontWeight: 600, padding: '6px 12px',
                                borderRadius: 6, cursor: 'pointer',
                              }}>
                                Upload COI
                              </button>
                              <button onClick={showToast} style={{
                                background: 'rgba(255,255,255,0.03)', color: '#7a7e9a',
                                border: '1px solid #1e1e2e',
                                fontSize: 12, fontWeight: 600, padding: '6px 12px',
                                borderRadius: 6, cursor: 'pointer',
                              }}>
                                View
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div style={{ padding: '11px 16px', borderTop: '1px solid #1e1e2e' }}>
                <span style={{ fontSize: 13, color: '#6b6e87' }}>Showing 8 of 52 vendors</span>
              </div>
            </div>

            {/* ── CTA ── */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(217,119,6,0.07) 0%, rgba(217,119,6,0.02) 100%)',
              border: '1px solid rgba(217,119,6,0.18)',
              borderRadius: 16, padding: '48px 40px',
              textAlign: 'center', marginBottom: 40,
            }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'rgba(217,119,6,0.1)', border: '1px solid rgba(217,119,6,0.22)',
                borderRadius: 100, padding: '5px 14px', marginBottom: 20,
              }}>
                <Shield size={12} color="#D97706" />
                <span style={{ fontSize: 12, color: '#D97706', fontWeight: 600, letterSpacing: '0.5px' }}>Get Started</span>
              </div>
              <h2 style={{ fontSize: 28, fontWeight: 800, color: '#f0ede8', margin: '0 0 12px', letterSpacing: '-0.8px' }}>
                Ready to verify your own vendors?
              </h2>
              <p style={{ fontSize: 15, color: '#6b6e87', margin: '0 0 28px', lineHeight: 1.6 }}>
                Sign up free and add your first vendor in under 2 minutes.
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link href="/sign-up" style={{
                  background: '#D97706', color: '#fff', fontSize: 15, fontWeight: 700,
                  padding: '13px 28px', borderRadius: 10, textDecoration: 'none',
                }}>
                  Get Started Free
                </Link>
                <Link href="/pricing" style={{
                  background: 'transparent', color: '#f0ede8', fontSize: 15, fontWeight: 600,
                  padding: '13px 28px', borderRadius: 10, textDecoration: 'none',
                  border: '1px solid #1e1e2e',
                }}>
                  View Pricing
                </Link>
              </div>
            </div>

          </div>
        </main>
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 300,
          background: '#15151f', border: '1px solid rgba(217,119,6,0.28)',
          borderRadius: 10, padding: '14px 18px',
          display: 'flex', alignItems: 'center', gap: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          fontSize: 14, color: '#f0ede8',
        }}>
          <Shield size={16} color="#D97706" />
          <span>Sign up to access vendor profiles</span>
          <Link href="/sign-up" style={{
            background: '#D97706', color: '#fff', fontSize: 12, fontWeight: 600,
            padding: '5px 12px', borderRadius: 6, textDecoration: 'none', marginLeft: 4,
          }}>
            Sign Up →
          </Link>
        </div>
      )}

    </div>
  )
}
