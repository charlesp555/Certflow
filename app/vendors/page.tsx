'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Bell, User, ChevronDown, Search, Upload,
  Eye, X, Building2,
} from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { useUser } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

type VendorStatus = 'Compliant' | 'Issues Found' | 'Expiring Soon' | 'Pending Review'

type Vendor = {
  id: string
  name: string
  type: string
  status: VendorStatus
  expiration: string
  issues: number
  lastUploaded: string
}

type VendorRow = {
  id: string
  name: string
  type: string | null
  status: string | null
  expiration_date: string | null
  created_at: string | null
  submissions: Array<{ issues_count: number | null; created_at: string | null }> | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapStatus(dbStatus: string | null): VendorStatus {
  switch (dbStatus) {
    case 'active':        return 'Compliant'
    case 'expiring':      return 'Expiring Soon'
    case 'expired':
    case 'non_compliant': return 'Issues Found'
    default:              return 'Pending Review'
  }
}

function dbStatusFromDisplay(display: string): string {
  switch (display) {
    case 'Compliant':      return 'active'
    case 'Expiring Soon':  return 'expiring'
    case 'Issues Found':   return 'non_compliant'
    default:               return 'pending'
  }
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return '—'
  }
}

function rowToVendor(row: VendorRow): Vendor {
  const subs = (row.submissions ?? [])
    .filter(s => s.created_at)
    .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime())
  const latest = subs[0] ?? null
  return {
    id: row.id,
    name: row.name,
    type: row.type ?? '—',
    status: mapStatus(row.status),
    expiration: formatDate(row.expiration_date),
    issues: latest?.issues_count ?? 0,
    lastUploaded: latest ? formatDate(latest.created_at) : formatDate(row.created_at),
  }
}

// ─── Constants ────────────────────────────────────────────────────────────────

const VENDOR_TYPES = ['All', 'Plumbing', 'Electrical', 'HVAC', 'Roofing', 'Janitorial', 'General Contractor', 'Flooring']
const STATUS_OPTIONS: (VendorStatus | 'All')[] = ['All', 'Compliant', 'Issues Found', 'Expiring Soon', 'Pending Review']
const EXPIRATION_OPTIONS = ['All', 'This Month', 'Next 30 Days', 'Next 90 Days']
const MODAL_TYPES = ['Plumbing', 'Electrical', 'HVAC', 'Roofing', 'Janitorial', 'General Contractor', 'Flooring']
const MODAL_STATUSES = ['Pending Review', 'Compliant', 'Issues Found', 'Expiring Soon']

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: VendorStatus }) {
  const styles: Record<VendorStatus, { bg: string; color: string; border: string }> = {
    'Compliant':      { bg: '#052e16', color: '#22c55e', border: '#166534' },
    'Issues Found':   { bg: '#1c0a00', color: '#D97706', border: '#92400e' },
    'Expiring Soon':  { bg: '#1a1000', color: '#fbbf24', border: '#78350f' },
    'Pending Review': { bg: '#0f0f1a', color: '#8b8cf8', border: '#3730a3' },
  }
  const s = styles[status]
  return (
    <span style={{
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
    }}>
      {status}
    </span>
  )
}

// ─── Add Vendor Modal ─────────────────────────────────────────────────────────

