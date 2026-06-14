'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Bell, ArrowLeft, Upload, FileText,
  Check, X, AlertTriangle, Eye, Clock,
  CheckCircle2, XCircle, MessageSquare, Shield,
} from 'lucide-react'
import Sidebar from '../../components/Sidebar'
import COIUploadModal from '../../components/COIUploadModal'
import { UserButton, useUser } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase'

// ── Design tokens ─────────────────────────────────────────────────────────────

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
  red:         '#ef4444',
  blue:        '#8b8cf8',
  primary:     '#f8f8f8',
  secondary:   '#8b8fa8',
  muted:       '#4b5063',
}

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'documents' | 'history' | 'notes'

type CoverageLine = {
  type: string
  eachOccurrence: string
  aggregate: string
  deductible: string
}

type RequirementCheck = {
  coverage: string
  minimum: string
  actual: string
  passed: boolean
  reason: string
}

type AnalysisResult = {
  insuredName?: string | null
  effectiveDate?: string | null
  expirationDate?: string | null
  coverages?: CoverageLine[]
  additionalInsured?: boolean
  waiverOfSubrogation?: boolean
  flags?: string[]
  overallStatus?: string | null
  requirementsCheck?: RequirementCheck[]
}

type Submission = {
  id: string
  status: string | null
  issues_count: number | null
  risk_score: number | null
  analysis_result: AnalysisResult | null
  created_at: string | null
}

