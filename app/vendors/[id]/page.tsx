'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Bell, User, ChevronDown, Download,
  Upload, Check, X, FileText, Clock,
} from 'lucide-react'
import Sidebar from '../../components/Sidebar'

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'documents' | 'history' | 'notes'

// ─── Insurance Summary rows ───────────────────────────────────────────────────

const INSURANCE_ROWS = [
  { coverage: 'General Liability', required: '$1,000,000', actual: '$1,000,000', status: 'Compliant' as const },
  { coverage: 'Auto Liability',    required: '$1,000,000', actual: '$1,000,000', status: 'Compliant' as const },
  { coverage: 'Workers Comp',      required: 'Required',   actual: 'Included',   status: 'Compliant' as const },
  { coverage: 'Additional Insured', required: 'Required',  actual: 'Missing',    status: 'Missing' as const },
  { coverage: 'Waiver of Subrogation', required: 'Required', actual: 'Missing',  status: 'Missing' as const },
]

const HISTORY = [
  { date: 'May 20, 2025',  action: 'COI Uploaded',      status: 'Issues Found',   note: '2 compliance issues detected' },
  { date: 'Nov 12, 2024',  action: 'COI Uploaded',       status: 'Issues Found',   note: 'Additional insured missing' },
  { date: 'May 18, 2024',  action: 'COI Uploaded',       status: 'Compliant',      note: 'All requirements met' },
]

// ─── Status indicators ────────────────────────────────────────────────────────

function CoverageStatus({ status }: { status: 'Compliant' | 'Missing' }) {
  if (status === 'Compliant') {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#22c55e', fontSize: 13, fontWeight: 600 }}>
        <Check size={13} strokeWidth={2.5} /> Compliant
      </span>
    )
  }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#ef4444', fontSize: 13, fontWeight: 600 }}>
      <X size={13} strokeWidth={2.5} /> Missing
    </span>
  )
}

// ─── Documents table ──────────────────────────────────────────────────────────