function AddVendorModal({
  clerkUserId,
  onClose,
  onSave,
}: {
  clerkUserId: string
  onClose: () => void
  onSave: () => void
}) {
  const [form, setForm] = useState({ name: '', type: 'Plumbing', status: 'Pending Review' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Vendor name is required.'); return }
    setSaving(true)
    setError('')
    const { error: dbErr } = await supabase.from('vendors').insert({
      clerk_user_id: clerkUserId,
      name: form.name.trim(),
      type: form.type,
      status: 'Pending Review',
      created_at: new Date().toISOString(),
    })
    setSaving(false)
    if (dbErr) { setError('Failed to add vendor. Please try again.'); return }
    onSave()
    onClose()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.70)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }} onClick={onClose}>
      <div style={{
        background: '#111118', border: '1px solid #1e1e2e', borderRadius: 16,
        padding: 32, width: '100%', maxWidth: 480,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f0ede8', margin: 0 }}>Add Vendor</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#8a8599', padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#8a8599', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Vendor Name
            </label>
            <input
              type="text"
              placeholder="e.g. Acme Plumbing LLC"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              style={{
                width: '100%', background: '#0a0a0f', border: '1px solid #1e1e2e',
                borderRadius: 8, padding: '10px 14px', fontSize: 14, color: '#f0ede8',
                outline: 'none', transition: 'border-color 0.15s',
              }}
              onFocus={e => (e.target.style.borderColor = '#D97706')}
              onBlur={e => (e.target.style.borderColor = '#1e1e2e')}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#8a8599', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Type
            </label>
            <select
              value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              style={{
                width: '100%', background: '#0a0a0f', border: '1px solid #1e1e2e',
                borderRadius: 8, padding: '10px 14px', fontSize: 14, color: '#f0ede8',
                outline: 'none', cursor: 'pointer',
              }}
            >
              {MODAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#8a8599', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Status
            </label>
            <select
              value={form.status}
              onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              style={{
                width: '100%', background: '#0a0a0f', border: '1px solid #1e1e2e',
                borderRadius: 8, padding: '10px 14px', fontSize: 14, color: '#f0ede8',
                outline: 'none', cursor: 'pointer',
              }}
            >
              {MODAL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {error && (
            <div style={{ fontSize: 13, color: '#fca5a5', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: '10px 14px' }}>
              {error}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 28, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: '1px solid #1e1e2e',
              color: '#8a8599', fontSize: 14, fontWeight: 500,
              padding: '10px 20px', borderRadius: 8, cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              background: saving ? '#92400e' : '#D97706', color: '#fff', fontSize: 14, fontWeight: 600,
              padding: '10px 24px', borderRadius: 8, border: 'none',
              cursor: saving ? 'not-allowed' : 'pointer', transition: 'background 0.15s',
            }}
            onMouseEnter={e => { if (!saving) e.currentTarget.style.background = '#b45309' }}
            onMouseLeave={e => { if (!saving) e.currentTarget.style.background = '#D97706' }}
          >
            {saving ? 'Saving…' : 'Save Vendor'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Filter Select ────────────────────────────────────────────────────────────

function FilterSelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div style={{ position: 'relative' }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          background: '#111118', border: '1px solid #1e1e2e',
          borderRadius: 8, padding: '8px 32px 8px 12px',
          fontSize: 13, color: '#f0ede8', cursor: 'pointer',
          appearance: 'none', outline: 'none', minWidth: 140,
        }}
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown size={14} color="#8a8599" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function VendorsPage() {
  const { user, isLoaded } = useUser()
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('All')
  const [filterType, setFilterType] = useState('All')
  const [filterExp, setFilterExp] = useState('All')

  const fetchVendors = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    const { data, error } = await supabase
      .from('vendors')
      .select('id, name, type, status, expiration_date, created_at, submissions(issues_count, created_at)')
      .eq('clerk_user_id', user.id)
      .order('created_at', { ascending: false })
    if (!error && data) setVendors((data as VendorRow[]).map(rowToVendor))
    setLoading(false)
  }, [user?.id])

  useEffect(() => {
    if (isLoaded && user) fetchVendors()
    else if (isLoaded) setLoading(false)
  }, [isLoaded, user, fetchVendors])

  const filtered = vendors.filter(v => {
    if (search && !v.name.toLowerCase().includes(search.toLowerCase())) return false
    if (filterStatus !== 'All' && v.status !== filterStatus) return false
    if (filterType !== 'All' && v.type !== filterType) return false
    return true
  })

  const displayName = user?.fullName || user?.firstName || 'Account'

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0a0f', fontFamily: 'Inter, -apple-system, sans-serif' }}>
      <Sidebar />

      {showModal && user && (
        <AddVendorModal
          clerkUserId={user.id}
          onClose={() => setShowModal(false)}
          onSave={fetchVendors}
        />
      )}

      <main style={{ marginLeft: 240, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Topbar */}
        <header style={{
          padding: '0 32px', height: 64,
          borderBottom: '1px solid #1e1e2e',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#0a0a0f', position: 'sticky', top: 0, zIndex: 40,
        }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: '#f0ede8', margin: 0 }}>Vendors</h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              onClick={() => setShowModal(true)}
              style={{
                background: '#D97706', color: '#fff', fontSize: 14, fontWeight: 600,
                padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6, transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#b45309')}
              onMouseLeave={e => (e.currentTarget.style.background = '#D97706')}
            >
              + Add Vendor
            </button>
            <button style={{
              position: 'relative', background: 'transparent', border: 'none',
              cursor: 'pointer', padding: 6, borderRadius: 8, color: '#8a8599',
            }}>
              <Bell size={20} />
              <span style={{ position: 'absolute', top: 5, right: 5, width: 8, height: 8, background: '#D97706', borderRadius: '50%', border: '2px solid #0a0a0f' }} />
            </button>
            <button style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'transparent', border: '1px solid #1e1e2e',
              borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
            }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(217,119,6,0.20)', border: '1px solid rgba(217,119,6,0.30)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={13} color="#D97706" />
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#f0ede8' }}>{displayName}</span>
              <ChevronDown size={14} color="#8a8599" />
            </button>
          </div>
        </header>

        {/* Content */}
        <div style={{ padding: 32, flex: 1 }}>
          {/* Search + Filters */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: '1', minWidth: 220 }}>
              <Search size={15} color="#8a8599" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search vendors..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%', background: '#111118', border: '1px solid #1e1e2e',
                  borderRadius: 8, padding: '8px 12px 8px 36px',
                  fontSize: 13, color: '#f0ede8', outline: 'none',
                }}
              />
            </div>
            <FilterSelect value={filterStatus} onChange={setFilterStatus} options={STATUS_OPTIONS} />
            <FilterSelect value={filterType} onChange={setFilterType} options={VENDOR_TYPES} />
            <FilterSelect value={filterExp} onChange={setFilterExp} options={EXPIRATION_OPTIONS} />
          </div>

          {/* Table */}
          <div style={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: 12, overflow: 'hidden' }}>
            {loading ? (
              <div style={{ padding: '64px 24px', textAlign: 'center' }}>
                <div style={{ width: 32, height: 32, border: '3px solid rgba(217,119,6,0.15)', borderTop: '3px solid #D97706', borderRadius: '50%', animation: 'spin 0.85s linear infinite', margin: '0 auto 12px' }} />
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                <div style={{ fontSize: 13, color: '#8a8599' }}>Loading vendors…</div>
              </div>
            ) : (
              <>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #1e1e2e' }}>
                        {['Vendor Name', 'Type', 'Status', 'Expiration Date', 'Issues', 'Last Uploaded', 'Actions'].map(col => (
                          <th key={col} style={{
                            textAlign: 'left', padding: '14px 16px',
                            fontSize: 11, color: '#8a8599', fontWeight: 600,
                            textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap',
                          }}>
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((vendor, i) => (
                        <tr
                          key={vendor.id}
                          style={{ borderBottom: i < filtered.length - 1 ? '1px solid #1e1e2e' : 'none', transition: 'background 0.12s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                            <Link
                              href={`/vendors/${vendor.id}`}
                              style={{ fontSize: 14, fontWeight: 600, color: '#f0ede8', textDecoration: 'none' }}
                              onMouseEnter={e => (e.currentTarget.style.color = '#D97706')}
                              onMouseLeave={e => (e.currentTarget.style.color = '#f0ede8')}
                            >
                              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Building2 size={14} color="#8a8599" />
                                {vendor.name}
                              </span>
                            </Link>
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: 13, color: '#8a8599', whiteSpace: 'nowrap' }}>{vendor.type}</td>
                          <td style={{ padding: '14px 16px' }}><StatusBadge status={vendor.status} /></td>
                          <td style={{ padding: '14px 16px', fontSize: 13, color: '#8a8599', whiteSpace: 'nowrap' }}>{vendor.expiration}</td>
                          <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: vendor.issues > 0 ? '#D97706' : '#8a8599' }}>
                              {vendor.issues}
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: 13, color: '#8a8599', whiteSpace: 'nowrap' }}>{vendor.lastUploaded}</td>
                          <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <Link
                                href={`/upload?vendorId=${vendor.id}&vendorName=${encodeURIComponent(vendor.name)}`}
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 5,
                                  background: 'rgba(217,119,6,0.10)', color: '#D97706',
                                  border: '1px solid rgba(217,119,6,0.25)',
                                  fontSize: 12, fontWeight: 600, padding: '6px 12px',
                                  borderRadius: 6, textDecoration: 'none', transition: 'all 0.15s',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(217,119,6,0.20)' }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(217,119,6,0.10)' }}
                              >
                                <Upload size={12} />
                                Upload COI
                              </Link>
                              <Link
                                href={`/vendors/${vendor.id}`}
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 5,
                                  background: 'rgba(255,255,255,0.04)', color: '#8a8599',
                                  border: '1px solid #1e1e2e',
                                  fontSize: 12, fontWeight: 600, padding: '6px 12px',
                                  borderRadius: 6, textDecoration: 'none', transition: 'all 0.15s',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#f0ede8' }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#8a8599' }}
                              >
                                <Eye size={12} />
                                View
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Empty states */}
                {vendors.length === 0 && (
                  <div style={{ padding: '64px 24px', textAlign: 'center' }}>
                    <Building2 size={40} color="#1e1e2e" style={{ marginBottom: 16 }} />
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#f0ede8', marginBottom: 8 }}>No vendors yet</div>
                    <div style={{ fontSize: 14, color: '#8a8599', marginBottom: 24 }}>
                      Add your first vendor to get started.
                    </div>
                    <button
                      onClick={() => setShowModal(true)}
                      style={{
                        background: '#D97706', color: '#fff', fontSize: 14, fontWeight: 600,
                        padding: '10px 24px', borderRadius: 8, border: 'none', cursor: 'pointer',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#b45309')}
                      onMouseLeave={e => (e.currentTarget.style.background = '#D97706')}
                    >
                      + Add Vendor
                    </button>
                  </div>
                )}

                {vendors.length > 0 && filtered.length === 0 && (
                  <div style={{ padding: '48px 24px', textAlign: 'center', color: '#8a8599' }}>
                    <Building2 size={32} color="#1e1e2e" style={{ marginBottom: 12 }} />
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, color: '#f0ede8' }}>No vendors found</div>
                    <div style={{ fontSize: 13 }}>Try adjusting your search or filters</div>
                  </div>
                )}

                {/* Footer */}
                <div style={{ padding: '12px 16px', borderTop: '1px solid #1e1e2e', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, color: '#8a8599' }}>
                    Showing {filtered.length} of {vendors.length} vendor{vendors.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
