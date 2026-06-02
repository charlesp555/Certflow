'use client'

import Link from 'next/link'
import { ArrowLeft, Bell, User, ChevronDown, Check } from 'lucide-react'
import Sidebar from '../components/Sidebar'

// ─── Score Ring ───────────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const R = 54
  const circumference = 2 * Math.PI * R
  const filled = (score / 100) * circumference

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <div style={{ position: 'relative', width: 140, height: 140 }}>
        <svg width="140" height="140" viewBox="0 0 140 140">
          <circle cx="70" cy="70" r={R} fill="none" stroke="#1e1e2e" strokeWidth="12" />
          <circle
            cx="70" cy="70" r={R} fill="none"
            stroke="#22c55e" strokeWidth="12"
            strokeDasharray={`${filled} ${circumference - filled}`}
            strokeDashoffset={circumference * 0.25}
            strokeLinecap="round"
          />
        </svg>
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)', textAlign: 'center',
        }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#f0ede8', lineHeight: 1 }}>{score}</div>
          <div style={{ fontSize: 11, color: '#8a8599', marginTop: 2 }}>/ 100</div>
        </div>
      </div>
      <span style={{
        background: '#052e16', color: '#22c55e', border: '1px solid #166534',
        borderRadius: 20, padding: '4px 14px', fontSize: 13, fontWeight: 600,
      }}>
        Compliant
      </span>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReportPage() {
  const requirementsRows = [
    { coverage: 'General Liability',       required: '$1,000,000', actual: '$1,000,000', result: true },
    { coverage: 'Auto Liability',          required: '$1,000,000', actual: '$1,000,000', result: true },
    { coverage: 'Workers Comp',            required: 'Required',   actual: 'Included',   result: true },
    { coverage: 'Additional Insured',      required: 'Required',   actual: 'Included',   result: true },
    { coverage: 'Waiver of Subrogation',   required: 'Required',   actual: 'Included',   result: true },
  ]

  const aiConfidence = 92

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
            Back to Submissions
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
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
          {/* Header info */}
          <div style={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: 12, padding: '20px 24px', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <div style={{ fontSize: 12, color: '#8a8599', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Compliance Report</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#f0ede8', marginBottom: 8 }}>Summit Electric Co.</div>
                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13, color: '#8a8599' }}><strong style={{ color: '#c4bfd8' }}>Policy Period:</strong> Feb 15, 2025 – Feb 15, 2026</span>
                  <span style={{ fontSize: 13, color: '#8a8599' }}><strong style={{ color: '#c4bfd8' }}>Uploaded:</strong> May 19, 2025</span>
                </div>
              </div>
              <ScoreRing score={82} />
            </div>
          </div>

          {/* Two-column layout */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>
            {/* Left — Requirements Check */}
            <div style={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: 12, padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f0ede8', margin: '0 0 20px' }}>Requirements Check</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #1e1e2e' }}>
                    {['Coverage Type', 'Required', 'Actual', 'Result'].map(col => (
                      <th key={col} style={{
                        textAlign: 'left', padding: '8px 12px 12px',
                        fontSize: 11, color: '#8a8599', fontWeight: 600,
                        textTransform: 'uppercase', letterSpacing: '0.5px',
                      }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {requirementsRows.map((row, i) => (
                    <tr key={i} style={{ borderBottom: i < requirementsRows.length - 1 ? '1px solid #1e1e2e' : 'none' }}>
                      <td style={{ padding: '13px 12px', fontSize: 14, fontWeight: 500, color: '#f0ede8' }}>{row.coverage}</td>
                      <td style={{ padding: '13px 12px', fontSize: 13, color: '#8a8599' }}>{row.required}</td>
                      <td style={{ padding: '13px 12px', fontSize: 13, color: '#8a8599' }}>{row.actual}</td>
                      <td style={{ padding: '13px 12px' }}>
                        {row.result
                          ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(34,197,94,0.10)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}><Check size={11} strokeWidth={3} /> Pass</span>
                          : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(239,68,68,0.10)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>✕ Fail</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Right column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Summary */}
              <div style={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: 12, padding: 20 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f0ede8', margin: '0 0 12px' }}>Summary</h3>
                <p style={{ fontSize: 13, color: '#c4bfd8', lineHeight: 1.7, margin: 0 }}>
                  This certificate meets all of your company&apos;s insurance requirements. No issues were found.
                </p>
              </div>

              {/* AI Confidence */}
              <div style={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: 12, padding: 20 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f0ede8', margin: '0 0 14px' }}>AI Confidence</h3>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: '#8a8599' }}>Extraction accuracy</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#22c55e' }}>High ({aiConfidence}%)</span>
                </div>
                <div style={{ height: 8, background: '#1e1e2e', borderRadius: 100, overflow: 'hidden' }}>
                  <div style={{ width: `${aiConfidence}%`, height: '100%', background: '#22c55e', borderRadius: 100, transition: 'width 0.5s ease' }} />
                </div>
                <div style={{ fontSize: 12, color: '#8a8599', marginTop: 8 }}>
                  Based on document clarity and data completeness
                </div>
              </div>

              {/* Recommendations */}
              <div style={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: 12, padding: 20 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f0ede8', margin: '0 0 12px' }}>Recommendations</h3>
                <div style={{ display: 'flex', gap: 10, padding: '12px 14px', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.20)', borderRadius: 8 }}>
                  <Check size={15} color="#22c55e" style={{ flexShrink: 0, marginTop: 1 }} />
                  <span style={{ fontSize: 13, color: '#c4bfd8', lineHeight: 1.6 }}>No action needed at this time.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
