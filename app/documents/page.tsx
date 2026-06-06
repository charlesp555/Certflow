'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  Bell, User, ChevronDown, Search, Upload,
  Download, Eye, FileText, CheckCircle2,
} from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { UserButton } from '@clerk/nextjs'

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
  amber: '#fbbf24',
  red: '#ef4444',
  blue: '#8b8cf8',
  primary: '#f8f8f8',
  secondary: '#8b8fa8',
  muted: '#4b5063',
}

// ── Types ─────────────────────────────────────────────────────────────────────

type DocStatus = 'Active' | 'Expiring Soon' | 'Expired' | 'Pending Review'
type SortKey   = 'Newest First' | 'Oldest First' | 'Expiring Soonest'

interface Doc {
  id: string
  filename: string
  vendor: string
  vendorId: string
  uploaded: string
  policyPeriod: string
  status: DocStatus
}

// ── Data ──────────────────────────────────────────────────────────────────────

const DOCS: Doc[] = [
  { id:  '1', filename: 'COI_ABC_Plumbing_052025.pdf',      vendor: 'ABC Plumbing LLC',      vendorId: '1', uploaded: 'May 20, 2025', policyPeriod: 'May 22, 2025 – May 22, 2026', status: 'Active'        },
  { id:  '2', filename: 'COI_ABC_Plumbing_012025.pdf',      vendor: 'ABC Plumbing LLC',      vendorId: '1', uploaded: 'Jan 15, 2025', policyPeriod: 'Jan 15, 2025 – Jan 15, 2026', status: 'Expired'       },
  { id:  '3', filename: 'COI_Summit_Electric_052025.pdf',   vendor: 'Summit Electric Co.',   vendorId: '2', uploaded: 'May 19, 2025', policyPeriod: 'Feb 15, 2025 – Feb 15, 2027', status: 'Active'        },
  { id:  '4', filename: 'COI_Bluewater_HVAC_052025.pdf',    vendor: 'Bluewater HVAC',        vendorId: '3', uploaded: 'May 18, 2025', policyPeriod: 'Jan 10, 2025 – Jan 10, 2027', status: 'Active'        },
  { id:  '5', filename: 'COI_Pinnacle_Roofing_052025.pdf',  vendor: 'Pinnacle Roofing Inc.', vendorId: '4', uploaded: 'May 16, 2025', policyPeriod: 'Jun 01, 2025 – Jun 01, 2026', status: 'Active'        },
  { id:  '6', filename: 'COI_Bright_Services_052025.pdf',   vendor: 'Bright Services',       vendorId: '5', uploaded: 'May 15, 2025', policyPeriod: 'Jun 05, 2024 – Jun 05, 2025', status: 'Expiring Soon' },
  { id:  '7', filename: 'COI_ProBuild_052025.pdf',          vendor: 'ProBuild Contractors',  vendorId: '6', uploaded: 'May 14, 2025', policyPeriod: 'Mar 12, 2025 – Mar 12, 2027', status: 'Active'        },
  { id:  '8', filename: 'COI_Elite_Flooring_052025.pdf',    vendor: 'Elite Flooring',        vendorId: '7', uploaded: 'May 12, 2025', policyPeriod: 'Pending',                     status: 'Pending Review'},
  { id:  '9', filename: 'COI_Metro_Electric_052025.pdf',    vendor: 'Metro Electric Co.',    vendorId: '8', uploaded: 'May 10, 2025', policyPeriod: 'Aug 30, 2025 – Aug 30, 2026', status: 'Active'        },
  { id: '10', filename: 'COI_ABC_Plumbing_082024.pdf',      vendor: 'ABC Plumbing LLC',      vendorId: '1', uploaded: 'Aug 03, 2024', policyPeriod: 'Aug 03, 2024 – Aug 03, 2025', status: 'Expired'       },
  { id: '11', filename: 'COI_Summit_Electric_012025.pdf',   vendor: 'Summit Electric Co.',   vendorId: '2', uploaded: 'Jan 10, 2025', policyPeriod: 'Jan 10, 2025 – Feb 15, 2026', status: 'Active'        },
  { id: '12', filename: 'COI_Pinnacle_Roofing_012025.pdf',  vendor: 'Pinnacle Roofing Inc.', vendorId: '4', uploaded: 'Jan 08, 2025', policyPeriod: 'Jan 08, 2025 – Jun 01, 2025', status: 'Expired'       },
]

