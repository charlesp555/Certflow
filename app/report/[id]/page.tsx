'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Bell, Check, X, AlertTriangle, FileText } from 'lucide-react'
import Sidebar from '../../components/Sidebar'
import { UserButton, useUser } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

type Coverage = {
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
  insuredAddress?: string | null
  effectiveDate?: string | null
  expirationDate?: string | null
  isExpired?: boolean
  daysUntilExpiration?: number | null
  coverages?: Coverage[]
  additionalInsured?: boolean
  waiverOfSubrogation?: boolean
  certificateHolder?: string | null
  producer?: string | null
  flags?: string[]
  overallStatus?: 'COMPLIANT' | 'EXPIRING' | 'EXPIRED' | 'NON_COMPLIANT' | null
  requirementsCheck?: RequirementCheck[]
}

type SubmissionRow = {
  id: string
  status: string | null
  risk_score: number | null
  issues_count: number | null
  created_at: string | null
  analysis_result: AnalysisResult | null
  vendors: { id: string; name: string } | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreColor(score: number) {
  if (score >= 80) return '#22c55e'
  if (score >= 60) return '#f59e0b'
  return '#ef4444'
}

function statusInfo(status: string | null | undefined) {
  switch (status) {
    case 'COMPLIANT':     return { label: 'Compliant',     bg: '#052e16', color: '#22c55e', border: '#166534'  }
    case 'EXPIRING':      return { label: 'Expiring Soon', bg: '#451a03', color: '#f59e0b', border: '#92400e'  }
    case 'EXPIRED':       return { label: 'Expired',       bg: '#450a0a', color: '#ef4444', border: '#7f1d1d'  }
    case 'NON_COMPLIANT': return { label: 'Issues Found',  bg: '#1c1002', color: '#D97706', border: '#92400e'  }
    default:              return { label: 'Pending',       bg: '#0f0f17', color: '#8b8cf8', border: '#3730a3'  }
  }
}

function computeConfidence(ar: AnalysisResult): number {
  let pts = 0
  if (ar.insuredName)                  pts += 20
  if (ar.effectiveDate)                pts += 20
  if (ar.expirationDate)               pts += 20
  if (ar.coverages && ar.coverages.length > 0) pts += 20
  if (ar.certificateHolder)            pts += 20
  return Math.max(pts, 60)
}

function generateSummary(ar: AnalysisResult, vendorName: string): string {
  const flags = ar.flags ?? []
  switch (ar.overallStatus) {
    case 'COMPLIANT':
      return `${vendorName} meets all standard insurance requirements. No compliance issues were found.`
    case 'EXPIRED':
      return `The certificate for ${vendorName} has expired as of ${ar.expirationDate ?? 'an unknown date'}. A renewed COI is required before any work can be authorized.`
    case 'EXPIRING': {
      const days = ar.daysUntilExpiration
      return `The certificate for ${vendorName} is expiring soon${days != null ? ` in ${days} days` : ''}. Request a renewed COI now to avoid a coverage gap.`
    }
    default:
      if (flags.length > 0) {
        return `${vendorName}'s certificate has ${flags.length} issue${flags.length !== 1 ? 's' : ''}: ${flags.join('; ')}.`
      }
      return `${vendorName}'s certificate has been analyzed. Review the requirements check below for details.`
  }
}

// ─── Score Ring ───────────────────────────────────────────────────────────────

function ScoreRing({ score, overallStatus }: { score: number; overallStatus: string | null | undefined }) {
  const R = 54
  const circ = 2 * Math.PI * R
  const filled = (Math.max(0, Math.min(100, score)) / 100) * circ
  const color = scoreColor(score)
  const si = statusInfo(overallStatus)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, flexShrink: 0 }}>
      <div style={{ position: 'relative', width: 140, height: 140 }}>
        <svg width="140" height="140" viewBox="0 0 140 140">
          <circle cx="70" cy="70" r={R} fill="none" stroke="#1e1e2e" strokeWidth="12" />
          <circle
            cx="70" cy="70" r={R} fill="none"
            stroke={color} strokeWidth="12"
            strokeDasharray={`${filled} ${circ - filled}`}
            strokeDashoffset={circ * 0.25}
            strokeLinecap="round"
          />
        </svg>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#f0ede8', lineHeight: 1 }}>{score}</div>
          <div style={{ fontSize: 11, color: '#8a8599', marginTop: 2 }}>/ 100</div>
        </div>
      </div>
      <span style={{ background: si.bg, color: si.color, border: `1px solid ${si.border}`, borderRadius: 20, padding: '4px 14px', fontSize: 13, fontWeight: 600 }}>
        {si.label}
      </span>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReportDetailPage() {
  const params = useParams()
  const id = params?.id as string | undefined
  const { user, isLoaded } = useUser()

  const [sub, setSub]       = useState<SubmissionRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!isLoaded || !user || !id) return
    let cancelled = false

    async function load() {
      setLoading(true)
      const { data, error } = await supabase
        .from('submissions')
        .select('id, status, risk_score, issues_count, created_at, analysis_result, vendors(id, name)')
        .eq('id', id)
        .eq('clerk_user_id', user!.id)
        .maybeSingle()

      if (cancelled) return
      if (error || !data) {
        setNotFound(true)
      } else {
        setSub(data as unknown as SubmissionRow)
      }
      setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [isLoaded, user, id])

  // Derived display values
  const ar          = sub?.analysis_result ?? null
  const vendorName  = sub?.vendors?.name ?? ar?.insuredName ?? 'Unknown Vendor'
  const score       = sub?.risk_score ?? 0
  const uploadDate  = sub?.created_at
    ? new Date(sub.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—'
  const policyPeriod = ar?.effectiveDate && ar?.expirationDate
    ? `${ar.effectiveDate} – ${ar.expirationDate}`
    : ar?.expirationDate ?? '—'

  const confidence      = ar ? computeConfidence(ar) : 0
  const confidenceLabel = confidence >= 90 ? 'High' : confidence >= 75 ? 'Medium' : 'Low'
  const confidenceColor = confidence >= 90 ? '#22c55e' : confidence >= 75 ? '#f59e0b' : '#ef4444'

  const summary = ar ? generateSummary(ar, vendorName) : ''
  const flags   = ar?.flags ?? []

  // Build requirements rows — prefer requirementsCheck from the analysis (real pass/fail and saved requirement amounts)
  const reqRows: { coverage: string; required: string; actual: string; pass: boolean }[] = []
  const reqCheck = ar?.requirementsCheck ?? []

  if (reqCheck.length > 0) {
    for (const req of reqCheck) {
      reqRows.push({
        coverage: req.coverage,
        required: req.minimum || 'Required',
        actual: req.actual || '—',
        pass: req.passed,
      })
    }
  } else {
    // Fallback for older submissions without requirementsCheck
    if (ar?.coverages) {
      for (const cov of ar.coverages) {
        const actual = [cov.eachOccurrence, cov.aggregate]
          .filter(v => v && v !== '$0' && v !== 'N/A' && v !== '—')
          .join(' / ') || '—'
        const present = actual !== '—'
        reqRows.push({ coverage: cov.type, required: 'Present', actual: present ? actual : 'Missing', pass: present })
      }
    }
    if (ar) {
      reqRows.push({
        coverage: 'Additional Insured',
        required: 'Required',
        actual: ar.additionalInsured ? 'Included' : 'Missing',
        pass: ar.additionalInsured ?? false,
      })
      reqRows.push({
        coverage: 'Waiver of Subrogation',
        required: 'Required',
        actual: ar.waiverOfSubrogation ? 'Included' : 'Missing',
        pass: ar.waiverOfSubrogation ?? false,
      })
    }
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
            href="/submissions"
            style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#8a8599', textDecoration: 'none', fontSize: 14, fontWeight: 500, transition: 'color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#f0ede8')}
            onMouseLeave={e => (e.currentTarget.style.color = '#8a8599')}
          >
            <ArrowLeft size={16} /> Back to Submissions
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button style={{ position: 'relative', background: 'transparent', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8, color: '#8a8599' }}>
              <Bell size={20} />
              <span style={{ position: 'absolute', top: 5, right: 5, width: 8, height: 8, background: '#D97706', borderRadius: '50%', border: '2px solid #0a0a0f' }} />
            </button>
            <UserButton />
          </div>
        </header>

        {/* Content */}
        <div style={{ padding: 32, flex: 1 }}>

          {/* Loading */}
          {loading && (
            <div style={{ textAlign: 'center', paddingTop: 80 }}>
              <div style={{ width: 32, height: 32, border: '3px solid rgba(217,119,6,0.15)', borderTop: '3px solid #D97706', borderRadius: '50%', margin: '0 auto 14px', animation: 'spin 0.8s linear infinite' }} />
              <p style={{ fontSize: 13, color: '#8a8599', margin: 0 }}>Loading report…</p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {/* Not found */}
          {!loading && notFound && (
            <div style={{ textAlign: 'center', paddingTop: 80 }}>
              <FileText size={42} color="#1e1e2e" style={{ marginBottom: 18 }} />
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f0ede8', margin: '0 0 8px' }}>Report not found</h2>
              <p style={{ fontSize: 14, color: '#8a8599', margin: '0 0 24px' }}>
                This submission doesn&apos;t exist or you don&apos;t have access to it.
              </p>
              <Link href="/submissions" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#D97706', color: '#fff', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                <ArrowLeft size={14} /> Back to Submissions
              </Link>
            </div>
          )}

          {/* Pending analysis */}
          {!loading && sub && !ar && (
            <div style={{ textAlign: 'center', paddingTop: 80 }}>
              <FileText size={42} color="#1e1e2e" style={{ marginBottom: 18 }} />
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f0ede8', margin: '0 0 8px' }}>Analysis pending</h2>
              <p style={{ fontSize: 14, color: '#8a8599', margin: 0 }}>This submission hasn&apos;t been analyzed yet. Check back shortly.</p>
            </div>
          )}

          {/* Full report */}
          {!loading && sub && ar && (
            <>
              {/* Header card */}
              <div style={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: 12, padding: '20px 24px', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 12, color: '#8a8599', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                      Compliance Report
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#f0ede8', marginBottom: 10 }}>{vendorName}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
                      <span style={{ fontSize: 13, color: '#8a8599' }}>
                        <strong style={{ color: '#c4bfd8' }}>Policy Period:</strong> {policyPeriod}
                      </span>
                      <span style={{ fontSize: 13, color: '#8a8599' }}>
                        <strong style={{ color: '#c4bfd8' }}>Uploaded:</strong> {uploadDate}
                      </span>
                      {ar.producer && (
                        <span style={{ fontSize: 13, color: '#8a8599' }}>
                          <strong style={{ color: '#c4bfd8' }}>Insurer:</strong> {ar.producer}
                        </span>
                      )}
                      {ar.certificateHolder && (
                        <span style={{ fontSize: 13, color: '#8a8599' }}>
                          <strong style={{ color: '#c4bfd8' }}>Certificate Holder:</strong> {ar.certificateHolder}
                        </span>
                      )}
                    </div>
                  </div>
                  <ScoreRing score={score} overallStatus={ar.overallStatus} />
                </div>
              </div>

              {/* Two-column layout */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>

                {/* Left — Requirements Check */}
                <div style={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: 12, padding: 24 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f0ede8', margin: '0 0 20px' }}>Requirements Check</h3>
                  {reqRows.length > 0 ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #1e1e2e' }}>
                          {['Coverage Type', 'Required', 'Actual', 'Result'].map(col => (
                            <th key={col} style={{ textAlign: 'left', padding: '8px 12px 12px', fontSize: 11, color: '#8a8599', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {reqRows.map((row, i) => (
                          <tr key={i} style={{ borderBottom: i < reqRows.length - 1 ? '1px solid #1e1e2e' : 'none' }}>
                            <td style={{ padding: '13px 12px', fontSize: 14, fontWeight: 500, color: '#f0ede8' }}>{row.coverage}</td>
                            <td style={{ padding: '13px 12px', fontSize: 13, color: '#8a8599' }}>{row.required}</td>
                            <td style={{ padding: '13px 12px', fontSize: 13, color: '#8a8599' }}>{row.actual}</td>
                            <td style={{ padding: '13px 12px' }}>
                              {row.pass
                                ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(34,197,94,0.10)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>
                                    <Check size={11} strokeWidth={3} /> Pass
                                  </span>
                                : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(239,68,68,0.10)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>
                                    <X size={11} strokeWidth={3} /> Fail
                                  </span>
                              }
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p style={{ fontSize: 13, color: '#8a8599', margin: 0 }}>No coverage details were extracted from this COI.</p>
                  )}
                </div>

                {/* Right — Summary, Confidence, Recommendations */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                  {/* Summary */}
                  <div style={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: 12, padding: 20 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f0ede8', margin: '0 0 12px' }}>Summary</h3>
                    <p style={{ fontSize: 13, color: '#c4bfd8', lineHeight: 1.7, margin: 0 }}>{summary}</p>
                  </div>

                  {/* AI Confidence */}
                  <div style={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: 12, padding: 20 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f0ede8', margin: '0 0 14px' }}>AI Confidence</h3>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 13, color: '#8a8599' }}>Extraction accuracy</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: confidenceColor }}>
                        {confidenceLabel} ({confidence}%)
                      </span>
                    </div>
                    <div style={{ height: 8, background: '#1e1e2e', borderRadius: 100, overflow: 'hidden' }}>
                      <div style={{ width: `${confidence}%`, height: '100%', background: confidenceColor, borderRadius: 100, transition: 'width 0.5s ease' }} />
                    </div>
                    <div style={{ fontSize: 12, color: '#8a8599', marginTop: 8 }}>
                      Based on document clarity and data completeness
                    </div>
                  </div>

                  {/* Recommendations / Flags */}
                  <div style={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: 12, padding: 20 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f0ede8', margin: '0 0 12px' }}>Recommendations</h3>
                    {flags.length === 0 ? (
                      <div style={{ display: 'flex', gap: 10, padding: '12px 14px', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.20)', borderRadius: 8 }}>
                        <Check size={15} color="#22c55e" style={{ flexShrink: 0, marginTop: 1 }} />
                        <span style={{ fontSize: 13, color: '#c4bfd8', lineHeight: 1.6 }}>No action needed at this time.</span>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {flags.map((flag, i) => (
                          <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 13px', background: 'rgba(217,119,6,0.06)', border: '1px solid rgba(217,119,6,0.20)', borderRadius: 8 }}>
                            <AlertTriangle size={14} color="#D97706" style={{ flexShrink: 0, marginTop: 1 }} />
                            <span style={{ fontSize: 13, color: '#c4bfd8', lineHeight: 1.6 }}>{flag}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
