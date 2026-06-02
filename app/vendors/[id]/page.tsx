'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  Bell, User, ChevronDown, ArrowLeft, Upload, FileText,
  Check, X, AlertTriangle, Download, Eye, Clock,
  CheckCircle2, XCircle, MessageSquare, Shield,
} from 'lucide-react'
import Sidebar from '../../components/Sidebar'

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

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'documents' | 'history' | 'notes'

// ── Static data ───────────────────────────────────────────────────────────────

const COVERAGE = [
  { type: 'General Liability',     required: '$1,000,000', actual: '$1,000,000', status: 'compliant' as const },
  { type: 'Auto Liability',        required: '$1,000,000', actual: '$1,000,000', status: 'compliant' as const },
  { type: 'Workers Comp',          required: 'Required',   actual: 'Included',   status: 'compliant' as const },
  { type: 'Additional Insured',    required: 'Required',   actual: 'Missing',    status: 'missing'   as const },
  { type: 'Waiver of Subrogation', required: 'Required',   actual: 'Missing',    status: 'missing'   as const },
]

const HISTORY_ITEMS = [
  { date: 'May 20, 2025', label: 'COI uploaded', status: 'issues'    as const, detail: '2 issues detected' },
  { date: 'Jan 15, 2025', label: 'COI uploaded', status: 'compliant' as const, detail: 'All requirements met' },
  { date: 'Aug 03, 2024', label: 'COI uploaded', status: 'compliant' as const, detail: 'All requirements met' },
]

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div style={{
      position: 'fixed', top: 24, right: 24, zIndex: 300,
      background: T.card,
      border: `1px solid rgba(34,197,94,0.30)`,
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

// ── Coverage badge ────────────────────────────────────────────────────────────

function CoverageBadge({ status }: { status: 'compliant' | 'missing' }) {
  if (status === 'compliant') {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        background: 'rgba(34,197,94,0.09)', color: T.green,
        border: '1px solid rgba(34,197,94,0.22)',
        borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
      }}>
        <Check size={10} strokeWidth={2.5} /> Compliant
      </span>
    )
  }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: 'rgba(239,68,68,0.09)', color: T.red,
      border: '1px solid rgba(239,68,68,0.22)',
      borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
    }}>
      <X size={10} strokeWidth={2.5} /> Missing
    </span>
  )
}

// ── Overview Tab ──────────────────────────────────────────────────────────────