const VENDOR_OPTIONS = ['All Vendors', ...Array.from(new Set(DOCS.map(d => d.vendor)))]
const STATUS_OPTIONS: ('All' | DocStatus)[] = ['All', 'Active', 'Expiring Soon', 'Expired', 'Pending Review']
const SORT_OPTIONS: SortKey[] = ['Newest First', 'Oldest First', 'Expiring Soonest']

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusStyle(s: DocStatus) {
  switch (s) {
    case 'Active':        return { bg: 'rgba(34,197,94,0.09)',   color: T.green, border: 'rgba(34,197,94,0.22)'   }
    case 'Expiring Soon': return { bg: 'rgba(251,191,36,0.09)',  color: T.amber, border: 'rgba(251,191,36,0.22)'  }
    case 'Expired':       return { bg: 'rgba(239,68,68,0.09)',   color: T.red,   border: 'rgba(239,68,68,0.22)'   }
    case 'Pending Review':return { bg: 'rgba(139,140,248,0.09)', color: T.blue,  border: 'rgba(139,140,248,0.22)' }
  }
}

function fileIconColor(s: DocStatus) {
  switch (s) {
    case 'Active':         return T.green
    case 'Expiring Soon':  return T.amber
    case 'Expired':        return T.red
    case 'Pending Review': return T.blue
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{
      flex: 1, background: T.card, border: `1px solid ${T.border}`,
      borderRadius: 10, padding: '16px 20px',
      transition: 'border-color 0.2s, transform 0.2s',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = T.borderAccent; e.currentTarget.style.transform = 'translateY(-1px)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.transform = 'translateY(0)' }}
    >
      <p style={{ fontSize: 12, color: T.secondary, margin: '0 0 8px', fontWeight: 500 }}>{label}</p>
      <p style={{ fontSize: 28, fontWeight: 800, color, margin: 0, letterSpacing: '-1px', lineHeight: 1 }}>{value}</p>
    </div>
  )
}

function FilterSelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div style={{ position: 'relative' }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          background: T.card, border: `1px solid ${T.border}`,
          borderRadius: 8, padding: '8px 32px 8px 12px',
          fontSize: 13, color: T.primary, cursor: 'pointer',
          appearance: 'none', outline: 'none', minWidth: 150,
          transition: 'border-color 0.15s',
        }}
        onFocus={e => (e.target.style.borderColor = T.orange)}
        onBlur={e => (e.target.style.borderColor = T.border)}
      >
        {options.map(o => <option key={o} value={o} style={{ background: T.card }}>{o}</option>)}
      </select>
      <ChevronDown size={13} color={T.secondary} style={{
        position: 'absolute', right: 10, top: '50%',
        transform: 'translateY(-50%)', pointerEvents: 'none',
      }} />
    </div>
  )
}

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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DocumentsPage() {
  const [search,       setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState<'All' | DocStatus>('All')
  const [vendorFilter, setVendorFilter] = useState('All Vendors')
  const [sortBy,       setSortBy]       = useState<SortKey>('Newest First')
  const [mounted,      setMounted]      = useState(false)
  const [toastVisible, setToastVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  function showToast() {
    if (timerRef.current) clearTimeout(timerRef.current)
    setToastVisible(true)
    timerRef.current = setTimeout(() => setToastVisible(false), 3000)
  }

  // Filter
  let displayed = DOCS.filter(d => {
    if (search && !d.filename.toLowerCase().includes(search.toLowerCase()) &&
        !d.vendor.toLowerCase().includes(search.toLowerCase())) return false
    if (statusFilter !== 'All' && d.status !== statusFilter) return false
    if (vendorFilter !== 'All Vendors' && d.vendor !== vendorFilter) return false
    return true
  })

  // Sort
  if (sortBy === 'Oldest First') displayed = [...displayed].reverse()
  // 'Expiring Soonest' puts Active/Expiring first, Expired last
  if (sortBy === 'Expiring Soonest') {
    const order: DocStatus[] = ['Expiring Soon', 'Active', 'Pending Review', 'Expired']
    displayed = [...displayed].sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status))
  }

  // Stats (full dataset)
  const stats = {
    total:    DOCS.length,
    active:   DOCS.filter(d => d.status === 'Active').length,
    expiring: DOCS.filter(d => d.status === 'Expiring Soon').length,
    expired:  DOCS.filter(d => d.status === 'Expired').length,
  }

  return (
    <div style={{
      display: 'flex', minHeight: '100vh',
      background: T.bg, fontFamily: 'Inter, -apple-system, sans-serif',
      color: T.primary,
    }}>
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(11px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .pre-animate { opacity: 0; }
        .row-animate { animation: fadeSlideUp 0.34s ease both; }
      `}</style>

      <Toast message="Download started" visible={toastVisible} />
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
            <h1 style={{ fontSize: 16, fontWeight: 700, color: T.primary, margin: 0, lineHeight: 1.2 }}>
              Documents
            </h1>
            <p style={{ fontSize: 12, color: T.secondary, margin: 0 }}>
              All uploaded certificates of insurance
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Link href="/upload" style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              background: T.orange, color: '#fff', textDecoration: 'none',
              borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600,
              boxShadow: '0 2px 12px rgba(217,119,6,0.25)',
              transition: 'background 0.15s, transform 0.1s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = T.orangeHover; e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { e.currentTarget.style.background = T.orange; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <Upload size={14} /> Upload New COI
            </Link>

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
                position: 'absolute', top: 9, right: 9,
                width: 7, height: 7, borderRadius: '50%',
                background: T.orange, border: `2px solid ${T.bg}`,
              }} />
            </button>

            <UserButton afterSignOutUrl="/" />
          </div>
        </header>

        {/* ── Content ── */}
        <div style={{ padding: 28, flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 14 }}>
            <StatCard label="Total Documents" value={stats.total}    color={T.primary}  />
            <StatCard label="Active Policies"  value={stats.active}   color={T.green}    />
            <StatCard label="Expiring Soon"    value={stats.expiring} color={T.amber}    />
            <StatCard label="Expired"          value={stats.expired}  color={T.red}      />
          </div>

          {/* Filter bar */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 200 }}>
              <Search size={14} color={T.muted} style={{
                position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
              }} />
              <input
                type="text"
                placeholder="Search documents..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%', background: T.card, border: `1px solid ${T.border}`,
                  borderRadius: 8, padding: '8px 12px 8px 36px',
                  fontSize: 13, color: T.primary, outline: 'none',
                  transition: 'border-color 0.15s', boxSizing: 'border-box',
                }}
                onFocus={e => (e.target.style.borderColor = T.orange)}
                onBlur={e => (e.target.style.borderColor = T.border)}
              />
            </div>
            <FilterSelect value={statusFilter} onChange={v => setStatusFilter(v as 'All' | DocStatus)} options={STATUS_OPTIONS} />
            <FilterSelect value={vendorFilter} onChange={setVendorFilter} options={VENDOR_OPTIONS} />
            <FilterSelect value={sortBy}       onChange={v => setSortBy(v as SortKey)}              options={SORT_OPTIONS} />
          </div>

          {/* Table */}
          <div style={{
            background: T.card, border: `1px solid ${T.border}`,
            borderRadius: 12, overflow: 'hidden', flex: 1,
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                    {['Document', 'Vendor', 'Uploaded', 'Policy Period', 'Status', 'Actions'].map(col => (
                      <th key={col} style={{
                        textAlign: 'left', padding: '12px 16px',
                        fontSize: 10, color: T.muted, fontWeight: 600,
                        textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap',
                      }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayed.map((doc, i) => {
                    const ss      = statusStyle(doc.status)
                    const expired = doc.status === 'Expired'
                    return (
                      <tr
                        key={doc.id}
                        className={mounted ? 'row-animate' : 'pre-animate'}
                        style={{
                          borderBottom: i < displayed.length - 1 ? `1px solid ${T.border}` : 'none',
                          opacity: expired ? 0.7 : 1,
                          animationDelay: mounted ? `${i * 45}ms` : undefined,
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#1a1a2e')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        {/* Document */}
                        <td style={{ padding: '13px 16px', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 30, height: 30, borderRadius: 7, flexShrink: 0,
                              background: `${ss.bg}`,
                              border: `1px solid ${ss.border}`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <FileText size={13} color={fileIconColor(doc.status)} />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 600, color: T.primary, fontFamily: 'monospace' }}>
                              {doc.filename}
                            </span>
                          </div>
                        </td>

                        {/* Vendor */}
                        <td style={{ padding: '13px 16px', whiteSpace: 'nowrap' }}>
                          <Link
                            href={`/vendors/${doc.vendorId}`}
                            style={{ fontSize: 13, fontWeight: 500, color: T.secondary, textDecoration: 'none', transition: 'color 0.15s' }}
                            onMouseEnter={e => (e.currentTarget.style.color = T.orange)}
                            onMouseLeave={e => (e.currentTarget.style.color = T.secondary)}
                          >
                            {doc.vendor}
                          </Link>
                        </td>

                        {/* Uploaded */}
                        <td style={{ padding: '13px 16px', fontSize: 12, color: T.secondary, whiteSpace: 'nowrap' }}>
                          {doc.uploaded}
                        </td>

                        {/* Policy period */}
                        <td style={{
                          padding: '13px 16px', fontSize: 12, whiteSpace: 'nowrap',
                          color: doc.policyPeriod === 'Pending' ? T.muted : T.secondary,
                          fontStyle: doc.policyPeriod === 'Pending' ? 'italic' : 'normal',
                        }}>
                          {doc.policyPeriod}
                        </td>

                        {/* Status */}
                        <td style={{ padding: '13px 16px' }}>
                          <span style={{
                            background: ss.bg, color: ss.color, border: `1px solid ${ss.border}`,
                            borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
                          }}>
                            {doc.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '13px 16px' }}>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <Link
                              href="/report"
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: 5,
                                background: 'rgba(217,119,6,0.07)', color: T.orange,
                                border: '1px solid rgba(217,119,6,0.20)',
                                borderRadius: 6, padding: '5px 11px',
                                fontSize: 12, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap',
                                transition: 'all 0.15s',
                              }}
                              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(217,119,6,0.15)'; e.currentTarget.style.borderColor = 'rgba(217,119,6,0.35)' }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(217,119,6,0.07)'; e.currentTarget.style.borderColor = 'rgba(217,119,6,0.20)' }}
                            >
                              <Eye size={11} /> View
                            </Link>
                            <button
                              onClick={showToast}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: 5,
                                background: 'rgba(255,255,255,0.04)', color: T.secondary,
                                border: `1px solid ${T.border}`,
                                borderRadius: 6, padding: '5px 11px',
                                fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                                transition: 'all 0.15s',
                              }}
                              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; e.currentTarget.style.color = T.primary; e.currentTarget.style.borderColor = T.borderAccent }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = T.secondary; e.currentTarget.style.borderColor = T.border }}
                            >
                              <Download size={11} /> Download
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {displayed.length === 0 && (
              <div style={{ padding: '52px 24px', textAlign: 'center' }}>
                <FileText size={32} color={T.border} style={{ marginBottom: 12 }} />
                <p style={{ fontSize: 14, fontWeight: 600, color: T.primary, margin: '0 0 6px' }}>No documents found</p>
                <p style={{ fontSize: 13, color: T.secondary, margin: 0 }}>Try adjusting your search or filters</p>
              </div>
            )}

            {/* Footer */}
            <div style={{
              padding: '11px 16px', borderTop: `1px solid ${T.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: 12, color: T.muted }}>
                Showing {displayed.length} of {DOCS.length} documents
              </span>
              <Link href="/upload" style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                fontSize: 12, color: T.orange, textDecoration: 'none', fontWeight: 500,
                transition: 'opacity 0.15s',
              }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                <Upload size={12} /> Upload new COI
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
