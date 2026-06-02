'use client'

export default function BeforeAfter() {
  return (
    <div style={{ background: '#080c14', border: '0.5px solid rgba(255,255,255,0.12)', borderRadius: 12, overflow: 'hidden', fontFamily: 'DM Sans, sans-serif', color: '#e2e8f0' }}>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>

        {/* BEFORE */}
        <div>
          <div style={{ padding: '10px 14px', borderBottom: '0.5px solid rgba(255,255,255,0.07)', borderRight: '0.5px solid rgba(255,255,255,0.07)', background: '#0d1320', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, letterSpacing: '1px', textTransform: 'uppercase', color: '#64748b' }}>before covira</span>
            <span style={{ background: 'rgba(239,68,68,0.10)', color: '#fca5a5', border: '0.5px solid rgba(239,68,68,0.25)', padding: '2px 8px', borderRadius: 3, fontFamily: 'IBM Plex Mono, monospace', fontSize: 9 }}>manual chaos</span>
          </div>
          <div style={{ padding: 12, background: '#080c14', borderRight: '0.5px solid rgba(255,255,255,0.07)' }}>
            
            <div style={{ border: '0.5px solid rgba(255,255,255,0.12)', borderRadius: 6, overflow: 'hidden', marginBottom: 10 }}>
              {[
                { vendor: 'Apex Plumbing', policy: 'GL-2291', exp: '04/02/26', status: 'warn', statusText: '??? check' },
                { vendor: 'Greenleaf Land.', policy: 'missing', exp: 'unknown', status: 'miss', statusText: 'no COI' },
                { vendor: 'CleanRight Svc', policy: 'GL-8812', exp: '01/30/27', status: 'ok', statusText: 'ok i think' },
                { vendor: 'Metro Electric', policy: 'need to ask', exp: '???', status: 'warn', statusText: 'follow up' },
                { vendor: 'Ironclad HVAC', policy: 'GL-4401', exp: '05/30/26', status: 'warn', statusText: 'remind later' },
              ].map((row, i) => {
                const c = row.status === 'warn' ? '#fca5a5' : row.status === 'miss' ? '#fcd34d' : '#6ee7b7'
                return (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.8fr 0.8fr 0.7fr', borderBottom: i < 4 ? '0.5px solid rgba(255,255,255,0.07)' : 'none' }}>
                    <div style={{ padding: '5px 8px', fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.vendor}</div>
                    <div style={{ padding: '5px 8px', fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: c, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.policy}</div>
                    <div style={{ padding: '5px 8px', fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: c }}>{row.exp}</div>
                    <div style={{ padding: '5px 8px', fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: c, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.statusText}</div>
                  </div>
                )
              })}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { icon: '✗', color: '#fca5a5', text: 'No automatic alerts — someone checks expiration dates manually every week' },
                { icon: '✗', color: '#fca5a5', text: '3 vendors missing COIs entirely — nobody noticed for 6 weeks' },
                { icon: '✗', color: '#fca5a5', text: 'Apex lapsed 35 days ago — contractor still on site' },
                { icon: '⚠', color: '#fcd34d', text: 'If something goes wrong today, you are liable' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 11, color: '#94a3b8' }}>
                  <span style={{ color: item.color, flexShrink: 0, marginTop: 1, fontSize: 10 }}>{item.icon}</span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AFTER */}
        <div>
          <div style={{ padding: '10px 14px', borderBottom: '0.5px solid rgba(255,255,255,0.07)', background: '#0d1320', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, letterSpacing: '1px', textTransform: 'uppercase', color: '#64748b' }}>after covira</span>
            <span style={{ background: 'rgba(16,185,129,0.10)', color: '#6ee7b7', border: '0.5px solid rgba(16,185,129,0.25)', padding: '2px 8px', borderRadius: 3, fontFamily: 'IBM Plex Mono, monospace', fontSize: 9 }}>fully automated</span>
          </div>
          <div style={{ padding: 12, background: '#080c14' }}>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, marginBottom: 10 }}>
              {[{ val: '02', label: 'expired', color: '#ef4444' }, { val: '03', label: 'expiring', color: '#fbbf24' }, { val: '31', label: 'compliant', color: '#10b981' }].map(m => (
                <div key={m.label} style={{ background: '#0d1320', border: '0.5px solid rgba(255,255,255,0.07)', borderRadius: 6, padding: '8px 10px' }}>
                  <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 16, fontWeight: 500, lineHeight: 1, color: m.color }}>{m.val}</div>
                  <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 8, color: '#64748b', letterSpacing: '1px', textTransform: 'uppercase', marginTop: 3 }}>{m.label}</div>
                </div>
              ))}
            </div>

            <div style={{ border: '0.5px solid rgba(255,255,255,0.07)', borderRadius: 6, overflow: 'hidden', marginBottom: 10 }}>
              {[
                { name: 'Apex Plumbing LLC', type: 'maintenance', status: 'expired' },
                { name: 'Greenleaf Landscaping', type: 'grounds', status: 'expiring' },
                { name: 'CleanRight Services', type: 'janitorial', status: 'compliant' },
                { name: 'Metro Electric Co.', type: 'electrical', status: 'compliant' },
                { name: 'Ironclad HVAC', type: 'mechanical', status: 'expiring' },
              ].map((v, i) => {
                const tagStyle = v.status === 'expired'
                  ? { background: 'rgba(239,68,68,0.10)', color: '#fca5a5', border: '0.5px solid rgba(239,68,68,0.25)' }
                  : v.status === 'expiring'
                  ? { background: 'rgba(251,191,36,0.10)', color: '#fcd34d', border: '0.5px solid rgba(251,191,36,0.3)' }
                  : { background: 'rgba(16,185,129,0.10)', color: '#6ee7b7', border: '0.5px solid rgba(16,185,129,0.25)' }
                return (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, padding: '7px 10px', borderBottom: i < 4 ? '0.5px solid rgba(255,255,255,0.07)' : 'none', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 500 }}>{v.name}</div>
                      <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: '#64748b' }}>// {v.type}</div>
                    </div>
                    <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 8, padding: '2px 7px', borderRadius: 3, fontWeight: 500, ...tagStyle }}>{v.status.toUpperCase()}</span>
                  </div>
                )
              })}
            </div>

            <div style={{ background: 'rgba(245,158,11,0.08)', border: '0.5px solid rgba(245,158,11,0.25)', borderRadius: 6, padding: '8px 10px' }}>
              <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: '#f59e0b', fontWeight: 500, marginBottom: 4 }}>// automated actions taken</div>
              {[
                '→ Apex Plumbing flagged + renewal request sent automatically',
                '→ Greenleaf reminder queued for 90/60/30 day alerts',
                '→ All coverage limits verified against your requirements',
              ].map((t, i) => (
                <div key={i} style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: '#94a3b8', marginTop: 2 }}>{t}</div>
              ))}
            </div>

          </div>
        </div>

      </div>

      <div style={{ padding: '10px 14px', background: '#0d1320', borderTop: '0.5px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: '#64748b' }}>// manual tracking: <span style={{ color: '#f59e0b' }}>~2 hrs/week per property</span></div>
        <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: '#64748b' }}>// with covira: <span style={{ color: '#10b981' }}>0 minutes. fully automated.</span></div>
      </div>

    </div>
  )
}