type Vendor = {
  id: string
  name: string
  type: string | null
  status: string | null
  expiration_date: string | null
  created_at: string | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function vendorStatusInfo(status: string | null) {
  switch (status) {
    case 'active':        return { label: 'Compliant',      color: T.green,  bg: 'rgba(34,197,94,0.09)',    border: 'rgba(34,197,94,0.22)'   }
    case 'expiring':      return { label: 'Expiring Soon',  color: T.amber,  bg: 'rgba(251,191,36,0.09)',   border: 'rgba(251,191,36,0.22)'  }
    case 'expired':       return { label: 'Expired',        color: T.red,    bg: 'rgba(239,68,68,0.09)',    border: 'rgba(239,68,68,0.22)'   }
    case 'non_compliant': return { label: 'Issues Found',   color: T.orange, bg: 'rgba(217,119,6,0.09)',   border: 'rgba(217,119,6,0.22)'   }
    default:              return { label: 'Pending Review', color: T.blue,   bg: 'rgba(139,140,248,0.09)', border: 'rgba(139,140,248,0.22)' }
  }
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  try { return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }
  catch { return '—' }
}

function valueOk(v: string | null | undefined): boolean {
  if (!v) return false
  const n = v.toLowerCase().trim()
  return n !== '' && n !== 'n/a' && n !== '$0' && n !== '0' && n !== 'none' && n !== 'not listed' && n !== 'not included'
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

// ── CoverageBadge ─────────────────────────────────────────────────────────────

function CoverageBadge({ ok }: { ok: boolean }) {
  return ok ? (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(34,197,94,0.09)', color: T.green, border: '1px solid rgba(34,197,94,0.22)', borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
      <Check size={10} strokeWidth={2.5} /> Compliant
    </span>
  ) : (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(239,68,68,0.09)', color: T.red, border: '1px solid rgba(239,68,68,0.22)', borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
      <X size={10} strokeWidth={2.5} /> Missing
    </span>
  )
}

// ── Overview Tab ──────────────────────────────────────────────────────────────

function OverviewTab({ latestSub, showToast }: { latestSub: Submission | null; showToast: (m: string) => void }) {
  const ar = latestSub?.analysis_result ?? null

  type CovRow = { type: string; actual: string; ok: boolean }
  const rows: CovRow[] = []

  const reqCheck = ar?.requirementsCheck ?? []

  if (reqCheck.length > 0) {
    for (const req of reqCheck) {
      rows.push({ type: req.coverage, actual: req.actual || '—', ok: req.passed })
    }
  } else {
    // Fallback for older submissions without requirementsCheck
    if (ar?.coverages) {
      for (const c of ar.coverages) {
        const display = [c.eachOccurrence, c.aggregate]
          .filter(v => v && !['$0', 'N/A', 'n/a', '0', 'None'].includes(v))
          .join(' / ') || '—'
        rows.push({ type: c.type, actual: display, ok: valueOk(c.eachOccurrence) || valueOk(c.aggregate) })
      }
    }
    rows.push({ type: 'Additional Insured',    actual: ar?.additionalInsured    ? 'Included' : 'Missing', ok: ar?.additionalInsured    ?? false })
    rows.push({ type: 'Waiver of Subrogation', actual: ar?.waiverOfSubrogation  ? 'Included' : 'Missing', ok: ar?.waiverOfSubrogation  ?? false })
  }

  const flags      = ar?.flags ?? []
  const missingCt  = rows.filter(r => !r.ok).length
  const metCt      = rows.length - missingCt

  let summaryText = 'No COI has been uploaded yet. Upload a COI to see the compliance summary for this vendor.'
  if (latestSub) {
    if (missingCt === 0) {
      summaryText = `${ar?.insuredName || 'This vendor'} is fully compliant. All coverage requirements are in place.`
    } else {
      const failedNames = rows.filter(r => !r.ok).map(r => r.type)
      const preview     = failedNames.slice(0, 2).join(', ')
      const more        = failedNames.length > 2 ? ` (and ${failedNames.length - 2} more)` : ''
      summaryText = `${ar?.insuredName || 'This vendor'} has ${missingCt} unmet requirement${missingCt !== 1 ? 's' : ''}. ${preview}${more}.`
    }
  }

  if (!latestSub) {
    return (
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 40, textAlign: 'center' }}>
        <FileText size={36} color={T.muted} style={{ marginBottom: 16 }} />
        <h3 style={{ fontSize: 16, fontWeight: 700, color: T.primary, margin: '0 0 10px' }}>No COI uploaded yet</h3>
        <p style={{ fontSize: 14, color: T.secondary, margin: '0 0 0', lineHeight: 1.6 }}>
          Upload a Certificate of Insurance to see compliance details for this vendor.
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>

        {/* Coverage table */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24, transition: 'border-color 0.2s' }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = T.borderAccent)}
          onMouseLeave={e => (e.currentTarget.style.borderColor = T.border)}
        >
          <h3 style={{ fontSize: 14, fontWeight: 700, color: T.primary, margin: '0 0 18px' }}>Insurance Summary</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '38%' }} />
              <col />
              <col style={{ width: '116px' }} />
            </colgroup>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '0 10px 10px', fontSize: 10, color: T.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: `1px solid ${T.border}` }}>Coverage Type</th>
                <th style={{ textAlign: 'left', padding: '0 10px 10px', fontSize: 10, color: T.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: `1px solid ${T.border}` }}>Actual</th>
                <th style={{ textAlign: 'right', padding: '0 10px 10px', fontSize: 10, color: T.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: `1px solid ${T.border}` }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} style={{ transition: 'background 0.12s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#1a1a2e')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '12px 10px', fontSize: 13, fontWeight: 600, color: T.primary, borderBottom: i < rows.length - 1 ? `1px solid ${T.border}` : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.type}</td>
                  <td style={{ padding: '12px 10px', fontSize: 12, color: row.ok ? T.secondary : T.red, fontWeight: row.ok ? 400 : 600, borderBottom: i < rows.length - 1 ? `1px solid ${T.border}` : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.actual}</td>
                  <td style={{ padding: '12px 10px', borderBottom: i < rows.length - 1 ? `1px solid ${T.border}` : 'none', textAlign: 'right' }}><CoverageBadge ok={row.ok} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Plain-English summary */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', transition: 'border-color 0.2s' }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = T.borderAccent)}
          onMouseLeave={e => (e.currentTarget.style.borderColor = T.border)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 16 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, flexShrink: 0, background: 'rgba(217,119,6,0.10)', border: '1px solid rgba(217,119,6,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={13} color={T.orange} />
            </div>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.primary, margin: 0 }}>Plain-English Summary</h3>
          </div>
          <p style={{ fontSize: 14, color: T.secondary, lineHeight: 1.8, flex: 1, margin: 0 }}>{summaryText}</p>
          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle2 size={13} color={T.green} />
              <span style={{ fontSize: 12, color: T.secondary }}>{metCt} of {rows.length} requirements met</span>
            </div>
            {missingCt > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <XCircle size={13} color={T.red} />
                <span style={{ fontSize: 12, color: T.secondary }}>{missingCt} item{missingCt !== 1 ? 's' : ''} missing or non-compliant</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Required */}
      {flags.length > 0 && (
        <div style={{ background: 'rgba(217,119,6,0.05)', border: '1px solid rgba(217,119,6,0.20)', borderRadius: 12, padding: '20px 24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <AlertTriangle size={18} color={T.orange} style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: T.orange, margin: '0 0 5px' }}>Action Required</p>
              <p style={{ fontSize: 13, color: T.secondary, lineHeight: 1.65, margin: 0 }}>
                {flags[0]}{flags.length > 1 ? ` and ${flags.length - 1} other issue${flags.length > 2 ? 's' : ''}.` : '.'}
              </p>
            </div>
          </div>
          <button
            onClick={() => showToast('Request sent to vendor')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, flexShrink: 0, background: T.orange, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 12px rgba(217,119,6,0.28)', transition: 'background 0.15s, transform 0.1s' }}
            onMouseEnter={e => { e.currentTarget.style.background = T.orangeHover; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.background = T.orange; e.currentTarget.style.transform = 'translateY(0)' }}
          >
            Send Request to Vendor →
          </button>
        </div>
      )}
    </div>
  )
}

// ── Documents Tab ─────────────────────────────────────────────────────────────

function DocumentsTab({ vendor, submissions, showToast, onUploadClick }: { vendor: Vendor; submissions: Submission[]; showToast: (m: string) => void; onUploadClick: () => void }) {
  const [dragOver, setDragOver] = useState(false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div
        onClick={onUploadClick}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); onUploadClick() }}
      >
        <div style={{ border: `2px dashed ${dragOver ? T.orange : 'rgba(217,119,6,0.30)'}`, borderRadius: 12, padding: '36px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, background: dragOver ? 'rgba(217,119,6,0.07)' : 'rgba(217,119,6,0.025)', cursor: 'pointer', transition: 'all 0.2s' }}>
          <div style={{ width: 46, height: 46, borderRadius: 11, background: 'rgba(217,119,6,0.12)', border: '1px solid rgba(217,119,6,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Upload size={20} color={T.orange} />
          </div>
          <p style={{ fontSize: 14, fontWeight: 600, color: T.primary, margin: 0 }}>Drop new COI here or click to browse</p>
          <p style={{ fontSize: 12, color: T.secondary, margin: 0 }}>PDF — up to 20MB</p>
        </div>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.border}` }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: T.primary, margin: 0 }}>Uploaded Documents</h3>
        </div>
        {submissions.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <FileText size={32} color={T.muted} style={{ marginBottom: 12 }} />
            <p style={{ fontSize: 14, color: T.secondary, margin: 0 }}>No documents uploaded yet.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Document', 'Uploaded', 'Policy Period', 'Status', 'Actions'].map(col => (
                    <th key={col} style={{ textAlign: 'left', padding: '12px 16px', fontSize: 10, color: T.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {submissions.map((sub, i) => {
                  const ar  = sub.analysis_result
                  const d   = sub.created_at ? new Date(sub.created_at) : null
                  const slug = vendor.name.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_').replace(/_$/, '')
                  const ds   = d ? `${String(d.getMonth() + 1).padStart(2, '0')}${d.getFullYear()}` : 'unknown'
                  const period = ar?.effectiveDate && ar?.expirationDate
                    ? `${ar.effectiveDate} – ${ar.expirationDate}`
                    : ar?.expirationDate || 'Pending'
                  const stMap: Record<string, { c: string; bg: string; b: string }> = {
                    'Compliant':     { c: T.green,  bg: 'rgba(34,197,94,0.09)',    b: 'rgba(34,197,94,0.22)'   },
                    'Issues Found':  { c: T.orange, bg: 'rgba(217,119,6,0.09)',   b: 'rgba(217,119,6,0.22)'   },
                    'Expiring Soon': { c: T.amber,  bg: 'rgba(251,191,36,0.09)',  b: 'rgba(251,191,36,0.22)'  },
                  }
                  const st = stMap[sub.status ?? ''] ?? { c: T.blue, bg: 'rgba(139,140,248,0.09)', b: 'rgba(139,140,248,0.22)' }

                  return (
                    <tr key={sub.id} style={{ transition: 'background 0.12s', borderBottom: i < submissions.length - 1 ? `1px solid ${T.border}` : 'none' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#1a1a2e')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 7, flexShrink: 0, background: 'rgba(217,119,6,0.09)', border: '1px solid rgba(217,119,6,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FileText size={14} color={T.orange} />
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 600, color: T.primary }}>COI_{slug}_{ds}.pdf</span>
                        </div>
                      </td>
                      <td style={{ padding: '16px', fontSize: 12, color: T.secondary, whiteSpace: 'nowrap' }}>{fmtDate(sub.created_at)}</td>
                      <td style={{ padding: '16px', fontSize: 12, color: T.secondary, whiteSpace: 'nowrap' }}>{period}</td>
                      <td style={{ padding: '16px' }}>
                        <span style={{ background: st.bg, color: st.c, border: `1px solid ${st.b}`, borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>
                          {sub.status || 'Pending Review'}
                        </span>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <button
                          onClick={() => showToast('Document preview coming soon')}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(217,119,6,0.08)', color: T.orange, border: '1px solid rgba(217,119,6,0.20)', borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'background 0.15s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(217,119,6,0.16)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(217,119,6,0.08)')}
                        >
                          <Eye size={12} /> View
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ── History Tab ───────────────────────────────────────────────────────────────

function HistoryTab({ submissions }: { submissions: Submission[] }) {
  if (submissions.length === 0) {
    return (
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 40, textAlign: 'center' }}>
        <Clock size={32} color={T.muted} style={{ marginBottom: 12 }} />
        <p style={{ fontSize: 14, color: T.secondary, margin: 0 }}>No submission history yet.</p>
      </div>
    )
  }

  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 28 }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: T.primary, margin: '0 0 28px' }}>Submission History</h3>
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', left: 11, top: 14, bottom: 14, width: 1, background: T.border }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {submissions.map((sub, i) => {
            const ok     = sub.status === 'Compliant'
            const issues = sub.issues_count ?? (sub.analysis_result?.flags?.length ?? 0)
            const detail = issues > 0 ? `${issues} issue${issues !== 1 ? 's' : ''} detected` : 'All requirements met'
            return (
              <div key={sub.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 18, paddingBottom: i < submissions.length - 1 ? 24 : 0 }}>
                <div style={{ width: 23, height: 23, borderRadius: '50%', flexShrink: 0, zIndex: 1, background: ok ? 'rgba(34,197,94,0.12)' : 'rgba(217,119,6,0.12)', border: `2px solid ${ok ? T.green : T.orange}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {ok ? <Check size={11} color={T.green} strokeWidth={2.5} /> : <AlertTriangle size={10} color={T.orange} />}
                </div>
                <div style={{ flex: 1, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, transition: 'border-color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = T.borderAccent)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = T.border)}
                >
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: T.primary, margin: '0 0 4px' }}>COI uploaded</p>
                    <p style={{ fontSize: 12, color: T.secondary, margin: 0 }}>{detail}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
                    <span style={{ background: ok ? 'rgba(34,197,94,0.09)' : 'rgba(217,119,6,0.09)', color: ok ? T.green : T.orange, border: `1px solid ${ok ? 'rgba(34,197,94,0.22)' : 'rgba(217,119,6,0.22)'}`, borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>
                      {sub.status || 'Pending Review'}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Clock size={12} color={T.muted} />
                      <span style={{ fontSize: 12, color: T.muted }}>{fmtDate(sub.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Notes Tab ─────────────────────────────────────────────────────────────────

function NotesTab() {
  const [noteText,     setNoteText]     = useState('')
  const [saveFeedback, setSaveFeedback] = useState(false)
  const [notes,        setNotes]        = useState<Array<{ text: string; timestamp: string }>>([])

  function handleSave() {
    if (!noteText.trim()) return
    const ts = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    setNotes(prev => [{ text: noteText.trim(), timestamp: ts }, ...prev])
    setNoteText('')
    setSaveFeedback(true)
    setTimeout(() => setSaveFeedback(false), 2500)
  }

  const canSave = noteText.trim().length > 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: T.primary, margin: '0 0 6px' }}>Add Note</h3>
        <p style={{ fontSize: 12, color: T.muted, margin: '0 0 16px' }}>Internal notes — not visible to the vendor.</p>
        <textarea
          value={noteText}
          onChange={e => setNoteText(e.target.value)}
          placeholder="Add notes about this vendor..."
          rows={4}
          style={{ width: '100%', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '12px 14px', fontSize: 14, color: T.primary, outline: 'none', resize: 'vertical', fontFamily: 'Inter, -apple-system, sans-serif', lineHeight: 1.65, transition: 'border-color 0.15s', boxSizing: 'border-box' }}
          onFocus={e => (e.target.style.borderColor = T.orange)}
          onBlur={e => (e.target.style.borderColor = T.border)}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
          <button
            onClick={handleSave}
            disabled={!canSave}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: canSave ? T.orange : 'rgba(217,119,6,0.25)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: canSave ? 'pointer' : 'not-allowed', transition: 'background 0.15s, transform 0.1s' }}
            onMouseEnter={e => { if (canSave) { e.currentTarget.style.background = T.orangeHover; e.currentTarget.style.transform = 'translateY(-1px)' } }}
            onMouseLeave={e => { if (canSave) { e.currentTarget.style.background = T.orange; e.currentTarget.style.transform = 'translateY(0)' } }}
          >
            <MessageSquare size={14} /> Save Note
          </button>
          {saveFeedback && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={14} color={T.green} />
              <span style={{ fontSize: 13, color: T.green, fontWeight: 500 }}>Saved</span>
            </div>
          )}
        </div>
      </div>
      {notes.map((note, i) => (
        <div key={i} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 18px', transition: 'border-color 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = T.borderAccent)}
          onMouseLeave={e => (e.currentTarget.style.borderColor = T.border)}
        >
          <p style={{ fontSize: 14, color: T.secondary, lineHeight: 1.75, margin: '0 0 10px' }}>{note.text}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Clock size={11} color={T.muted} />
            <span style={{ fontSize: 11, color: T.muted }}>{note.timestamp}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function VendorProfile() {
  const params          = useParams()
  const id              = params.id as string
  const { user, isLoaded } = useUser()

  const [vendor,        setVendor]        = useState<Vendor | null>(null)
  const [submissions,   setSubmissions]   = useState<Submission[]>([])
  const [loading,       setLoading]       = useState(true)
  const [notFound,      setNotFound]      = useState(false)
  const [activeTab,     setActiveTab]     = useState<Tab>('overview')
  const [toastMsg,      setToastMsg]      = useState('')
  const [toastVisible,  setToastVisible]  = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [refreshKey,    setRefreshKey]    = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const loadData = useCallback(async () => {
    if (!user) return
    const [vRes, sRes] = await Promise.all([
      supabase
        .from('vendors')
        .select('id, name, type, status, expiration_date, created_at')
        .eq('id', id)
        .eq('clerk_user_id', user.id)
        .single(),
      supabase
        .from('submissions')
        .select('id, status, issues_count, risk_score, analysis_result, created_at')
        .eq('vendor_id', id)
        .eq('clerk_user_id', user.id)
        .order('created_at', { ascending: false }),
    ])
    if (vRes.error || !vRes.data) {
      setNotFound(true)
    } else {
      setVendor(vRes.data as Vendor)
      setSubmissions((sRes.data ?? []) as Submission[])
    }
    setLoading(false)
  }, [id, user])

  useEffect(() => {
    if (!isLoaded) return
    if (!user) { setLoading(false); return }
    loadData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user, loadData, refreshKey])

  function showToast(msg: string) {
    if (timerRef.current) clearTimeout(timerRef.current)
    setToastMsg(msg)
    setToastVisible(true)
    timerRef.current = setTimeout(() => setToastVisible(false), 3000)
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: 'overview',  label: 'Overview'  },
    { key: 'documents', label: 'Documents' },
    { key: 'history',   label: 'History'   },
    { key: 'notes',     label: 'Notes'     },
  ]

  const shell = (children: React.ReactNode) => (
    <div style={{ display: 'flex', minHeight: '100vh', background: T.bg, fontFamily: 'Inter, -apple-system, sans-serif', color: T.primary }}>
      <Sidebar />
      <main style={{ marginLeft: 240, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </main>
    </div>
  )

  if (!isLoaded || loading) return shell(<div style={{ color: T.secondary, fontSize: 14 }}>Loading vendor…</div>)

  if (notFound || !vendor) return shell(
    <div style={{ textAlign: 'center' }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: T.primary, marginBottom: 12 }}>Vendor not found</h2>
      <p style={{ fontSize: 14, color: T.secondary, marginBottom: 24 }}>This vendor doesn&apos;t exist or you don&apos;t have access.</p>
      <Link href="/vendors" style={{ background: T.orange, color: '#fff', padding: '10px 24px', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
        Back to Vendors
      </Link>
    </div>
  )

  const statusInfo = vendorStatusInfo(vendor.status)
  const latestSub  = submissions[0] ?? null

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: T.bg, fontFamily: 'Inter, -apple-system, sans-serif', color: T.primary }}>
      <Toast message={toastMsg} visible={toastVisible} />
      <Sidebar />

      {showUploadModal && (
        <COIUploadModal
          vendorId={vendor.id}
          vendorName={vendor.name}
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => setRefreshKey(k => k + 1)}
        />
      )}

      <main style={{ marginLeft: 240, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

        <header style={{ position: 'sticky', top: 0, zIndex: 40, background: T.bg, borderBottom: `1px solid ${T.border}`, height: 64, padding: '0 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 700, color: T.primary, margin: 0, lineHeight: 1.2 }}>Vendor Profile</h1>
            <p style={{ fontSize: 12, color: T.secondary, margin: 0 }}>{vendor.name}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button style={{ position: 'relative', background: 'none', border: `1px solid ${T.border}`, borderRadius: 8, width: 38, height: 38, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.secondary, transition: 'border-color 0.15s, color 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.orange; e.currentTarget.style.color = T.primary }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.secondary }}
            >
              <Bell size={17} />
            </button>
            <UserButton />
          </div>
        </header>

        <div style={{ padding: 28, flex: 1 }}>

          <Link href="/vendors" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13, color: T.secondary, textDecoration: 'none', fontWeight: 500, marginBottom: 22, transition: 'color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.color = T.primary)}
            onMouseLeave={e => (e.currentTarget.style.color = T.secondary)}
          >
            <ArrowLeft size={15} /> Back to Vendors
          </Link>

          {/* Vendor hero block */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, marginBottom: 26 }}>
            <div>
              <h2 style={{ fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 800, color: T.primary, margin: '0 0 12px', letterSpacing: '-0.8px' }}>
                {vendor.name}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                {vendor.type && (
                  <span style={{ background: 'rgba(255,255,255,0.05)', color: T.secondary, border: `1px solid ${T.border}`, borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 500 }}>
                    {vendor.type}
                  </span>
                )}
                <span style={{ background: statusInfo.bg, color: statusInfo.color, border: `1px solid ${statusInfo.border}`, borderRadius: 6, padding: '4px 12px', fontSize: 12, fontWeight: 600 }}>
                  {statusInfo.label}
                </span>
                {vendor.expiration_date && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Clock size={13} color={T.muted} />
                    <span style={{ fontSize: 12, color: T.muted }}>Exp: {fmtDate(vendor.expiration_date)}</span>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => setShowUploadModal(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, flexShrink: 0, background: T.orange, color: '#fff', border: 'none', borderRadius: 9, padding: '11px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 14px rgba(217,119,6,0.28)', transition: 'background 0.15s, transform 0.1s' }}
              onMouseEnter={e => { e.currentTarget.style.background = T.orangeHover; e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { e.currentTarget.style.background = T.orange; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <Upload size={14} /> Upload New COI
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${T.border}`, marginBottom: 22 }}>
            {TABS.map(tab => {
              const active = activeTab === tab.key
              return (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '11px 20px', fontSize: 14, fontWeight: active ? 600 : 500, color: active ? T.primary : T.secondary, borderBottom: `2px solid ${active ? T.orange : 'transparent'}`, marginBottom: -1, transition: 'color 0.15s, border-color 0.15s' }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.color = T.primary }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.color = T.secondary }}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>

          {activeTab === 'overview'  && <OverviewTab  latestSub={latestSub} showToast={showToast} />}
          {activeTab === 'documents' && <DocumentsTab vendor={vendor} submissions={submissions} showToast={showToast} onUploadClick={() => setShowUploadModal(true)} />}
          {activeTab === 'history'   && <HistoryTab   submissions={submissions} />}
          {activeTab === 'notes'     && <NotesTab />}
        </div>
      </main>
    </div>
  )
}
