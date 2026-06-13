'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Bell, ChevronDown, Search, Upload,
  Download, Eye, FileText,
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
  orange: '#D97706',
  orangeHover: '#B45309',
  green: '#22c55e',
  amber: '#fbbf24',
  blue: '#8b8cf8',
  red: '#ef4444',
  primary: '#f8f8f8',
  secondary: '#8b8fa8',
  muted: '#4b5063',
}

// ── Types ─────────────────────────────────────────────────────────────────────

type Status = 'Compliant' | 'Issues Found' | 'Expiring Soon' | 'Pending Review'

type Submission = {
  id: string
  vendor: string
  vendorId: string
  uploaded: string
  policyPeriod: string
  status: Status
  issues: number
  score: number | null
}

type AnalysisResult = {
  effectiveDate?: string | null
  expirationDate?: string | null
  overallStatus?: string | null
  flags?: string[]
}

type DbRow = {
  id: string
  vendor_id: string | null
  status: string | null
  issues_count: number | null
  risk_score: number | null
  analysis_result: AnalysisResult | null
  created_at: string | null
  vendors: { id: string; name: string } | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function mapDbToSubmission(row: DbRow): Submission {
  const ar = row.analysis_result
  const ov = ar?.overallStatus ?? null

  let status: Status
  if (!ar) {
    status = 'Pending Review'
  } else if (ov === 'EXPIRING') {
    status = 'Expiring Soon'
  } else if (row.status === 'Compliant') {
    status = 'Compliant'
  } else {
    status = 'Issues Found'
  }

  let policyPeriod = 'Pending'
  if (ar?.effectiveDate && ar?.expirationDate) {
    policyPeriod = `${ar.effectiveDate} – ${ar.expirationDate}`
  } else if (ar?.expirationDate) {
    policyPeriod = ar.expirationDate
  }

  return {
    id: row.id,
    vendor: row.vendors?.name ?? 'Unknown Vendor',
    vendorId: row.vendors?.id ?? row.vendor_id ?? '',
    uploaded: row.created_at
      ? new Date(row.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : '—',
    policyPeriod,
    status,
    issues: row.issues_count ?? 0,
    score: row.risk_score ?? null,
  }
}

const STATUS_OPTIONS: (Status | 'All')[] = ['All', 'Compliant', 'Issues Found', 'Expiring Soon', 'Pending Review']
const DATE_OPTIONS = ['This Month', 'Last 3 Months', 'This Year', 'All Time']

function statusStyle(status: Status): { bg: string; color: string; border: string } {
  switch (status) {
    case 'Compliant':      return { bg: 'rgba(34,197,94,0.09)',  color: T.green,  border: 'rgba(34,197,94,0.22)'  }
    case 'Issues Found':   return { bg: 'rgba(217,119,6,0.09)',  color: T.orange, border: 'rgba(217,119,6,0.22)'  }
    case 'Expiring Soon':  return { bg: 'rgba(251,191,36,0.09)', color: T.amber,  border: 'rgba(251,191,36,0.22)' }
    case 'Pending Review': return { bg: 'rgba(139,140,248,0.09)',color: T.blue,   border: 'rgba(139,140,248,0.22)'}
  }
}

function scoreColor(score: number | null): string {
  if (score === null) return T.muted
  if (score >= 90) return T.green
  if (score >= 80) return '#86efac'
  if (score >= 70) return T.orange
  return T.red
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Status }) {
  const s = statusStyle(status)
  return (
    <span style={{
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
    }}>
      {status}
    </span>
  )
}

function FilterSelect({
  value, onChange, options,
}: {
  value: string
  onChange: (v: string) => void
  options: string[]
}) {
  return (
    <div style={{ position: 'relative' }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          background: T.card, border: `1px solid ${T.border}`,
          borderRadius: 8, padding: '8px 32px 8px 12px',
          fontSize: 13, color: T.primary, cursor: 'pointer',
          appearance: 'none', outline: 'none', minWidth: 148,
          transition: 'border-color 0.15s',
        }}
        onFocus={e => (e.target.style.borderColor = T.orange)}
        onBlur={e => (e.target.style.borderColor = T.border)}
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown size={13} color={T.secondary} style={{
        position: 'absolute', right: 10, top: '50%',
        transform: 'translateY(-50%)', pointerEvents: 'none',
      }} />
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SubmissionsPage() {
  const { user, isLoaded } = useUser()
  const [search, setSearch]       = useState('')
  const [statusFilter, setStatus] = useState<Status | 'All'>('All')
  const [dateFilter, setDate]     = useState('All Time')
  const [mounted, setMounted]     = useState(false)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!isLoaded || !user) return
    const userId = user.id
    async function fetchSubmissions() {
      setLoading(true)
      const { data, error } = await supabase
        .from('submissions')
        .select('id, vendor_id, status, issues_count, risk_score, analysis_result, created_at, vendors(id, name)')
        .eq('clerk_user_id', userId)
        .order('created_at', { ascending: false })

      if (!error && data) {
        setSubmissions((data as unknown as DbRow[]).map(mapDbToSubmission))
      }
      setLoading(false)
    }
    fetchSubmissions()
  }, [isLoaded, user])

  const filtered = submissions.filter(s => {
    if (search && !s.vendor.toLowerCase().includes(search.toLowerCase())) return false
    if (statusFilter !== 'All' && s.status !== statusFilter) return false
    return true
  })

  // Summary counts (based on full dataset, not filtered)
  const total     = submissions.length
  const compliant = submissions.filter(s => s.status === 'Compliant').length
  const issues    = submissions.filter(s => s.status === 'Issues Found').length
  const pending   = submissions.filter(s => s.status === 'Pending Review').length

  function handleExport() {
    const header = 'Vendor,Uploaded,Policy Period,Status,Issues,Score'
    const rows = submissions.map(s =>
      `"${s.vendor}","${s.uploaded}","${s.policyPeriod}","${s.status}",${s.issues},${s.score ?? ''}`
    )
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'covira_submissions.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{
      display: 'flex', minHeight: '100vh',
      background: T.bg, fontFamily: 'Inter, -apple-system, sans-serif',
      color: T.primary,
    }}>
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .pre-animate { opacity: 0; }
        .row-animate { animation: fadeSlideUp 0.36s ease both; }
        select option { background: #13131f; color: #f8f8f8; }
      `}</style>

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
              Submissions
            </h1>
            <p style={{ fontSize: 12, color: T.secondary, margin: 0 }}>
              All COI uploads and analysis history
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Link href="/upload" style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              background: T.orange, color: '#fff', textDecoration: 'none',
              borderRadius: 8, padding: '8px 16px',
              fontSize: 13, fontWeight: 600,
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

            <UserButton />
          </div>
        </header>

        {/* ── Content ── */}
        <div style={{ padding: 28, flex: 1 }}>

          {/* Filter bar */}
          <div style={{
            display: 'flex', gap: 10, marginBottom: 20,
            flexWrap: 'wrap', alignItems: 'center',
          }}>
            {/* Search */}
            <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 220 }}>
              <Search size={14} color={T.muted} style={{
                position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
              }} />
              <input
                type="text"
                placeholder="Search submissions..."
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

            <FilterSelect value={statusFilter} onChange={v => setStatus(v as Status | 'All')} options={STATUS_OPTIONS} />
            <FilterSelect value={dateFilter}   onChange={setDate}   options={DATE_OPTIONS} />

            {/* Export */}
            <button
              onClick={handleExport}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                background: 'none', border: `1px solid ${T.border}`,
                borderRadius: 8, padding: '8px 14px',
                fontSize: 13, fontWeight: 500, color: T.secondary, cursor: 'pointer',
                transition: 'border-color 0.15s, color 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.borderAccent; e.currentTarget.style.color = T.primary }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.secondary }}
            >
              <Download size={14} /> Export CSV
            </button>
          </div>

          {/* Summary stats bar */}
          <div style={{
            display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap',
          }}>
            {[
              { label: 'Total',        value: total,     pct: null,                                              color: T.secondary },
              { label: 'Compliant',    value: compliant, pct: total > 0 ? Math.round(compliant/total*100) : 0,  color: T.green    },
              { label: 'Issues Found', value: issues,    pct: total > 0 ? Math.round(issues/total*100)    : 0,  color: T.orange   },
              { label: 'Pending',      value: pending,   pct: total > 0 ? Math.round(pending/total*100)   : 0,  color: T.blue     },
            ].map(stat => (
              <div key={stat.label} style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: T.card, border: `1px solid ${T.border}`,
                borderRadius: 8, padding: '7px 14px',
              }}>
                <span style={{ fontSize: 12, color: T.secondary }}>{stat.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: stat.color }}>{stat.value}</span>
                {stat.pct !== null && (
                  <span style={{
                    fontSize: 11, color: T.muted,
                    background: 'rgba(255,255,255,0.04)',
                    border: `1px solid ${T.border}`,
                    borderRadius: 4, padding: '1px 6px',
                  }}>
                    {stat.pct}%
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Table */}
          <div style={{
            background: T.card, border: `1px solid ${T.border}`,
            borderRadius: 12, overflow: 'hidden',
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                    {['Vendor', 'COI Uploaded', 'Policy Period', 'Status', 'Issues', 'Score', 'Actions'].map(col => (
                      <th key={col} style={{
                        textAlign: 'left', padding: '12px 16px',
                        fontSize: 10, color: T.muted, fontWeight: 600,
                        textTransform: 'uppercase', letterSpacing: '0.07em',
                        whiteSpace: 'nowrap',
                      }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row, i) => (
                    <tr
                      key={row.id}
                      className={mounted ? 'row-animate' : 'pre-animate'}
                      style={{
                        borderBottom: i < filtered.length - 1 ? `1px solid ${T.border}` : 'none',
                        cursor: 'pointer',
                        animationDelay: mounted ? `${i * 60}ms` : undefined,
                        transition: 'background 0.15s',
                      }}
                      onClick={() => { window.location.href = `/report/${row.id}` }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#1a1a2e')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      {/* Vendor */}
                      <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                          <div style={{
                            width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                            background: 'rgba(217,119,6,0.08)',
                            border: '1px solid rgba(217,119,6,0.15)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <FileText size={12} color={T.orange} style={{ opacity: 0.7 }} />
                          </div>
                          <Link
                            href={row.vendorId ? `/vendors/${row.vendorId}` : '#'}
                            onClick={e => e.stopPropagation()}
                            style={{
                              fontSize: 13, fontWeight: 600, color: T.primary,
                              textDecoration: 'none', transition: 'color 0.15s',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.color = T.orange)}
                            onMouseLeave={e => (e.currentTarget.style.color = T.primary)}
                          >
                            {row.vendor}
                          </Link>
                        </div>
                      </td>

                      {/* Uploaded */}
                      <td style={{ padding: '14px 16px', fontSize: 12, color: T.secondary, whiteSpace: 'nowrap' }}>
                        {row.uploaded}
                      </td>

                      {/* Policy period */}
                      <td style={{ padding: '14px 16px', fontSize: 12, color: row.policyPeriod === 'Pending' ? T.muted : T.secondary, whiteSpace: 'nowrap', fontStyle: row.policyPeriod === 'Pending' ? 'italic' : 'normal' }}>
                        {row.policyPeriod}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px 16px' }}>
                        <StatusBadge status={row.status} />
                      </td>

                      {/* Issues */}
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <span style={{
                          fontSize: 13, fontWeight: 700,
                          color: row.issues > 0 ? T.orange : T.muted,
                        }}>
                          {row.issues}
                        </span>
                      </td>

                      {/* Score */}
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        {row.score !== null ? (
                          <span style={{
                            fontSize: 14, fontWeight: 800,
                            color: scoreColor(row.score),
                            letterSpacing: '-0.3px',
                          }}>
                            {row.score}
                          </span>
                        ) : (
                          <span style={{ fontSize: 12, color: T.muted, fontStyle: 'italic' }}>—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 16px' }} onClick={e => e.stopPropagation()}>
                        <Link
                          href={`/report/${row.id}`}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            background: 'rgba(255,255,255,0.04)', color: T.secondary,
                            border: `1px solid ${T.border}`,
                            borderRadius: 6, padding: '6px 12px',
                            fontSize: 12, fontWeight: 600, textDecoration: 'none',
                            whiteSpace: 'nowrap', transition: 'all 0.15s',
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.background = 'rgba(217,119,6,0.10)'
                            e.currentTarget.style.color = T.orange
                            e.currentTarget.style.borderColor = 'rgba(217,119,6,0.25)'
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                            e.currentTarget.style.color = T.secondary
                            e.currentTarget.style.borderColor = T.border
                          }}
                        >
                          <Eye size={12} /> View Report
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Empty states */}
            {!loading && submissions.length === 0 && (
              <div style={{ padding: '60px 24px', textAlign: 'center' }}>
                <FileText size={36} color={T.border} style={{ marginBottom: 14 }} />
                <p style={{ fontSize: 15, fontWeight: 600, color: T.primary, margin: '0 0 8px' }}>
                  No submissions yet.
                </p>
                <p style={{ fontSize: 13, color: T.secondary, margin: '0 0 20px' }}>
                  Upload your first COI to get started.
                </p>
                <Link href="/upload" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  background: T.orange, color: '#fff', textDecoration: 'none',
                  borderRadius: 8, padding: '10px 20px',
                  fontSize: 13, fontWeight: 600,
                  boxShadow: '0 2px 12px rgba(217,119,6,0.25)',
                }}>
                  <Upload size={14} /> Upload COI
                </Link>
              </div>
            )}

            {!loading && submissions.length > 0 && filtered.length === 0 && (
              <div style={{ padding: '52px 24px', textAlign: 'center' }}>
                <FileText size={32} color={T.border} style={{ marginBottom: 12 }} />
                <p style={{ fontSize: 14, fontWeight: 600, color: T.primary, margin: '0 0 6px' }}>
                  No submissions found
                </p>
                <p style={{ fontSize: 13, color: T.secondary, margin: 0 }}>
                  Try adjusting your search or filters
                </p>
              </div>
            )}

            {loading && (
              <div style={{ padding: '52px 24px', textAlign: 'center' }}>
                <p style={{ fontSize: 13, color: T.secondary, margin: 0 }}>Loading submissions…</p>
              </div>
            )}

            {/* Table footer */}
            <div style={{
              padding: '11px 16px', borderTop: `1px solid ${T.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: 12, color: T.muted }}>
                Showing {filtered.length} of {submissions.length} submissions
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
