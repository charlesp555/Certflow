'use client'
import { useState } from 'react'

const vendors = [
  { name:'Apex Plumbing LLC', type:'maintenance', property:'Maple Creek I', coverage:'GL + Workers Comp', gl:'$1M/$2M', wc:'$500K', ai:'yes', date:'04.02.26', status:'expired', days:-35 },
  { name:'Greenleaf Landscaping', type:'grounds', property:'Maple Creek II', coverage:'General Liability', gl:'$500K/$1M', wc:'n/a', ai:'yes', date:'05.22.26', status:'expiring', days:15 },
  { name:'CleanRight Services', type:'janitorial', property:'Riverside Lofts', coverage:'GL + Auto', gl:'$1M/$2M', wc:'n/a', ai:'yes', date:'01.30.27', status:'compliant', days:268 },
  { name:'Metro Electric Co.', type:'electrical', property:'West End Condos', coverage:'GL + Workers Comp', gl:'$2M/$4M', wc:'$1M', ai:'yes', date:'03.15.27', status:'compliant', days:312 },
  { name:'Ironclad HVAC', type:'mechanical', property:'Maple Creek I', coverage:'GL + Umbrella', gl:'$1M/$2M', wc:'$500K', ai:'no', date:'05.30.26', status:'expiring', days:23 },
  { name:'ProPaint Solutions', type:'painting', property:'Maple Creek II', coverage:'General Liability', gl:'$1M/$2M', wc:'n/a', ai:'yes', date:'11.12.26', status:'compliant', days:189 },
  { name:'Solid Ground Concrete', type:'construction', property:'Riverside Lofts', coverage:'GL + Workers Comp', gl:'$500K/$1M', wc:'$250K', ai:'yes', date:'03.18.26', status:'expired', days:-54 },
  { name:'ClearView Windows', type:'maintenance', property:'West End Condos', coverage:'General Liability', gl:'$1M/$2M', wc:'n/a', ai:'yes', date:'08.20.26', status:'compliant', days:105 },
  { name:'Swift Security', type:'security', property:'Maple Creek I', coverage:'GL + E&O', gl:'$2M/$4M', wc:'$500K', ai:'yes', date:'12.01.26', status:'compliant', days:208 },
  { name:'FreshCoat Painters', type:'painting', property:'West End Condos', coverage:'General Liability', gl:'$500K/$1M', wc:'n/a', ai:'no', date:'05.18.26', status:'expiring', days:11 },
]

const logs = [
  { t:'r', msg:'[ALERT] apex_plumbing: GL policy expired 35 days ago — vendor access flagged' },
  { t:'r', msg:'[ALERT] solid_ground: expired 54 days ago — certificate required before next job' },
  { t:'a', msg:'[WARN] freshcoat_painters: expiring in 11 days + missing additional insured' },
  { t:'a', msg:'[WARN] ironclad_hvac: expiring in 23 days — automated outreach sent' },
  { t:'g', msg:'[OK] metro_electric: verified compliant — $2M GL + workers comp confirmed' },
  { t:'m', msg:'covira engine v1.4 // last_sync: just now // 10 vendors monitored' },
]

const navItems = ['dashboard','vendors','properties','reports','settings']
const properties = ['all properties','Maple Creek I','Maple Creek II','Riverside Lofts','West End Condos']

