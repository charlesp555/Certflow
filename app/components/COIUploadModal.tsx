'use client'
import { useState } from 'react'
import { X, Upload, CheckCircle2 } from 'lucide-react'

type OverallStatus = 'COMPLIANT' | 'EXPIRING' | 'EXPIRED' | 'NON_COMPLIANT'

type UploadResult = {
  overallStatus: OverallStatus
  expirationDate: string
  daysUntilExpiration: number
  insuredName: string
}

const STATUS_CFG = {
  COMPLIANT:     { color: '#22c55e', bg: 'rgba(34,197,94,0.09)',   border: 'rgba(34,197,94,0.22)',   label: 'Compliant'     },
  EXPIRING:      { color: '#fbbf24', bg: 'rgba(251,191,36,0.09)',  border: 'rgba(251,191,36,0.22)',  label: 'Expiring Soon' },
  EXPIRED:       { color: '#ef4444', bg: 'rgba(239,68,68,0.09)',   border: 'rgba(239,68,68,0.22)',   label: 'Expired'       },
  NON_COMPLIANT: { color: '#ef4444', bg: 'rgba(239,68,68,0.09)',   border: 'rgba(239,68,68,0.22)',   label: 'Non-Compliant' },
}

export default function COIUploadModal({
  vendorId,
  vendorName,
  onClose,
  onSuccess,
}: {
  vendorId: string
  vendorName: string
  onClose: () => void
  onSuccess: () => void
}) {
  const [file,     setFile]     = useState<File | null>(null)
  const [loading,  setLoading]  = useState(false)
  const [result,   setResult]   = useState<UploadResult | null>(null)
  const [error,    setError]    = useState('')
  const [dragging, setDragging] = useState(false)

  const handleFile = (f: File) => {
    if (f.type !== 'application/pdf') { setError('Please upload a PDF file.'); return }
    setFile(f)
    setError('')
    setResult(null)
  }

  const handleSubmit = async () => {
    if (!file) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('vendor_id', vendorId)
      fd.append('vendor_name', vendorName)
      const res  = await fetch('/api/extract-coi', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Something went wrong')
      setResult(json.data as UploadResult)
      onSuccess()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#111118', border: '1px solid #1e1e2e', borderRadius: 16,
          padding: 32, width: '100%', maxWidth: 520,
          boxShadow: '0 12px 48px rgba(0,0,0,0.65)',
          maxHeight: '90vh', overflowY: 'auto',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f0ede8', margin: 0 }}>Upload COI</h2>
            <p style={{ fontSize: 13, color: '#8a8599', margin: '4px 0 0' }}>{vendorName}</p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#8a8599', padding: 4, display: 'flex', flexShrink: 0 }}
          >
            <X size={20} />
          </button>
        </div>

        {result ? (
          <SuccessView result={result} onClose={onClose} />
        ) : (
          <>
            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
              onClick={() => document.getElementById('modal-coi-input')?.click()}
              style={{
                border: `2px dashed ${dragging ? '#D97706' : file ? 'rgba(34,197,94,0.5)' : '#2a2a3e'}`,
                borderRadius: 12, padding: '38px 24px', textAlign: 'center',
                cursor: 'pointer', background: dragging ? 'rgba(217,119,6,0.06)' : '#0a0a0f',
                transition: 'all 0.2s', marginBottom: 16,
              }}
            >
              <input
                id="modal-coi-input" type="file" accept=".pdf" style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
              />
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
                <div style={{
                  width: 46, height: 46, borderRadius: 11,
                  background: 'rgba(217,119,6,0.10)', border: '1px solid rgba(217,119,6,0.22)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Upload size={20} color="#D97706" />
                </div>
              </div>
              {file ? (
                <>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#22c55e', marginBottom: 4 }}>✓ {file.name}</div>
                  <div style={{ fontSize: 12, color: '#8a8599' }}>Click to change file</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#f0ede8', marginBottom: 4 }}>Drop your COI PDF here</div>
                  <div style={{ fontSize: 12, color: '#8a8599' }}>or click to browse · PDF only</div>
                </>
              )}
            </div>

            {error && (
              <div style={{
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.22)',
                borderRadius: 8, padding: '11px 14px', marginBottom: 14,
                fontSize: 13, color: '#fca5a5',
              }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
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
                onClick={handleSubmit}
                disabled={!file || loading}
                style={{
                  background: !file || loading ? 'rgba(217,119,6,0.30)' : '#D97706',
                  color: !file || loading ? 'rgba(255,255,255,0.45)' : '#fff',
                  fontSize: 14, fontWeight: 600, padding: '10px 24px',
                  borderRadius: 8, border: 'none',
                  cursor: !file || loading ? 'not-allowed' : 'pointer',
                  transition: 'background 0.15s', minWidth: 170,
                }}
              >
                {loading ? 'Analyzing & saving…' : 'Analyze COI →'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function SuccessView({ result, onClose }: { result: UploadResult; onClose: () => void }) {
  const s = STATUS_CFG[result.overallStatus]
  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.22)',
        borderRadius: 8, padding: '12px 16px', marginBottom: 20,
      }}>
        <CheckCircle2 size={16} color="#22c55e" />
        <span style={{ fontSize: 13, fontWeight: 600, color: '#22c55e' }}>COI saved to Covira</span>
      </div>

      <div style={{
        background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10,
        padding: '18px 20px', marginBottom: 24,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: 10, color: s.color, textTransform: 'uppercase', letterSpacing: '1.5px', fontFamily: 'IBM Plex Mono, monospace', marginBottom: 4 }}>
            status
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.label}</div>
          {result.insuredName && (
            <div style={{ fontSize: 12, color: s.color, opacity: 0.75, marginTop: 4 }}>{result.insuredName}</div>
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 10, color: s.color, textTransform: 'uppercase', letterSpacing: '1px', fontFamily: 'IBM Plex Mono, monospace', marginBottom: 4 }}>
            expires
          </div>
          <div style={{ fontSize: 14, fontFamily: 'IBM Plex Mono, monospace', color: s.color }}>{result.expirationDate}</div>
          <div style={{ fontSize: 11, fontFamily: 'IBM Plex Mono, monospace', color: s.color, opacity: 0.7, marginTop: 2 }}>
            {result.daysUntilExpiration < 0
              ? `${Math.abs(result.daysUntilExpiration)}d ago`
              : `${result.daysUntilExpiration}d remaining`}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={onClose}
          style={{
            background: '#D97706', color: '#fff', fontSize: 14, fontWeight: 600,
            padding: '10px 28px', borderRadius: 8, border: 'none', cursor: 'pointer',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#b45309')}
          onMouseLeave={e => (e.currentTarget.style.background = '#D97706')}
        >
          Done
        </button>
      </div>
    </div>
  )
}
