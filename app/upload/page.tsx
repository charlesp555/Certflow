'use client'
import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Nav from '../components/Nav'
import Footer from '../components/Footer'

type Coverage = {
  type: string
  eachOccurrence: string
  aggregate: string
  deductible: string
}

type COIData = {
  insuredName: string
  insuredAddress: string
  effectiveDate: string
  expirationDate: string
  isExpired: boolean
  daysUntilExpiration: number
  coverages: Coverage[]
  additionalInsured: boolean
  waiverOfSubrogation: boolean
  certificateHolder: string
  producer: string
  flags: string[]
  overallStatus: 'COMPLIANT' | 'EXPIRING' | 'EXPIRED' | 'NON_COMPLIANT'
}

const statusConfig = {
  COMPLIANT:     { bg: 'rgba(16,185,129,0.10)', color: '#6ee7b7', border: 'rgba(16,185,129,0.25)', label: 'COMPLIANT'     },
  EXPIRING:      { bg: 'rgba(251,191,36,0.10)', color: '#fcd34d', border: 'rgba(251,191,36,0.3)',  label: 'EXPIRING SOON' },
  EXPIRED:       { bg: 'rgba(239,68,68,0.10)',  color: '#fca5a5', border: 'rgba(239,68,68,0.25)', label: 'EXPIRED'       },
  NON_COMPLIANT: { bg: 'rgba(239,68,68,0.10)',  color: '#fca5a5', border: 'rgba(239,68,68,0.25)', label: 'NON-COMPLIANT' },
}