export default function DemoDashboard() {
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [propFilter, setPropFilter] = useState('all properties')
  const [activeNav, setActiveNav] = useState('dashboard')
  const [selected, setSelected] = useState<number|null>(null)

  const filtered = vendors.filter(v => {
    const mf = filter === 'all' || v.status === filter
    const ms = !search || v.name.toLowerCase().includes(search.toLowerCase()) || v.type.toLowerCase().includes(search.toLowerCase())
    const mp = propFilter === 'all properties' || v.property === propFilter
    return mf && ms && mp
  })

  const src = propFilter === 'all properties' ? vendors : vendors.filter(v => v.property === propFilter)
  const expired = src.filter(v=>v.status==='expired').length
  const expiring = src.filter(v=>v.status==='expiring').length
  const compliant = src.filter(v=>v.status==='compliant').length

  const tagStyle = (status: string) => {
    if (status === 'expired') return { background:'rgba(239,68,68,0.10)', color:'#fca5a5', border:'0.5px solid rgba(239,68,68,0.25)' }
    if (status === 'expiring') return { background:'rgba(251,191,36,0.10)', color:'#fcd34d', border:'0.5px solid rgba(251,191,36,0.3)' }
    return { background:'rgba(16,185,129,0.10)', color:'#6ee7b7', border:'0.5px solid rgba(16,185,129,0.25)' }
  }

  const expColor = (status: string) => status === 'expired' ? '#ef4444' : status === 'expiring' ? '#fbbf24' : '#10b981'
  const metricColor = (type: string) => type === 'r' ? '#ef4444' : type === 'a' ? '#fbbf24' : type === 'g' ? '#10b981' : '#e2e8f0'

  const sel = selected !== null ? vendors[selected] : null

  return (
    <div style={{ background:'#080c14', border:'0.5px solid rgba(255,255,255,0.12)', borderRadius:12, overflow:'hidden', fontFamily:'DM Sans, sans-serif', color:'#e2e8f0' }}>
      {/* Topbar */}
      <div style={{ background:'#080c14', borderBottom:'0.5px solid rgba(255,255,255,0.07)', padding:'12px 20px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ fontSize:15, fontWeight:800, letterSpacing:'-0.5px' }}>COVIRA<span style={{ display:'inline-block', width:5, height:5, borderRadius:'50%', background:'#d97706', marginLeft:2, verticalAlign:'middle' }} /></div>
        <div style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:10, color:'#64748b' }}>Maple Creek Properties — 4 locations</div>
        <div style={{ display:'flex', alignItems:'center', gap:5, fontFamily:'IBM Plex Mono, monospace', fontSize:10, color:'#10b981' }}>
          <div style={{ width:5, height:5, borderRadius:'50%', background:'#10b981', animation:'pulse 2s infinite' }} />live
        </div>
      </div>

      {/* Main */}
      <div style={{ display:'grid', gridTemplateColumns:'160px 1fr', minHeight:420 }}>
        {/* Sidebar */}
        <div style={{ borderRight:'0.5px solid rgba(255,255,255,0.07)', background:'#0d1320', padding:'16px 0' }}>
          <div style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:9, color:'#64748b', padding:'0 16px 8px', letterSpacing:'1.5px', textTransform:'uppercase' }}>navigation</div>
          {navItems.map(item => (
            <div key={item} onClick={() => setActiveNav(item)} style={{ padding:'8px 16px', fontFamily:'IBM Plex Mono, monospace', fontSize:11, color: activeNav===item ? '#f59e0b' : '#64748b', background: activeNav===item ? 'rgba(245,158,11,0.10)' : 'transparent', borderRight: activeNav===item ? '2px solid #f59e0b' : 'none', cursor:'pointer', display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:5, height:5, borderRadius:'50%', background:'currentColor', flexShrink:0 }} />{item}
            </div>
          ))}
          <div style={{ marginTop:16, borderTop:'0.5px solid rgba(255,255,255,0.07)', paddingTop:12 }}>
            <div style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:9, color:'#64748b', padding:'0 16px 8px', letterSpacing:'1.5px', textTransform:'uppercase' }}>properties</div>
            {properties.map(p => (
              <div key={p} onClick={() => setPropFilter(p)} style={{ padding:'8px 16px', fontFamily:'IBM Plex Mono, monospace', fontSize:11, color: propFilter===p ? '#f59e0b' : '#64748b', cursor:'pointer' }}>
                {p.toLowerCase()}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ padding:16, background:'#080c14' }}>
          {/* Metrics */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:16 }}>
            {[{val:`0${expired}`,label:'expired',c:'r'},{val:`0${expiring}`,label:'expiring_soon',c:'a'},{val:String(compliant).padStart(2,'0'),label:'compliant',c:'g'},{val:String(src.length).padStart(2,'0'),label:'total_vendors',c:'b'}].map(m => (
              <div key={m.label} style={{ background:'#0d1320', border:'0.5px solid rgba(255,255,255,0.07)', borderRadius:8, padding:'12px 14px' }}>
                <div style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:22, fontWeight:500, lineHeight:1, color:metricColor(m.c) }}>{m.val}</div>
                <div style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:9, color:'#64748b', letterSpacing:'1px', textTransform:'uppercase', marginTop:4 }}>{m.label}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap', alignItems:'center' }}>
            {['all','expired','expiring','compliant'].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:10, padding:'5px 12px', borderRadius:4, border:'0.5px solid rgba(255,255,255,0.12)', background: filter===f ? 'rgba(245,158,11,0.10)' : 'transparent', color: filter===f ? '#f59e0b' : '#64748b', cursor:'pointer' }}>{f}</button>
            ))}
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="search vendors..." style={{ background:'#0d1320', border:'0.5px solid rgba(255,255,255,0.12)', borderRadius:4, padding:'5px 10px', fontFamily:'IBM Plex Mono, monospace', fontSize:10, color:'#e2e8f0', width:150, outline:'none' }} />
          </div>

          {/* Table */}
          <div style={{ border:'0.5px solid rgba(255,255,255,0.07)', borderRadius:8, overflow:'hidden', position:'relative' }}>
            <div style={{ display:'grid', gridTemplateColumns:'minmax(0,2fr) minmax(0,1.2fr) minmax(0,1fr) minmax(0,1fr) 90px', gap:8, padding:'8px 14px', background:'#111827', borderBottom:'0.5px solid rgba(255,255,255,0.07)' }}>
              {['vendor','coverage','property','expires','status'].map(h => (
                <div key={h} style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:9, color:'#64748b', letterSpacing:'1px', textTransform:'uppercase' }}>{h}</div>
              ))}
            </div>
            {filtered.length === 0 && <div style={{ padding:24, textAlign:'center', fontFamily:'IBM Plex Mono, monospace', fontSize:11, color:'#64748b' }}>// no vendors match this filter</div>}
            {filtered.map((v, i) => (
              <div key={i} onClick={() => setSelected(selected === vendors.indexOf(v) ? null : vendors.indexOf(v))} style={{ display:'grid', gridTemplateColumns:'minmax(0,2fr) minmax(0,1.2fr) minmax(0,1fr) minmax(0,1fr) 90px', gap:8, padding:'10px 14px', borderBottom:'0.5px solid rgba(255,255,255,0.07)', alignItems:'center', cursor:'pointer', background: selected === vendors.indexOf(v) ? 'rgba(245,158,11,0.05)' : 'transparent' }}>
                <div>
                  <div style={{ fontSize:12, fontWeight:500, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{v.name}</div>
                  <div style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:10, color:'#64748b', marginTop:1 }}>// {v.type}</div>
                </div>
                <div style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:11, color:'#94a3b8', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{v.coverage}</div>
                <div style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:11, color:'#94a3b8', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{v.property}</div>
                <div style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:11, color:expColor(v.status) }}>{v.date}</div>
                <div><span style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:9, padding:'3px 8px', borderRadius:3, fontWeight:500, letterSpacing:'0.5px', ...tagStyle(v.status) }}>{v.status.toUpperCase()}</span></div>
              </div>
            ))}

            {/* Detail Panel */}
            {sel && (
              <div style={{ position:'absolute', right:0, top:0, bottom:0, width:250, background:'#0d1320', borderLeft:'0.5px solid rgba(255,255,255,0.12)', padding:16, display:'flex', flexDirection:'column', gap:10, overflowY:'auto' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div style={{ fontSize:13, fontWeight:500 }}>{sel.name}</div>
                  <button onClick={() => setSelected(null)} style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:10, color:'#64748b', background:'none', border:'none', cursor:'pointer' }}>close</button>
                </div>
                {[['vendor type',sel.type],['property',sel.property],['coverage',sel.coverage],['gl limit',sel.gl],['workers comp',sel.wc],['additional insured',sel.ai==='yes'?'✓ confirmed':'✗ missing'],['expires',sel.date],['status',sel.status.toUpperCase()]].map(([label,val]) => (
                  <div key={label} style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:10 }}>
                    <div style={{ color:'#64748b', letterSpacing:'1px', textTransform:'uppercase', marginBottom:2 }}>{label}</div>
                    <div style={{ color:'#e2e8f0', fontSize:12 }}>{val}</div>
                  </div>
                ))}
                {(sel.status === 'expired' || sel.status === 'expiring') && (
                  <button style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:10, padding:'8px 12px', borderRadius:5, background:'#f59e0b', color:'#1a0800', border:'none', cursor:'pointer', fontWeight:500, marginTop:4 }}>send_renewal_request() →</button>
                )}
                <button onClick={() => setSelected(null)} style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:10, padding:'8px 12px', borderRadius:5, border:'0.5px solid rgba(255,255,255,0.12)', color:'#94a3b8', background:'transparent', cursor:'pointer' }}>dismiss</button>
              </div>
            )}
          </div>

          {/* Terminal */}
          <div style={{ borderTop:'0.5px solid rgba(255,255,255,0.07)', padding:'10px 0 0', fontFamily:'IBM Plex Mono, monospace', fontSize:10, color:'#64748b', lineHeight:1.8, marginTop:12 }}>
            {logs.map((l,i) => (
              <div key={i} style={{ display:'flex', gap:8 }}>
                <span style={{ color:'#f59e0b', opacity:0.6 }}>→</span>
                <span style={{ color: l.t==='r'?'#fca5a5':l.t==='a'?'#fcd34d':l.t==='g'?'#6ee7b7':'#64748b' }}>{l.msg}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}