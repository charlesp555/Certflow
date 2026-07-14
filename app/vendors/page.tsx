'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import {
  Bell, ChevronDown, Search, Upload,
  Eye, X, Building2, Lock, Trash2, AlertTriangle,
  ArrowUp, ArrowDown, ArrowUpDown,
} from 'lucide-react'
import Sidebar from '../components/Sidebar'
import COIUploadModal from '../components/COIUploadModal'
import { useUser, useAuth, UserButton } from '@clerk/nextjs'
import { createClerkSupabaseClient } from '@/lib/supabase'
import { FREE_VENDOR_LIMIT } from '@/lib/plans'

// ─── Design Bible voices ──────────────────────────────────────────────────────
// Schibsted Grotesk (voice) is inherited from the page root; evidence is set
// per-datum. Data is RECORDED, not said.
const EVIDENCE = 'var(--font-evidence), monospace'

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

// ─── Types ────────────────────────────────────────────────────────────────────

type VendorStatus = 'Compliant' | 'Issues Found' | 'Expiring Soon' | 'Pending Review'

type Vendor = {
  id: string
  name: string
  type: string
  status: VendorStatus
  expiration: string
  expirationRaw: string | null
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

type SortKey = 'name' | 'status' | 'expiration'
type SortDir = 'asc' | 'desc'

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

// Date-only strings (Postgres `date` columns arrive as "2026-01-01") must be
// parsed as LOCAL midnight — new Date("2026-01-01") is UTC midnight per the
// ECMAScript spec, which renders as the previous day in timezones behind UTC.
// Full timestamps (created_at) fall through untouched.
function parsePlainDate(value: string): Date {
  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]))
  const us = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (us) return new Date(Number(us[3]), Number(us[1]) - 1, Number(us[2]))
  return new Date(value)
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  try {
    return parsePlainDate(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
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
    type: row.type ?? UNTYPED,
    status: mapStatus(row.status),
    expiration: formatDate(row.expiration_date),
    expirationRaw: row.expiration_date ?? null,
    issues: latest?.issues_count ?? 0,
    lastUploaded: latest ? formatDate(latest.created_at) : formatDate(row.created_at),
  }
}

// ─── Constants ────────────────────────────────────────────────────────────────

// Sentinel shown for vendors with no `type` set (e.g. auto-created via the
// COI-upload path, which doesn't collect a type). Kept as a real string value
// — rather than '—' — so it's both an unambiguous label and a matchable
// filter option, instead of silently sitting outside every specific filter.
const UNTYPED = 'Untyped'

const VENDOR_TYPES = ['All', 'Plumbing', 'Electrical', 'HVAC', 'Roofing', 'Janitorial', 'General Contractor', 'Flooring', UNTYPED]
const STATUS_OPTIONS: (VendorStatus | 'All')[] = ['All', 'Compliant', 'Issues Found', 'Expiring Soon', 'Pending Review']
const EXPIRATION_OPTIONS = ['All', 'This Month', 'Next 30 Days', 'Next 90 Days', 'Expired']
const MODAL_TYPES = ['Plumbing', 'Electrical', 'HVAC', 'Roofing', 'Janitorial', 'General Contractor', 'Flooring']
const MODAL_STATUSES = ['Pending Review', 'Compliant', 'Issues Found', 'Expiring Soon']