function OverviewTab({ showToast }: { showToast: (msg: string) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Two-column */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>

        {/* Insurance Summary */}
        <div style={{
          background: T.card, border: `1px solid ${T.border}`,
          borderRadius: 12, padding: 24,
          transition: 'border-color 0.2s',
        }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = T.borderAccent)}
          onMouseLeave={e => (e.currentTarget.style.borderColor = T.border)}
        >
          <h3 style={{ fontSize: 14, fontWeight: 700, color: T.primary, margin: '0 0 18px' }}>
            Insurance Summary
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Coverage Type', 'Required', 'Actual', 'Status'].map(col => (
                    <th key={col} style={{
                      textAlign: 'left', padding: '0 10px 10px',
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
                {COVERAGE.map((row, i) => (
                  <tr
                    key={i}
                    style={{ transition: 'background 0.12s', cursor: 'default' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#1a1a2e')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{
                      padding: '12px 10px', fontSize: 13, fontWeight: 600, color: T.primary,
                      borderBottom: i < COVERAGE.length - 1 ? `1px solid ${T.border}` : 'none',
                      whiteSpace: 'nowrap',
                    }}>
                      {row.type}
                    </td>
                    <td style={{
                      padding: '12px 10px', fontSize: 12, color: T.secondary,
                      borderBottom: i < COVERAGE.length - 1 ? `1px solid ${T.border}` : 'none',
                      whiteSpace: 'nowrap',
                    }}>
                      {row.required}
                    </td>
                    <td style={{
                      padding: '12px 10px', fontSize: 12,
                      color: row.status === 'missing' ? T.red : T.secondary,
                      fontWeight: row.status === 'missing' ? 600 : 400,
                      borderBottom: i < COVERAGE.length - 1 ? `1px solid ${T.border}` : 'none',
                      whiteSpace: 'nowrap',
                    }}>
                      {row.actual}
                    </td>
                    <td style={{
                      padding: '12px 10px',
                      borderBottom: i < COVERAGE.length - 1 ? `1px solid ${T.border}` : 'none',
                    }}>
                      <CoverageBadge status={row.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Plain-English Summary */}
        <div style={{
          background: T.card, border: `1px solid ${T.border}`,
          borderRadius: 12, padding: 24,
          display: 'flex', flexDirection: 'column',
          transition: 'border-color 0.2s',
        }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = T.borderAccent)}
          onMouseLeave={e => (e.currentTarget.style.borderColor = T.border)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 16 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 7, flexShrink: 0,
              background: 'rgba(217,119,6,0.10)', border: '1px solid rgba(217,119,6,0.20)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Shield size={13} color={T.orange} />
            </div>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.primary, margin: 0 }}>
              Plain-English Summary
            </h3>
          </div>

          <p style={{ fontSize: 14, color: T.secondary, lineHeight: 1.8, flex: 1, margin: 0 }}>
            ABC Plumbing meets the required general liability and auto liability limits. However, the
            certificate does not show your company as an additional insured and does not include a
            waiver of subrogation endorsement. You should request an updated COI with the required
            endorsements before allowing this vendor to perform work.
          </p>

          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle2 size={13} color={T.green} />
              <span style={{ fontSize: 12, color: T.secondary }}>3 of 5 requirements met</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <XCircle size={13} color={T.red} />
              <span style={{ fontSize: 12, color: T.secondary }}>2 critical endorsements missing</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Required */}
      <div style={{
        background: 'rgba(217,119,6,0.05)',
        border: `1px solid rgba(217,119,6,0.20)`,
        borderRadius: 12, padding: '20px 24px',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <AlertTriangle size={18} color={T.orange} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: T.orange, margin: '0 0 5px' }}>
              Action Required
            </p>
            <p style={{ fontSize: 13, color: T.secondary, lineHeight: 1.65, margin: 0 }}>
              Request updated COI from vendor with Additional Insured endorsement and Waiver of Subrogation.
            </p>
          </div>
        </div>
        <button
          onClick={() => showToast('Request sent to vendor')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 7, flexShrink: 0,
            background: T.orange, color: '#fff', border: 'none',
            borderRadius: 8, padding: '10px 18px',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
            boxShadow: '0 2px 12px rgba(217,119,6,0.28)',
            transition: 'background 0.15s, transform 0.1s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = T.orangeHover; e.currentTarget.style.transform = 'translateY(-1px)' }}
          onMouseLeave={e => { e.currentTarget.style.background = T.orange; e.currentTarget.style.transform = 'translateY(0)' }}
        >
          Send Request to Vendor →
        </button>
      </div>
    </div>
  )
}

// ── Documents Tab ─────────────────────────────────────────────────────────────

function DocumentsTab({ showToast }: { showToast: (msg: string) => void }) {
  const [dragOver, setDragOver] = useState(false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Upload zone */}
      <Link
        href="/upload"
        style={{ textDecoration: 'none' }}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false) }}
      >
        <div style={{
          border: `2px dashed ${dragOver ? T.orange : 'rgba(217,119,6,0.30)'}`,
          borderRadius: 12, padding: '36px 24px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10,
          background: dragOver ? 'rgba(217,119,6,0.07)' : 'rgba(217,119,6,0.025)',
          cursor: 'pointer', transition: 'all 0.2s',
        }}>
          <div style={{
            width: 46, height: 46, borderRadius: 11,
            background: 'rgba(217,119,6,0.12)', border: '1px solid rgba(217,119,6,0.22)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Upload size={20} color={T.orange} />
          </div>
          <p style={{ fontSize: 14, fontWeight: 600, color: T.primary, margin: 0 }}>
            Drop new COI here or click to browse
          </p>
          <p style={{ fontSize: 12, color: T.secondary, margin: 0 }}>PDF, JPG, PNG — up to 20MB</p>
        </div>
      </Link>

      {/* Documents table */}
      <div style={{
        background: T.card, border: `1px solid ${T.border}`,
        borderRadius: 12, overflow: 'hidden',
      }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.border}` }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: T.primary, margin: 0 }}>
            Uploaded Documents
          </h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Document', 'Uploaded', 'Policy Period', 'Status', 'Actions'].map(col => (
                  <th key={col} style={{
                    textAlign: 'left', padding: '12px 16px',
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
              <tr
                style={{ transition: 'background 0.12s' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#1a1a2e')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <td style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 7, flexShrink: 0,
                      background: 'rgba(239,68,68,0.09)', border: '1px solid rgba(239,68,68,0.20)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <FileText size={14} color="#ef4444" />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: T.primary }}>
                      COI_ABC_Plumbing_052025.pdf
                    </span>
                  </div>
                </td>
                <td style={{ padding: '16px', fontSize: 12, color: T.secondary, whiteSpace: 'nowrap' }}>
                  May 20, 2025
                </td>
                <td style={{ padding: '16px', fontSize: 12, color: T.secondary, whiteSpace: 'nowrap' }}>
                  May 22, 2025 – May 22, 2026
                </td>
                <td style={{ padding: '16px' }}>
                  <span style={{
                    background: 'rgba(34,197,94,0.09)', color: T.green,
                    border: '1px solid rgba(34,197,94,0.22)',
                    borderRadius: 6, padding: '3px 10px',
                    fontSize: 11, fontWeight: 600,
                  }}>
                    Active
                  </span>
                </td>
                <td style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => showToast('Downloading COI_ABC_Plumbing_052025.pdf…')}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        background: 'rgba(255,255,255,0.04)', color: T.secondary,
                        border: `1px solid ${T.border}`, borderRadius: 6,
                        padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = T.primary; e.currentTarget.style.borderColor = T.borderAccent }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = T.secondary; e.currentTarget.style.borderColor = T.border }}
                    >
                      <Download size={12} /> Download
                    </button>
                    <button
                      onClick={() => showToast('Opening document preview…')}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        background: 'rgba(217,119,6,0.08)', color: T.orange,
                        border: '1px solid rgba(217,119,6,0.20)', borderRadius: 6,
                        padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(217,119,6,0.16)'; e.currentTarget.style.borderColor = 'rgba(217,119,6,0.30)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(217,119,6,0.08)'; e.currentTarget.style.borderColor = 'rgba(217,119,6,0.20)' }}
                    >
                      <Eye size={12} /> View
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ── History Tab ───────────────────────────────────────────────────────────────

function HistoryTab() {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 28 }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: T.primary, margin: '0 0 28px' }}>
        Submission History
      </h3>
      <div style={{ position: 'relative' }}>
        {/* Vertical connector */}
        <div style={{
          position: 'absolute', left: 11, top: 14, bottom: 14,
          width: 1, background: T.border,
        }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {HISTORY_ITEMS.map((item, i) => (
            <div
              key={i}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 18,
                paddingBottom: i < HISTORY_ITEMS.length - 1 ? 24 : 0,
              }}
            >
              {/* Dot */}
              <div style={{
                width: 23, height: 23, borderRadius: '50%', flexShrink: 0, zIndex: 1,
                background: item.status === 'compliant'
                  ? 'rgba(34,197,94,0.12)'
                  : 'rgba(217,119,6,0.12)',
                border: `2px solid ${item.status === 'compliant' ? T.green : T.orange}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {item.status === 'compliant'
                  ? <Check size={11} color={T.green} strokeWidth={2.5} />
                  : <AlertTriangle size={10} color={T.orange} />
                }
              </div>

              {/* Card */}
              <div style={{
                flex: 1, background: T.surface, border: `1px solid ${T.border}`,
                borderRadius: 10, padding: '14px 18px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
                transition: 'border-color 0.15s',
              }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = T.borderAccent)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = T.border)}
              >
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: T.primary, margin: '0 0 4px' }}>
                    {item.label}
                  </p>
                  <p style={{ fontSize: 12, color: T.secondary, margin: 0 }}>
                    {item.detail}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
                  {item.status === 'compliant' ? (
                    <span style={{
                      background: 'rgba(34,197,94,0.09)', color: T.green,
                      border: '1px solid rgba(34,197,94,0.22)',
                      borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 600,
                    }}>
                      Compliant
                    </span>
                  ) : (
                    <span style={{
                      background: 'rgba(217,119,6,0.09)', color: T.orange,
                      border: '1px solid rgba(217,119,6,0.22)',
                      borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 600,
                    }}>
                      Issues Found
                    </span>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Clock size={12} color={T.muted} />
                    <span style={{ fontSize: 12, color: T.muted }}>{item.date}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Notes Tab ─────────────────────────────────────────────────────────────────

function NotesTab() {
  const [noteText, setNoteText] = useState('')
  const [saveFeedback, setSaveFeedback] = useState(false)
  const [notes, setNotes] = useState([
    {
      text: 'Vendor contacted on May 21 regarding missing endorsements. Follow up needed.',
      timestamp: 'May 21, 2025',
    },
  ])

  function handleSave() {
    if (!noteText.trim()) return
    const now = new Date()
    const ts = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    setNotes(prev => [{ text: noteText.trim(), timestamp: ts }, ...prev])
    setNoteText('')
    setSaveFeedback(true)
    setTimeout(() => setSaveFeedback(false), 2500)
  }

  const canSave = noteText.trim().length > 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Input card */}
      <div style={{
        background: T.card, border: `1px solid ${T.border}`,
        borderRadius: 12, padding: 24,
      }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: T.primary, margin: '0 0 6px' }}>
          Add Note
        </h3>
        <p style={{ fontSize: 12, color: T.muted, margin: '0 0 16px' }}>
          Internal notes — not visible to the vendor.
        </p>
        <textarea
          value={noteText}
          onChange={e => setNoteText(e.target.value)}
          placeholder="Add notes about this vendor..."
          rows={4}
          style={{
            width: '100%', background: T.surface, border: `1px solid ${T.border}`,
            borderRadius: 8, padding: '12px 14px', fontSize: 14, color: T.primary,
            outline: 'none', resize: 'vertical',
            fontFamily: 'Inter, -apple-system, sans-serif',
            lineHeight: 1.65, transition: 'border-color 0.15s',
            boxSizing: 'border-box',
          }}
          onFocus={e => (e.target.style.borderColor = T.orange)}
          onBlur={e => (e.target.style.borderColor = T.border)}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
          <button
            onClick={handleSave}
            disabled={!canSave}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              background: canSave ? T.orange : 'rgba(217,119,6,0.25)',
              color: '#fff', border: 'none', borderRadius: 8,
              padding: '10px 20px', fontSize: 13, fontWeight: 600,
              cursor: canSave ? 'pointer' : 'not-allowed',
              transition: 'background 0.15s, transform 0.1s',
            }}
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

      {/* Notes list */}
      {notes.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {notes.map((note, i) => (
            <div
              key={i}
              style={{
                background: T.card, border: `1px solid ${T.border}`,
                borderRadius: 10, padding: '16px 18px',
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = T.borderAccent)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = T.border)}
            >
              <p style={{ fontSize: 14, color: T.secondary, lineHeight: 1.75, margin: '0 0 10px' }}>
                {note.text}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Clock size={11} color={T.muted} />
                <span style={{ fontSize: 11, color: T.muted }}>{note.timestamp}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function VendorProfile() {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [toastMsg, setToastMsg] = useState('')
  const [toastVisible, setToastVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function showToast(msg: string) {
    if (timerRef.current) clearTimeout(timerRef.current)
    setToastMsg(msg)
    setToastVisible(true)
    timerRef.current = setTimeout(() => setToastVisible(false), 3000)
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const TABS: { key: Tab; label: string }[] = [
    { key: 'overview',  label: 'Overview'  },
    { key: 'documents', label: 'Documents' },
    { key: 'history',   label: 'History'   },
    { key: 'notes',     label: 'Notes'     },
  ]

  return (
    <div style={{
      display: 'flex', minHeight: '100vh',
      background: T.bg, fontFamily: 'Inter, -apple-system, sans-serif',
      color: T.primary,
    }}>
      <Toast message={toastMsg} visible={toastVisible} />
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
              Vendor Profile
            </h1>
            <p style={{ fontSize: 12, color: T.secondary, margin: 0 }}>ABC Plumbing LLC</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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

            <button style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'none', border: `1px solid ${T.border}`,
              borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
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
        <div style={{ padding: 28, flex: 1 }}>

          {/* Back link */}
          <Link href="/vendors" style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            fontSize: 13, color: T.secondary, textDecoration: 'none', fontWeight: 500,
            marginBottom: 22, transition: 'color 0.15s',
          }}
            onMouseEnter={e => (e.currentTarget.style.color = T.primary)}
            onMouseLeave={e => (e.currentTarget.style.color = T.secondary)}
          >
            <ArrowLeft size={15} /> Back to Vendors
          </Link>

          {/* Vendor header block */}
          <div style={{
            display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
            gap: 20, marginBottom: 26,
          }}>
            <div>
              <h2 style={{
                fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 800,
                color: T.primary, margin: '0 0 12px', letterSpacing: '-0.8px',
              }}>
                ABC Plumbing LLC
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{
                  background: 'rgba(255,255,255,0.05)', color: T.secondary,
                  border: `1px solid ${T.border}`,
                  borderRadius: 20, padding: '4px 12px',
                  fontSize: 12, fontWeight: 500,
                }}>
                  Plumbing Contractor
                </span>
                <span style={{
                  background: 'rgba(217,119,6,0.09)', color: T.orange,
                  border: '1px solid rgba(217,119,6,0.22)',
                  borderRadius: 6, padding: '4px 12px',
                  fontSize: 12, fontWeight: 600,
                }}>
                  Issues Found
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Clock size={13} color={T.muted} />
                  <span style={{ fontSize: 12, color: T.muted }}>Exp: May 22, 2026</span>
                </div>
              </div>
            </div>

            <Link href="/upload" style={{
              display: 'inline-flex', alignItems: 'center', gap: 7, flexShrink: 0,
              background: T.orange, color: '#fff', textDecoration: 'none',
              border: 'none', borderRadius: 9, padding: '11px 20px',
              fontSize: 13, fontWeight: 600,
              boxShadow: '0 2px 14px rgba(217,119,6,0.28)',
              transition: 'background 0.15s, transform 0.1s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = T.orangeHover; e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { e.currentTarget.style.background = T.orange; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <Upload size={14} /> Upload New COI
            </Link>
          </div>

          {/* Tab bar */}
          <div style={{
            display: 'flex', gap: 0,
            borderBottom: `1px solid ${T.border}`,
            marginBottom: 22,
          }}>
            {TABS.map(tab => {
              const active = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: '11px 20px',
                    fontSize: 14, fontWeight: active ? 600 : 500,
                    color: active ? T.primary : T.secondary,
                    borderBottom: `2px solid ${active ? T.orange : 'transparent'}`,
                    marginBottom: -1,
                    transition: 'color 0.15s, border-color 0.15s',
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.color = T.primary }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.color = T.secondary }}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Tab content */}
          {activeTab === 'overview'  && <OverviewTab  showToast={showToast} />}
          {activeTab === 'documents' && <DocumentsTab showToast={showToast} />}
          {activeTab === 'history'   && <HistoryTab />}
          {activeTab === 'notes'     && <NotesTab />}
        </div>
      </main>
    </div>
  )
}