function UploadForm() {
  const searchParams = useSearchParams()
  const vendorId   = searchParams.get('vendorId')
  const vendorName = searchParams.get('vendorName')

  const [file,     setFile]     = useState<File | null>(null)
  const [loading,  setLoading]  = useState(false)
  const [result,   setResult]   = useState<COIData | null>(null)
  const [error,    setError]    = useState('')
  const [dragging, setDragging] = useState(false)
  const [saved,    setSaved]    = useState(false)

  const handleFile = (f: File) => {
    if (f.type !== 'application/pdf') { setError('Please upload a PDF file.'); return }
    setFile(f)
    setError('')
    setResult(null)
    setSaved(false)
  }

  const handleSubmit = async () => {
    if (!file) return
    setLoading(true)
    setError('')
    setResult(null)
    setSaved(false)

    try {
      const fd = new FormData()
      fd.append('file', file)
      if (vendorId)   fd.append('vendor_id',   vendorId)
      if (vendorName) fd.append('vendor_name', vendorName)

      const res  = await fetch('/api/extract-coi', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Something went wrong')

      setResult(json.data)
      setSaved(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const s = result ? statusConfig[result.overallStatus] : null

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <Nav />
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '60px 24px' }}>

        <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: 'var(--amber)', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 12 }}>
          COI verification
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-1px', marginBottom: 8 }}>
          Upload a Certificate of Insurance
        </h1>

        {vendorName
          ? <p style={{ fontSize: 14, color: 'var(--muted2)', marginBottom: 40 }}>
              Vendor: <strong style={{ color: 'var(--text)', fontWeight: 600 }}>{vendorName}</strong>
              {' — '}the analysis will be saved to this vendor&apos;s record.
            </p>
          : <p style={{ fontSize: 14, color: 'var(--muted2)', marginBottom: 40 }}>
              Upload any COI PDF and Covira will instantly extract all coverage data and flag compliance issues.
              The vendor will be identified from the insured name on the certificate.
            </p>
        }

        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
          onClick={() => document.getElementById('file-input')?.click()}
          style={{
            border: `2px dashed ${dragging ? 'var(--amber)' : file ? 'rgba(16,185,129,0.4)' : 'var(--border2)'}`,
            borderRadius: 12, padding: '48px 24px', textAlign: 'center',
            cursor: 'pointer', background: dragging ? 'var(--amber-dim)' : 'var(--bg2)',
            transition: 'all 0.2s', marginBottom: 16,
          }}
        >
          <input
            id="file-input" type="file" accept=".pdf" style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
          />
          <div style={{ fontSize: 40, marginBottom: 16 }}>📄</div>
          {file ? (
            <>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#6ee7b7', marginBottom: 4 }}>✓ {file.name}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>Click to change file</div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Drop your COI PDF here</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>or click to browse</div>
            </>
          )}
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.10)', border: '0.5px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: '12px 16px', marginBottom: 16, fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, color: '#fca5a5' }}>
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!file || loading}
          style={{
            background: !file || loading ? 'rgba(245,158,11,0.3)' : 'var(--amber)',
            color: '#1a0800', fontFamily: 'IBM Plex Mono, monospace', fontSize: 13, fontWeight: 700,
            padding: '14px 32px', borderRadius: 8, border: 'none',
            cursor: !file || loading ? 'not-allowed' : 'pointer', width: '100%', marginBottom: 16,
          }}
        >
          {loading ? 'analyzing & saving...' : 'analyze_coi() →'}
        </button>

        {saved && (
          <div style={{
            background: 'rgba(16,185,129,0.08)', border: '0.5px solid rgba(16,185,129,0.35)',
            borderRadius: 8, padding: '14px 20px', marginBottom: 32,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
          }}>
            <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, color: '#6ee7b7' }}>
              ✓ analysis saved to covira
            </span>
            <div style={{ display: 'flex', gap: 20 }}>
              {vendorId && (
                <a href={`/vendors/${vendorId}`} style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, color: '#6ee7b7', textDecoration: 'none', fontWeight: 700 }}>
                  view vendor →
                </a>
              )}
              <a href="/submissions" style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, color: '#6ee7b7', textDecoration: 'none', fontWeight: 700 }}>
                view submissions →
              </a>
            </div>
          </div>
        )}

        {result && s && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            <div style={{ background: s.bg, border: `0.5px solid ${s.border}`, borderRadius: 10, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: s.color, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 4 }}>overall status</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: s.color, letterSpacing: '-0.5px' }}>{s.label}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: s.color, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 4 }}>expires</div>
                <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 16, color: s.color }}>{result.expirationDate}</div>
                <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: s.color, opacity: 0.7 }}>
                  {result.daysUntilExpiration < 0 ? `${Math.abs(result.daysUntilExpiration)} days ago` : `${result.daysUntilExpiration} days remaining`}
                </div>
              </div>
            </div>

            {result.flags.length > 0 && (
              <div style={{ background: 'rgba(239,68,68,0.06)', border: '0.5px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '16px 20px' }}>
                <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: '#fca5a5', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 12 }}>compliance flags</div>
                {result.flags.map((flag, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: 13, color: '#fca5a5' }}>
                    <span>⚠</span><span>{flag}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border2)', borderRadius: 10, padding: '16px 20px' }}>
              <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: 'var(--amber)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 12 }}>insured information</div>
              {[['Insured Name', result.insuredName], ['Address', result.insuredAddress], ['Producer', result.producer], ['Certificate Holder', result.certificateHolder], ['Effective Date', result.effectiveDate], ['Expiration Date', result.expirationDate]].map(([label, value]) => (
                <div key={label} style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 8, marginBottom: 8, fontSize: 13 }}>
                  <div style={{ color: 'var(--muted)', fontFamily: 'IBM Plex Mono, monospace', fontSize: 11 }}>{label}</div>
                  <div style={{ color: 'var(--text)' }}>{value}</div>
                </div>
              ))}
            </div>

            <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border2)', borderRadius: 10, padding: '16px 20px' }}>
              <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: 'var(--amber)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 12 }}>endorsements</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { label: 'Additional Insured',    value: result.additionalInsured    },
                  { label: 'Waiver of Subrogation', value: result.waiverOfSubrogation  },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 16 }}>{item.value ? '✅' : '❌'}</span>
                    <span style={{ fontSize: 13, color: item.value ? '#6ee7b7' : '#fca5a5' }}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border2)', borderRadius: 10, padding: '16px 20px' }}>
              <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: 'var(--amber)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 12 }}>coverage details</div>
              {result.coverages.map((cov, i) => (
                <div key={i} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: i < result.coverages.length - 1 ? '0.5px solid var(--border)' : 'none' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{cov.type}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    {[['Each Occurrence', cov.eachOccurrence], ['Aggregate', cov.aggregate], ['Deductible', cov.deductible]].map(([label, value]) => (
                      <div key={label}>
                        <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: 'var(--muted)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 2 }}>{label}</div>
                        <div style={{ fontSize: 13 }}>{value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => { setFile(null); setResult(null); setSaved(false) }}
              style={{ background: 'transparent', border: '0.5px solid var(--border2)', color: 'var(--muted2)', fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, padding: '12px', borderRadius: 8, cursor: 'pointer' }}
            >
              analyze another certificate →
            </button>
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}

export default function Upload() {
  return (
    <Suspense>
      <UploadForm />
    </Suspense>
  )
}