const STATUS_ORDER: Record<VendorStatus, number> = {
  'Issues Found':   0,
  'Expiring Soon':  1,
  'Pending Review': 2,
  'Compliant':      3,
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

// Status semantics (Design Bible §Color): verified/compliant = earned orange;
// failures = attention red; expiring = dimmed attention (no warning color
// exists); pending = neutral ink. Flat chips — pills are banned.
function StatusBadge({ status }: { status: VendorStatus }) {
  const styles: Record<VendorStatus, { bg: string; color: string; border: string }> = {
    'Compliant':      { bg: 'rgba(249,115,22,0.08)', color: '#F97316', border: 'rgba(249,115,22,0.35)' },
    'Issues Found':   { bg: 'rgba(229,72,77,0.08)',  color: '#E5484D', border: 'rgba(229,72,77,0.35)'  },
    'Expiring Soon':  { bg: 'rgba(229,72,77,0.05)',  color: '#D0888C', border: 'rgba(229,72,77,0.22)'  },
    'Pending Review': { bg: 'transparent',           color: '#9AA3B2', border: '#262B35'               },
  }
  const s = styles[status]
  return (
    <span style={{
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      borderRadius: 2, padding: '3px 10px', fontSize: 11, fontFamily: EVIDENCE, whiteSpace: 'nowrap',
    }}>
      {status}
    </span>
  )
}

// ─── Paywall Modal ────────────────────────────────────────────────────────────

function PaywallModal({ onClose }: { onClose: () => void }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.70)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }} onClick={onClose}>
      <div style={{
        background: '#171A21', border: '1px solid #262B35', borderRadius: 8,
        padding: 40, width: '100%', maxWidth: 440,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        textAlign: 'center',
      }} onClick={e => e.stopPropagation()}>
        <div style={{
          width: 52, height: 52, borderRadius: '50%',
          background: 'rgba(255,255,255,0.03)', border: '1px solid #262B35',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          <Lock size={22} color="#9AA3B2" />
        </div>

        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#F2F4F8', margin: '0 0 10px' }}>
          You&apos;ve reached the free limit
        </h2>
        <p style={{ fontSize: 14, color: '#9AA3B2', margin: '0 0 28px', lineHeight: 1.6 }}>
          Upgrade to Pro to add unlimited vendors
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Link
            href="/pricing"
            style={{
              display: 'block', textAlign: 'center',
              background: '#F97316', color: '#fff',
              fontSize: 14, fontWeight: 700,
              padding: '12px 24px', borderRadius: 8, textDecoration: 'none',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#EA6A0C')}
            onMouseLeave={e => (e.currentTarget.style.background = '#F97316')}
          >
            Upgrade to Pro
          </Link>
          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: '1px solid #262B35',
              color: '#9AA3B2', fontSize: 14, fontWeight: 500,
              padding: '12px 24px', borderRadius: 8, cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#333A47'; e.currentTarget.style.color = '#F2F4F8' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#262B35'; e.currentTarget.style.color = '#9AA3B2' }}
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Add Vendor Modal ─────────────────────────────────────────────────────────

function AddVendorModal({
  onClose,
  onSave,
}: {
  onClose: () => void
  onSave: () => void
}) {
  const [form, setForm] = useState({ name: '', type: 'Plumbing', status: 'Pending Review' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Insert via the server route, not the browser Supabase client: the route is
  // where the free-tier cap is actually enforced (RLS can't count rows or read
  // the plan). The client-side check in handleAddVendorClick is only UX.
  const handleSave = async () => {
    if (!form.name.trim()) { setError('Vendor name is required.'); return }
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name.trim(), type: form.type }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({} as { error?: string }))
        setError(body.error || 'Failed to add vendor. Please try again.')
        setSaving(false)
        return
      }
    } catch {
      setError('Failed to add vendor. Please try again.')
      setSaving(false)
      return
    }
    setSaving(false)
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
        background: '#171A21', border: '1px solid #262B35', borderRadius: 8,
        padding: 32, width: '100%', maxWidth: 480,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#F2F4F8', margin: 0 }}>Add Vendor</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#9AA3B2', padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#9AA3B2', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Vendor Name
            </label>
            <input
              type="text"
              placeholder="e.g. Acme Plumbing LLC"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              style={{
                width: '100%', background: '#0C0E12', border: '1px solid #262B35',
                borderRadius: 8, padding: '10px 14px', fontSize: 14, color: '#F2F4F8',
                outline: 'none', transition: 'border-color 0.15s',
              }}
              onFocus={e => (e.target.style.borderColor = '#333A47')}
              onBlur={e => (e.target.style.borderColor = '#262B35')}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#9AA3B2', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Type
            </label>
            <select
              value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              style={{
                width: '100%', background: '#0C0E12', border: '1px solid #262B35',
                borderRadius: 8, padding: '10px 14px', fontSize: 14, color: '#F2F4F8',
                outline: 'none', cursor: 'pointer',
              }}
            >
              {MODAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#9AA3B2', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Status
            </label>
            <select
              value={form.status}
              onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              style={{
                width: '100%', background: '#0C0E12', border: '1px solid #262B35',
                borderRadius: 8, padding: '10px 14px', fontSize: 14, color: '#F2F4F8',
                outline: 'none', cursor: 'pointer',
              }}
            >
              {MODAL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {error && (
            <div style={{ fontSize: 13, color: '#F2A0A3', background: 'rgba(229,72,77,0.08)', border: '1px solid rgba(229,72,77,0.25)', borderRadius: 8, padding: '10px 14px' }}>
              {error}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 28, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: '1px solid #262B35',
              color: '#9AA3B2', fontSize: 14, fontWeight: 500,
              padding: '10px 20px', borderRadius: 8, cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              background: saving ? '#9A3412' : '#F97316', color: '#fff', fontSize: 14, fontWeight: 600,
              padding: '10px 24px', borderRadius: 8, border: 'none',
              cursor: saving ? 'not-allowed' : 'pointer', transition: 'background 0.15s',
            }}
            onMouseEnter={e => { if (!saving) e.currentTarget.style.background = '#EA6A0C' }}
            onMouseLeave={e => { if (!saving) e.currentTarget.style.background = '#F97316' }}
          >
            {saving ? 'Saving…' : 'Save Vendor'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

function DeleteConfirmModal({
  vendor,
  onClose,
  onConfirm,
  deleting,
  error,
}: {
  vendor: { id: string; name: string }
  onClose: () => void
  onConfirm: () => void
  deleting: boolean
  error: string
}) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }} onClick={onClose}>
      <div style={{
        background: '#171A21', border: '1px solid #262B35', borderRadius: 8,
        padding: 36, width: '100%', maxWidth: 440,
        boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
      }} onClick={e => e.stopPropagation()}>

        {/* Icon */}
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          background: 'rgba(229,72,77,0.10)', border: '1px solid rgba(229,72,77,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          <AlertTriangle size={22} color="#E5484D" />
        </div>

        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#F2F4F8', margin: '0 0 10px', textAlign: 'center' }}>
          Delete {vendor.name}?
        </h2>
        <p style={{ fontSize: 14, color: '#9AA3B2', margin: '0 0 28px', lineHeight: 1.6, textAlign: 'center' }}>
          This will permanently remove the vendor and all its uploaded COIs and
          analysis data. This can&apos;t be undone.
        </p>

        {error && (
          <div style={{
            fontSize: 13, color: '#F2A0A3',
            background: 'rgba(229,72,77,0.08)', border: '1px solid rgba(229,72,77,0.25)',
            borderRadius: 8, padding: '10px 14px', marginBottom: 20,
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            disabled={deleting}
            style={{
              flex: 1, background: 'transparent', border: '1px solid #262B35',
              color: '#9AA3B2', fontSize: 14, fontWeight: 500,
              padding: '11px 20px', borderRadius: 8, cursor: deleting ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { if (!deleting) { e.currentTarget.style.borderColor = '#333A47'; e.currentTarget.style.color = '#F2F4F8' } }}
            onMouseLeave={e => { if (!deleting) { e.currentTarget.style.borderColor = '#262B35'; e.currentTarget.style.color = '#9AA3B2' } }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            style={{
              flex: 1, background: deleting ? '#772629' : '#E5484D', color: '#fff',
              fontSize: 14, fontWeight: 600,
              padding: '11px 20px', borderRadius: 8, border: 'none',
              cursor: deleting ? 'not-allowed' : 'pointer', transition: 'background 0.15s',
            }}
            onMouseEnter={e => { if (!deleting) e.currentTarget.style.background = '#CE3B41' }}
            onMouseLeave={e => { if (!deleting) e.currentTarget.style.background = '#E5484D' }}
          >
            {deleting ? 'Deleting…' : 'Delete Vendor'}
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
          background: '#171A21', border: '1px solid #262B35',
          borderRadius: 8, padding: '8px 32px 8px 12px',
          fontSize: 13, color: '#F2F4F8', cursor: 'pointer',
          appearance: 'none', outline: 'none', minWidth: 140,
        }}
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown size={14} color="#9AA3B2" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
    </div>
  )
}

// ─── Sortable Column Header ───────────────────────────────────────────────────

function SortableHeader({
  label,
  colKey,
  activeSortKey,
  sortDir,
  onSort,
}: {
  label: string
  colKey: SortKey | null
  activeSortKey: SortKey | null
  sortDir: SortDir
  onSort: (key: SortKey) => void
}) {
  const isActive = colKey !== null && activeSortKey === colKey
  return (
    <th
      onClick={colKey ? () => onSort(colKey) : undefined}
      style={{
        textAlign: 'left', padding: '14px 16px',
        fontSize: 11, fontWeight: 600,
        color: isActive ? '#F2F4F8' : '#9AA3B2',
        textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap',
        cursor: colKey ? 'pointer' : 'default',
        userSelect: 'none',
        transition: 'color 0.15s',
      }}
      onMouseEnter={colKey ? e => { if (!isActive) e.currentTarget.style.color = '#F2F4F8' } : undefined}
      onMouseLeave={colKey ? e => { e.currentTarget.style.color = isActive ? '#F2F4F8' : '#9AA3B2' } : undefined}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
        {label}
        {colKey && (
          isActive
            ? (sortDir === 'asc'
              ? <ArrowUp size={11} color="#F2F4F8" />
              : <ArrowDown size={11} color="#F2F4F8" />)
            : <ArrowUpDown size={11} color="#454D59" />
        )}
      </span>
    </th>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function VendorsPage() {
  const { user, isLoaded } = useUser()
  const { getToken } = useAuth()
  const supabase = useMemo(() => createClerkSupabaseClient(getToken), [getToken])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [userPlan, setUserPlan] = useState<string>('free')
  const [showModal, setShowModal] = useState(false)
  const [showPaywall, setShowPaywall] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('All')
  const [filterType, setFilterType] = useState('All')
  const [filterExp, setFilterExp] = useState('All')
  const [sortKey, setSortKey] = useState<SortKey | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [uploadTarget, setUploadTarget] = useState<{ id: string; name: string } | null>(null)

  const fetchVendors = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    const [vendorsResult, planResult] = await Promise.all([
      supabase
        .from('vendors')
        .select('id, name, type, status, expiration_date, created_at, submissions(issues_count, created_at)')
        .eq('clerk_user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('users')
        .select('plan')
        .eq('clerk_user_id', user.id)
        .maybeSingle(),
    ])

    if (!vendorsResult.error && vendorsResult.data) {
      setVendors((vendorsResult.data as VendorRow[]).map(rowToVendor))
    }
    if (!planResult.error && planResult.data?.plan) {
      setUserPlan(planResult.data.plan)
    }
    setLoading(false)
  }, [user?.id])

  useEffect(() => {
    if (isLoaded && user) fetchVendors()
    else if (isLoaded) setLoading(false)
  }, [isLoaded, user, fetchVendors])

  const handleAddVendorClick = () => {
    if (userPlan === 'free' && vendors.length >= FREE_VENDOR_LIMIT) {
      setShowPaywall(true)
    } else {
      setShowModal(true)
    }
  }

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget || !user?.id) return
    setDeleting(true)
    setDeleteError('')

    // Delete submissions first (foreign key constraint), scoped to this user
    const { error: subErr } = await supabase
      .from('submissions')
      .delete()
      .eq('vendor_id', deleteTarget.id)
      .eq('clerk_user_id', user.id)

    if (subErr) {
      setDeleteError('Failed to delete COI data. Please try again.')
      setDeleting(false)
      return
    }

    // Then delete the vendor itself, scoped to this user
    const { error: vendorErr } = await supabase
      .from('vendors')
      .delete()
      .eq('id', deleteTarget.id)
      .eq('clerk_user_id', user.id)

    if (vendorErr) {
      setDeleteError('Failed to delete vendor. Please try again.')
      setDeleting(false)
      return
    }

    setDeleting(false)
    setDeleteTarget(null)
    fetchVendors()
  }

  const now = new Date()
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const filtered = vendors
    .filter(v => {
      if (search && !v.name.toLowerCase().includes(search.toLowerCase())) return false
      if (filterStatus !== 'All' && v.status !== filterStatus) return false
      if (filterType !== 'All' && v.type !== filterType) return false
      if (filterExp !== 'All' && v.expirationRaw) {
        const exp = parsePlainDate(v.expirationRaw)
        if (filterExp === 'This Month') {
          if (exp.getMonth() !== now.getMonth() || exp.getFullYear() !== now.getFullYear()) return false
        } else if (filterExp === 'Next 30 Days') {
          const cutoff = new Date(now); cutoff.setDate(cutoff.getDate() + 30)
          if (exp < now || exp > cutoff) return false
        } else if (filterExp === 'Next 90 Days') {
          const cutoff = new Date(now); cutoff.setDate(cutoff.getDate() + 90)
          if (exp < now || exp > cutoff) return false
        } else if (filterExp === 'Expired') {
          if (exp >= todayMidnight) return false
        }
      }
      return true
    })
    .sort((a, b) => {
      if (!sortKey) return 0
      const dir = sortDir === 'asc' ? 1 : -1
      if (sortKey === 'name') return dir * a.name.localeCompare(b.name)
      if (sortKey === 'status') return dir * (STATUS_ORDER[a.status] - STATUS_ORDER[b.status])
      if (sortKey === 'expiration') {
        const aTime = a.expirationRaw ? parsePlainDate(a.expirationRaw).getTime() : Infinity
        const bTime = b.expirationRaw ? parsePlainDate(b.expirationRaw).getTime() : Infinity
        return dir * (aTime - bTime)
      }
      return 0
    })

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0C0E12', fontFamily: 'var(--font-voice), sans-serif', position: 'relative', isolation: 'isolate' }}>
      <style>{`
        /* Page ledger-grid — same 24px hairline texture as the landing and
           dashboard, z -1 inside the isolated root: above the carbon ground,
           below all content. */
        .page-ledger-grid {
          position: absolute; inset: 0; z-index: -1; pointer-events: none;
          --grid-line: rgba(154,163,178, 0.06);
          background-image:
            repeating-linear-gradient(to bottom, var(--grid-line) 0, var(--grid-line) 1px, transparent 1px, transparent 24px),
            repeating-linear-gradient(to right,  var(--grid-line) 0, var(--grid-line) 1px, transparent 1px, transparent 24px);
        }
      `}</style>
      <div className="page-ledger-grid" aria-hidden="true" />
      <Sidebar />

      {showPaywall && (
        <PaywallModal onClose={() => setShowPaywall(false)} />
      )}

      {showModal && user && (
        <AddVendorModal
          onClose={() => setShowModal(false)}
          onSave={fetchVendors}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          vendor={deleteTarget}
          onClose={() => { setDeleteTarget(null); setDeleteError('') }}
          onConfirm={handleDelete}
          deleting={deleting}
          error={deleteError}
        />
      )}

      {uploadTarget && (
        <COIUploadModal
          vendorId={uploadTarget.id}
          vendorName={uploadTarget.name}
          onClose={() => setUploadTarget(null)}
          onSuccess={fetchVendors}
        />
      )}

      <main style={{ marginLeft: 240, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Topbar */}
        <header style={{
          padding: '0 32px', height: 64,
          borderBottom: '1px solid #262B35',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#0C0E12', position: 'sticky', top: 0, zIndex: 40,
        }}>
          <h1 style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em', color: '#F2F4F8', margin: 0 }}>Vendors</h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              onClick={handleAddVendorClick}
              style={{
                background: '#F97316', color: '#fff', fontSize: 14, fontWeight: 600,
                padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6, transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#EA6A0C')}
              onMouseLeave={e => (e.currentTarget.style.background = '#F97316')}
            >
              + Add Vendor
            </button>
            <button style={{
              position: 'relative', background: 'transparent', border: 'none',
              cursor: 'pointer', padding: 6, borderRadius: 8, color: '#9AA3B2',
            }}>
              <Bell size={20} />
              <span style={{ position: 'absolute', top: 5, right: 5, width: 8, height: 8, background: '#F97316', borderRadius: '50%', border: '2px solid #0C0E12' }} />
            </button>
            <UserButton appearance={CLERK_APPEARANCE} />
          </div>
        </header>

        {/* Content */}
        <div style={{ padding: 32, flex: 1 }}>
          {/* Search + Filters */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: '1', minWidth: 220 }}>
              <Search size={15} color="#9AA3B2" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search vendors..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%', background: '#171A21', border: '1px solid #262B35',
                  borderRadius: 8, padding: '8px 12px 8px 36px',
                  fontSize: 13, color: '#F2F4F8', outline: 'none',
                }}
              />
            </div>
            <FilterSelect value={filterStatus} onChange={setFilterStatus} options={STATUS_OPTIONS} />
            <FilterSelect value={filterType} onChange={setFilterType} options={VENDOR_TYPES} />
            <FilterSelect value={filterExp} onChange={setFilterExp} options={EXPIRATION_OPTIONS} />
          </div>

          {/* Table */}
          <div style={{ background: '#171A21', border: '1px solid #262B35', borderRadius: 8, overflow: 'hidden' }}>
            {loading ? (
              <div style={{ padding: '64px 24px', textAlign: 'center' }}>
                <div style={{ width: 32, height: 32, border: '3px solid rgba(154,163,178,0.15)', borderTop: '3px solid #9AA3B2', borderRadius: '50%', animation: 'spin 0.85s linear infinite', margin: '0 auto 12px' }} />
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                <div style={{ fontSize: 13, color: '#9AA3B2' }}>Loading vendors…</div>
              </div>
            ) : (
              <>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #262B35' }}>
                        <SortableHeader label="Vendor Name"    colKey="name"       activeSortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                        <SortableHeader label="Type"           colKey={null}        activeSortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                        <SortableHeader label="Status"         colKey="status"     activeSortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                        <SortableHeader label="Expiration Date" colKey="expiration" activeSortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                        <SortableHeader label="Issues"         colKey={null}        activeSortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                        <SortableHeader label="Last Uploaded"  colKey={null}        activeSortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                        <SortableHeader label="Actions"        colKey={null}        activeSortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((vendor, i) => (
                        <tr
                          key={vendor.id}
                          style={{ borderBottom: i < filtered.length - 1 ? '1px solid #262B35' : 'none', transition: 'background 0.12s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                            <Link
                              href={`/vendors/${vendor.id}`}
                              style={{ fontSize: 14, fontWeight: 600, color: '#F2F4F8', textDecoration: 'none' }}
                              onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                              onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
                            >
                              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Building2 size={14} color="#9AA3B2" />
                                {vendor.name}
                              </span>
                            </Link>
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: 13, whiteSpace: 'nowrap' }}>
                            {vendor.type === UNTYPED ? (
                              <span style={{ color: '#9AA3B2', fontStyle: 'italic' }} title="Set this vendor's type from its profile page">
                                Untyped
                              </span>
                            ) : (
                              <span style={{ color: '#9AA3B2' }}>{vendor.type}</span>
                            )}
                          </td>
                          <td style={{ padding: '14px 16px' }}><StatusBadge status={vendor.status} /></td>
                          <td style={{ padding: '14px 16px', fontSize: 12, color: '#9AA3B2', fontFamily: EVIDENCE, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{vendor.expiration}</td>
                          <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                            <span style={{ fontSize: 13, fontWeight: 500, fontFamily: EVIDENCE, fontVariantNumeric: 'tabular-nums', color: vendor.issues > 0 ? '#E5484D' : '#9AA3B2' }}>
                              {vendor.issues}
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: 12, color: '#9AA3B2', fontFamily: EVIDENCE, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{vendor.lastUploaded}</td>
                          <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button
                                onClick={() => setUploadTarget({ id: vendor.id, name: vendor.name })}
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 5,
                                  background: 'rgba(249,115,22,0.10)', color: '#F97316',
                                  border: '1px solid rgba(249,115,22,0.25)',
                                  fontSize: 12, fontWeight: 600, padding: '6px 12px',
                                  borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(249,115,22,0.20)' }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(249,115,22,0.10)' }}
                              >
                                <Upload size={12} />
                                Upload COI
                              </button>
                              <Link
                                href={`/vendors/${vendor.id}`}
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 5,
                                  background: 'rgba(255,255,255,0.04)', color: '#9AA3B2',
                                  border: '1px solid #262B35',
                                  fontSize: 12, fontWeight: 600, padding: '6px 12px',
                                  borderRadius: 8, textDecoration: 'none', transition: 'all 0.15s',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#F2F4F8' }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#9AA3B2' }}
                              >
                                <Eye size={12} />
                                View
                              </Link>
                              <button
                                onClick={() => { setDeleteTarget({ id: vendor.id, name: vendor.name }); setDeleteError('') }}
                                title={`Delete ${vendor.name}`}
                                style={{
                                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                  width: 30, height: 30,
                                  background: 'rgba(255,255,255,0.04)', color: '#5F6774',
                                  border: '1px solid #262B35',
                                  borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s',
                                  flexShrink: 0,
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(229,72,77,0.12)'; e.currentTarget.style.color = '#E5484D'; e.currentTarget.style.borderColor = 'rgba(229,72,77,0.30)' }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#5F6774'; e.currentTarget.style.borderColor = '#262B35' }}
                              >
                                <Trash2 size={13} />
                              </button>
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
                    <Building2 size={40} color="#262B35" style={{ marginBottom: 16 }} />
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#F2F4F8', marginBottom: 8 }}>No vendors yet</div>
                    <div style={{ fontSize: 14, color: '#9AA3B2', marginBottom: 24 }}>
                      Add your first vendor to get started.
                    </div>
                    <button
                      onClick={handleAddVendorClick}
                      style={{
                        background: '#F97316', color: '#fff', fontSize: 14, fontWeight: 600,
                        padding: '10px 24px', borderRadius: 8, border: 'none', cursor: 'pointer',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#EA6A0C')}
                      onMouseLeave={e => (e.currentTarget.style.background = '#F97316')}
                    >
                      + Add Vendor
                    </button>
                  </div>
                )}

                {vendors.length > 0 && filtered.length === 0 && (
                  <div style={{ padding: '48px 24px', textAlign: 'center', color: '#9AA3B2' }}>
                    <Building2 size={32} color="#262B35" style={{ marginBottom: 12 }} />
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, color: '#F2F4F8' }}>No vendors found</div>
                    <div style={{ fontSize: 13 }}>Try adjusting your search or filters</div>
                  </div>
                )}

                {/* Footer */}
                <div style={{ padding: '12px 16px', borderTop: '1px solid #262B35', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, color: '#9AA3B2' }}>
                    Showing {filtered.length} of {vendors.length} vendor{vendors.length !== 1 ? 's' : ''}
                  </span>
                  {sortKey && (
                    <button
                      onClick={() => { setSortKey(null); setSortDir('asc') }}
                      style={{
                        fontSize: 12, color: '#9AA3B2', background: 'transparent',
                        border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                      }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#F2F4F8')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#9AA3B2')}
                    >
                      <X size={11} /> Clear sort
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