function DocumentsTable() {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ borderBottom: '1px solid #1e1e2e' }}>
          {['Document', 'Uploaded', 'Policy Period', 'Status', 'Download'].map(col => (
            <th key={col} style={{
              textAlign: 'left', padding: '10px 14px',
              fontSize: 11, color: '#8a8599', fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.5px',
            }}>
              {col}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style={{ padding: '14px', fontSize: 13, color: '#f0ede8', fontWeight: 500 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={14} color="#D97706" />
              COI_ABC_Plumbing_052025.pdf
            </span>
          </td>
          <td style={{ padding: '14px', fontSize: 13, color: '#8a8599' }}>May 20, 2025</td>
          <td style={{ padding: '14px', fontSize: 13, color: '#8a8599', whiteSpace: 'nowrap' }}>May 22, 2025 – May 22, 2026</td>
          <td style={{ padding: '14px' }}>
            <span style={{
              background: '#052e16', color: '#22c55e', border: '1px solid #166534',
              borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 600,
            }}>Active</span>
          </td>
          <td style={{ padding: '14px' }}>
            <button style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: '#8a8599', padding: 6, borderRadius: 6,
              transition: 'color 0.15s', display: 'flex', alignItems: 'center',
            }}
              onMouseEnter={e => (e.currentTarget.style.color = '#D97706')}
              onMouseLeave={e => (e.currentTarget.style.color = '#8a8599')}
            >
              <Download size={16} />
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  )
}

// ─── Drop Zone ────────────────────────────────────────────────────────────────

function DropZone() {
  const [dragging, setDragging] = useState(false)

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false) }}
      onClick={() => document.getElementById('doc-input')?.click()}
      style={{
        border: `2px dashed ${dragging ? '#D97706' : 'rgba(217,119,6,0.35)'}`,
        borderRadius: 12, padding: '32px 24px',
        textAlign: 'center', cursor: 'pointer',
        background: dragging ? 'rgba(217,119,6,0.04)' : '#111118',
        transition: 'all 0.2s', marginBottom: 20,
      }}
    >
      <input id="doc-input" type="file" style={{ display: 'none' }} />
      <Upload size={28} color="#D97706" style={{ marginBottom: 12 }} />
      <div style={{ fontSize: 15, fontWeight: 600, color: '#f0ede8', marginBottom: 6 }}>Drop document here to upload</div>
      <div style={{ fontSize: 13, color: '#8a8599', marginBottom: 12 }}>or click to browse</div>
      <div style={{ fontSize: 12, color: '#8a8599' }}>PDF, JPG, PNG — Max 25MB</div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function VendorProfilePage() {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [notes, setNotes] = useState('')
  const [noteSaved, setNoteSaved] = useState(false)

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview',   label: 'Overview' },
    { key: 'documents',  label: 'Documents' },
    { key: 'history',    label: 'History' },
    { key: 'notes',      label: 'Notes' },
  ]

  function saveNote() {
    setNoteSaved(true)
    setTimeout(() => setNoteSaved(false), 2000)
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0a0f', fontFamily: 'Inter, -apple-system, sans-serif' }}>
      <Sidebar />

      <main style={{ marginLeft: 240, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Topbar */}
        <header style={{
          padding: '0 32px', height: 64,
          borderBottom: '1px solid #1e1e2e',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#0a0a0f', position: 'sticky', top: 0, zIndex: 40,
        }}>
          <Link
            href="/vendors"
            style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#8a8599', textDecoration: 'none', fontSize: 14, fontWeight: 500, transition: 'color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#f0ede8')}
            onMouseLeave={e => (e.currentTarget.style.color = '#8a8599')}
          >
            <ArrowLeft size={16} />
            Back to Vendors
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Link
              href="/upload"
              style={{
                background: '#D97706', color: '#fff', fontSize: 14, fontWeight: 600,
                padding: '8px 18px', borderRadius: 8, textDecoration: 'none',
                display: 'flex', alignItems: 'center', gap: 6, transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#b45309')}
              onMouseLeave={e => (e.currentTarget.style.background = '#D97706')}
            >
              <Upload size={15} />
              Upload New COI
            </Link>
            <button style={{ position: 'relative', background: 'transparent', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8, color: '#8a8599' }}>
              <Bell size={20} />
              <span style={{ position: 'absolute', top: 5, right: 5, width: 8, height: 8, background: '#D97706', borderRadius: '50%', border: '2px solid #0a0a0f' }} />
            </button>
            <button style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'transparent', border: '1px solid #1e1e2e', borderRadius: 8, padding: '6px 12px', cursor: 'pointer' }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(217,119,6,0.20)', border: '1px solid rgba(217,119,6,0.30)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={13} color="#D97706" />
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#f0ede8' }}>James Carter</span>
              <ChevronDown size={14} color="#8a8599" />
            </button>
          </div>
        </header>

        {/* Content */}
        <div style={{ padding: 32, flex: 1 }}>
          {/* Vendor header */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <h1 style={{ fontSize: 26, fontWeight: 800, color: '#f0ede8', margin: '0 0 10px' }}>ABC Plumbing LLC</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ background: '#111118', border: '1px solid #1e1e2e', color: '#8a8599', borderRadius: 6, padding: '4px 12px', fontSize: 13, fontWeight: 500 }}>
                    Plumbing Contractor
                  </span>
                  <span style={{ background: '#1c0a00', color: '#D97706', border: '1px solid #92400e', borderRadius: 6, padding: '4px 12px', fontSize: 13, fontWeight: 600 }}>
                    Issues Found
                  </span>
                  <span style={{ fontSize: 13, color: '#8a8599' }}>Exp: May 22, 2026</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tab bar */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid #1e1e2e', paddingBottom: 0 }}>
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  padding: '10px 18px', fontSize: 14, fontWeight: 600,
                  color: activeTab === tab.key ? '#D97706' : '#8a8599',
                  borderBottom: activeTab === tab.key ? '2px solid #D97706' : '2px solid transparent',
                  marginBottom: -1, transition: 'all 0.15s',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Overview Tab ── */}
          {activeTab === 'overview' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                {/* Insurance Summary */}
                <div style={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: 12, padding: 24 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f0ede8', margin: '0 0 20px' }}>Insurance Summary</h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #1e1e2e' }}>
                        {['Coverage Type', 'Required', 'Actual', 'Status'].map(col => (
                          <th key={col} style={{ textAlign: 'left', padding: '6px 10px 10px', fontSize: 11, color: '#8a8599', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {INSURANCE_ROWS.map((row, i) => (
                        <tr key={i} style={{ borderBottom: i < INSURANCE_ROWS.length - 1 ? '1px solid #1e1e2e' : 'none' }}>
                          <td style={{ padding: '12px 10px', fontSize: 13, color: '#f0ede8', fontWeight: 500 }}>{row.coverage}</td>
                          <td style={{ padding: '12px 10px', fontSize: 13, color: '#8a8599' }}>{row.required}</td>
                          <td style={{ padding: '12px 10px', fontSize: 13, color: '#8a8599' }}>{row.actual}</td>
                          <td style={{ padding: '12px 10px' }}><CoverageStatus status={row.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Plain English Summary */}
                <div style={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: 12, padding: 24 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f0ede8', margin: '0 0 16px' }}>Plain-English Summary</h3>
                  <p style={{ fontSize: 14, color: '#c4bfd8', lineHeight: 1.7, margin: 0 }}>
                    ABC Plumbing meets the required general liability and auto liability limits. However, the certificate does not show your company as an additional insured and does not include a waiver of subrogation endorsement. You should request an updated COI with the required endorsements before allowing this vendor to perform work.
                  </p>
                  <div style={{ marginTop: 20, padding: '14px 16px', background: 'rgba(217,119,6,0.06)', border: '1px solid rgba(217,119,6,0.20)', borderRadius: 10 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#D97706', marginBottom: 6 }}>Action Required</div>
                    <div style={{ fontSize: 13, color: '#c4bfd8' }}>Request updated COI with Additional Insured and Waiver of Subrogation endorsements.</div>
                  </div>
                </div>
              </div>

              {/* Uploaded Documents */}
              <div style={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: 12, padding: 24 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f0ede8', margin: '0 0 20px' }}>Uploaded Documents</h3>
                <DocumentsTable />
              </div>
            </>
          )}

          {/* ── Documents Tab ── */}
          {activeTab === 'documents' && (
            <div style={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: 12, padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f0ede8', margin: '0 0 20px' }}>Documents</h3>
              <DropZone />
              <DocumentsTable />
            </div>
          )}

          {/* ── History Tab ── */}
          {activeTab === 'history' && (
            <div style={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: 12, padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f0ede8', margin: '0 0 24px' }}>Submission History</h3>
              <div style={{ position: 'relative', paddingLeft: 28 }}>
                <div style={{ position: 'absolute', left: 8, top: 0, bottom: 0, width: 1, background: '#1e1e2e' }} />
                {HISTORY.map((entry, i) => {
                  const isCompliant = entry.status === 'Compliant'
                  return (
                    <div key={i} style={{ position: 'relative', marginBottom: i < HISTORY.length - 1 ? 28 : 0 }}>
                      <div style={{
                        position: 'absolute', left: -24, top: 4,
                        width: 14, height: 14, borderRadius: '50%',
                        background: isCompliant ? '#052e16' : '#1c0a00',
                        border: `2px solid ${isCompliant ? '#22c55e' : '#D97706'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {isCompliant
                          ? <Check size={7} color="#22c55e" strokeWidth={3} />
                          : <X size={7} color="#D97706" strokeWidth={3} />
                        }
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <span style={{ fontSize: 13, color: '#8a8599', display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Clock size={12} />
                          {entry.date}
                        </span>
                        <span style={{
                          background: isCompliant ? '#052e16' : '#1c0a00',
                          color: isCompliant ? '#22c55e' : '#D97706',
                          border: `1px solid ${isCompliant ? '#166534' : '#92400e'}`,
                          borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600,
                        }}>
                          {entry.status}
                        </span>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#f0ede8', marginBottom: 4 }}>{entry.action}</div>
                      <div style={{ fontSize: 13, color: '#8a8599' }}>{entry.note}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Notes Tab ── */}
          {activeTab === 'notes' && (
            <div style={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: 12, padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f0ede8', margin: '0 0 16px' }}>Notes</h3>
              <p style={{ fontSize: 13, color: '#8a8599', marginBottom: 16 }}>Internal notes about this vendor. Not visible to the vendor.</p>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Add notes about this vendor..."
                rows={8}
                style={{
                  width: '100%', background: '#0a0a0f', border: '1px solid #1e1e2e',
                  borderRadius: 8, padding: '14px', fontSize: 14, color: '#f0ede8',
                  resize: 'vertical', outline: 'none', fontFamily: 'Inter, -apple-system, sans-serif',
                  lineHeight: 1.6, transition: 'border-color 0.15s',
                }}
                onFocus={e => (e.target.style.borderColor = '#D97706')}
                onBlur={e => (e.target.style.borderColor = '#1e1e2e')}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
                <button
                  onClick={saveNote}
                  style={{
                    background: noteSaved ? '#22c55e' : '#D97706',
                    color: '#fff', fontSize: 14, fontWeight: 600,
                    padding: '10px 24px', borderRadius: 8, border: 'none',
                    cursor: 'pointer', transition: 'background 0.2s',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  {noteSaved ? <><Check size={15} /> Saved!</> : 'Save Note'}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
