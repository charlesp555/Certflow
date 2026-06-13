'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import {
  Shield, Menu, X, Check, Users, AlertTriangle, Clock,
  CheckCircle2, ArrowRight, Upload, Zap, FileText,
  LayoutDashboard, BarChart2, Bell, Settings, Folder,
  Link2, ClipboardList, ChevronDown, PlayCircle,
} from 'lucide-react'

const T = {
  bg:            '#0a0a0f',
  surface:       '#111118',
  card:          '#13131f',
  borderSubtle:  '#1a1a2e',
  borderAccent:  '#1e1e2e',
  orange:        '#D97706',
  orangeHover:   '#B45309',
  orangeGlow:    'rgba(217,119,6,0.15)',
  green:         '#22c55e',
  red:           '#dc2626',
  textPrimary:   '#f0f0f0',
  textSecondary: '#9ca3af',
  textMuted:     '#4b5063',
}

// Donut chart constants — r=38, viewBox 100×100
const R = 38
const C_CIRC = 2 * Math.PI * R // ≈ 238.76

const SIDEBAR = [
  { Icon: LayoutDashboard, label: 'Dashboard',    active: true  },
  { Icon: Users,           label: 'Vendors'                     },
  { Icon: Upload,          label: 'Submissions'                 },
  { Icon: BarChart2,       label: 'Reports'                     },
  { Icon: Bell,            label: 'Alerts',       badge: '2'    },
  { Icon: ClipboardList,   label: 'Requirements'                },
  { Icon: Folder,          label: 'Documents'                   },
  { Icon: Link2,           label: 'Integrations'                },
  { Icon: Settings,        label: 'Settings'                    },
]

const SUBMISSIONS = [
  { vendor: 'ABC Plumbing LLC',      date: 'May 20, 2025', status: 'Issues Found', sColor: '#D97706', sBg: 'rgba(217,119,6,0.13)', issues: 2 },
  { vendor: 'Summit Electric Co.',   date: 'May 19, 2025', status: 'Compliant',    sColor: '#22c55e', sBg: 'rgba(34,197,94,0.10)',  issues: 0 },
  { vendor: 'Bluewater HVAC',        date: 'May 18, 2025', status: 'Compliant',    sColor: '#22c55e', sBg: 'rgba(34,197,94,0.10)',  issues: 0 },
  { vendor: 'Pinnacle Roofing Inc.', date: 'May 16, 2025', status: 'Issues Found', sColor: '#D97706', sBg: 'rgba(217,119,6,0.13)', issues: 1 },
]

export default function Home() {
  const [navOpen, setNavOpen] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number

    interface Particle {
      x: number; y: number; size: number
      vx: number; vy: number; opacity: number; phase: number
    }

    const setup = () => {
      const W = canvas.offsetWidth || 800
      const H = canvas.offsetHeight || 600
      canvas.width = W
      canvas.height = H

      const particles: Particle[] = []
      for (let i = 0; i < 280; i++) {
        const r = Math.random()
        let x: number, y: number
        if (r < 0.45) {
          // bottom-left cluster
          x = Math.random() * W * 0.32
          y = H * 0.45 + Math.random() * H * 0.55
        } else if (r < 0.78) {
          // bottom-right cluster
          x = W * 0.68 + Math.random() * W * 0.32
          y = H * 0.45 + Math.random() * H * 0.55
        } else {
          // scattered across full canvas
          x = Math.random() * W
          y = Math.random() * H
        }
        particles.push({
          x, y,
          size: Math.random() * 2.2 + 0.3,
          vx: (Math.random() - 0.5) * 0.3,
          vy: -(Math.random() * 0.22 + 0.06),
          opacity: Math.random() * 0.45 + 0.08,
          phase: Math.random() * Math.PI * 2,
        })
      }

      let tick = 0
      const frame = () => {
        ctx.clearRect(0, 0, W, H)
        tick += 0.012
        for (const p of particles) {
          p.x += p.vx + Math.sin(tick + p.phase) * 0.7
          p.y += p.vy
          if (p.y < -4) { p.y = H + 4; p.x = Math.random() * W }
          if (p.x < -4) p.x = W + 4
          if (p.x > W + 4) p.x = -4
          ctx.globalAlpha = p.opacity
          ctx.fillStyle = '#D97706'
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.globalAlpha = 1
        animId = requestAnimationFrame(frame)
      }
      frame()
    }

    setup()
    const onResize = () => { cancelAnimationFrame(animId); setup() }
    window.addEventListener('resize', onResize)
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', onResize) }
  }, [])

  return (
    <div style={{ background: T.bg, minHeight: '100vh', color: T.textPrimary, fontFamily: 'Inter, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        a { cursor: pointer; text-decoration: none; }
        button { cursor: pointer; }

        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes live-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes float-card {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-7px); }
        }
        @keyframes hero-glow-pulse {
          0%, 100% { opacity: 0.07; }
          50%       { opacity: 0.14; }
        }
        @keyframes badge-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(217,119,6,0); }
          50%       { box-shadow: 0 0 18px 4px rgba(217,119,6,0.12); }
        }

        .hero-left  { animation: fade-in 0.5s ease forwards; }
        .hero-right { animation: slide-up 0.6s 0.15s ease both; }

        /* ── Nav link ── */
        .nav-link {
          font-size: 14px; font-weight: 500;
          color: ${T.textSecondary}; text-decoration: none;
          display: inline-flex; align-items: center; gap: 3px;
          transition: color 0.2s ease;
        }
        .nav-link:hover { color: ${T.textPrimary}; }

        /* ── Buttons ── */
        .btn-orange {
          display: inline-flex; align-items: center; gap: 6px;
          background: ${T.orange}; color: #fff; font-weight: 600;
          font-size: 15px; padding: 13px 26px; border-radius: 10px;
          border: none; text-decoration: none;
          box-shadow: 0 4px 20px rgba(217,119,6,0.28);
          transition: background 150ms ease, box-shadow 150ms ease, transform 150ms ease;
          position: relative; overflow: hidden;
        }
        .btn-orange::before {
          content: '';
          position: absolute; top: 0; left: -100%;
          width: 55%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent);
          transform: skewX(-20deg);
          transition: left 0.5s ease;
          pointer-events: none;
        }
        .btn-orange:hover::before { left: 160%; }
        .btn-orange:hover {
          background: ${T.orangeHover};
          box-shadow: 0 6px 32px rgba(217,119,6,0.50), 0 0 0 5px rgba(217,119,6,0.12);
          transform: translateY(-2px);
        }

        .btn-orange-sm {
          display: inline-flex; align-items: center; gap: 5px;
          background: ${T.orange}; color: #fff; font-weight: 600;
          font-size: 13px; padding: 9px 18px; border-radius: 8px;
          border: none; text-decoration: none;
          box-shadow: 0 2px 12px rgba(217,119,6,0.25);
          transition: background 150ms ease, box-shadow 150ms ease, transform 150ms ease;
        }
        .btn-orange-sm:hover {
          background: ${T.orangeHover};
          box-shadow: 0 0 20px rgba(217,119,6,0.3), 0 4px 20px rgba(217,119,6,0.40);
          transform: translateY(-1px);
        }

        .btn-ghost {
          display: inline-flex; align-items: center; gap: 6px;
          background: transparent; color: ${T.textSecondary}; font-weight: 500;
          font-size: 14px; padding: 8px 18px; border-radius: 8px;
          border: 1px solid #2a2a3f; text-decoration: none;
          transition: border-color 150ms ease, color 150ms ease, transform 150ms ease;
        }
        .btn-ghost:hover { border-color: ${T.orange}; color: #fff; transform: translateY(-1px); }

        .btn-ghost-lg {
          display: inline-flex; align-items: center; gap: 8px;
          background: transparent; color: ${T.textSecondary}; font-weight: 600;
          font-size: 15px; padding: 13px 26px; border-radius: 10px;
          border: 1px solid #2a2a3f; text-decoration: none;
          transition: border-color 150ms ease, color 150ms ease, transform 150ms ease;
        }
        .btn-ghost-lg:hover { border-color: ${T.orange}; color: #fff; transform: translateY(-1px); }

        .demo-link {
          font-size: 15px; font-weight: 600; color: ${T.orange};
          text-decoration: none; display: inline-flex; align-items: center; gap: 4px;
          border-bottom: 1px solid transparent; transition: border-color 0.2s, gap 0.2s;
        }
        .demo-link:hover { border-bottom-color: ${T.orange}; gap: 8px; }
        .demo-link .demo-arrow { transition: transform 0.2s ease; }
        .demo-link:hover .demo-arrow { transform: translateX(4px); }

        .card-hover { transition: border-color 0.2s, transform 0.2s; }
        .card-hover:hover { border-color: rgba(217,119,6,0.3) !important; transform: translateY(-2px); }

        .pricing-btn {
          display: block; text-align: center; padding: 12px;
          border-radius: 9px; font-size: 14px; font-weight: 600;
          text-decoration: none;
          transition: background 0.2s, color 0.2s, transform 0.2s, box-shadow 0.2s;
        }
        .pricing-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(0,0,0,0.35); }

        /* ── Responsive ── */
        @media (max-width: 1023px) {
          .hero-grid { flex-direction: column !important; }
          .hero-right-wrap { display: none !important; }
          .steps-connector { display: none !important; }
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
        @media (max-width: 767px) {
          .problem-grid { flex-direction: column !important; }
          .pricing-grid { flex-direction: column !important; }
          .trust-pills { flex-wrap: wrap !important; gap: 10px !important; }
          .footer-inner { flex-direction: column !important; gap: 24px !important; }
          .footer-links { flex-wrap: wrap !important; gap: 14px !important; }
        }
      `}</style>

      {/* ── NAV ───────────────────────────────────────────────────────────── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(10,10,15,0.82)',
        borderBottom: `1px solid ${T.borderAccent}`,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto', padding: '0 24px',
          height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          {/* Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
            <svg fill="none" viewBox="0 0 100 115" style={{ height: 28, width: 'auto', flexShrink: 0 }}>
              <path d="M50 8C44 6 38 4 33 5C19 3 9 13 9 28L9 55C9 77 24 93 50 104C76 93 91 77 91 55L91 28C91 13 81 3 67 5C62 4 56 6 50 8Z" fill="#D97706"/>
              <circle cx="50" cy="57" r="26" fill="rgba(0,0,0,0.82)"/>
              <path d="M68 44A22 22 0 1 0 68 70L61 64A13 13 0 1 1 61 50Z" fill="#D97706"/>
            </svg>
            <span style={{ fontSize: 15, fontWeight: 800, color: '#ffffff', letterSpacing: '0.20em' }}>COVIRA</span>
          </Link>

          {/* Center nav — desktop */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }} className="desktop-nav">
            <a href="#pricing" className="nav-link">Pricing</a>
            <a href="#how-it-works" className="nav-link">How It Works</a>
            <Link href="/demo" className="nav-link">Interactive Demo</Link>
            <a href="#about" className="nav-link">About</a>
          </div>

          {/* Right — desktop */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }} className="desktop-nav">
            <Link href="/sign-in" className="btn-ghost">Log In</Link>
            <Link href="/sign-up" className="btn-orange-sm">Get Started</Link>
          </div>

          {/* Hamburger */}
          <button
            onClick={() => setNavOpen(v => !v)}
            aria-label="Toggle menu"
            style={{
              display: 'none', background: 'none',
              border: `1px solid ${T.borderAccent}`, borderRadius: 8,
              width: 40, height: 40, alignItems: 'center', justifyContent: 'center',
              color: T.textPrimary,
            }}
            className="mobile-menu-btn"
          >
            {navOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Mobile dropdown */}
        {navOpen && (
          <div style={{
            background: T.surface, borderTop: `1px solid ${T.borderAccent}`,
            padding: '12px 24px 24px',
          }}>
            {[
              { label: 'Pricing',          href: '#pricing'      },
              { label: 'How It Works',     href: '#how-it-works' },
              { label: 'Interactive Demo', href: '/demo'         },
              { label: 'About',            href: '#about'        },
            ].map(l => (
              <a
                key={l.label}
                href={l.href}
                onClick={() => setNavOpen(false)}
                style={{
                  display: 'block', color: T.textSecondary, fontSize: 15,
                  fontWeight: 500, padding: '14px 0',
                  borderBottom: `1px solid ${T.borderAccent}`,
                  transition: 'color 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = T.textPrimary)}
                onMouseLeave={e => (e.currentTarget.style.color = T.textSecondary)}
              >
                {l.label}
              </a>
            ))}
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <Link href="/sign-in" className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>Log In</Link>
              <Link href="/sign-up" className="btn-orange" style={{ flex: 1, justifyContent: 'center', fontSize: 14 }}>Get Started</Link>
            </div>
          </div>
        )}
      </nav>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section style={{
        minHeight: 'calc(100vh - 64px)',
        background: T.bg,
        padding: 'clamp(56px, 7vw, 96px) 24px',
        position: 'relative', overflow: 'hidden',
        display: 'flex', alignItems: 'center',
      }}>
        {/* Particle canvas — z-index 0, no pointer events */}
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            pointerEvents: 'none', zIndex: 0,
          }}
        />

        {/* Dot grid */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }} />

        {/* Orange glow — top-left behind headline */}
        <div style={{
          position: 'absolute', top: '-12%', left: '-16%',
          width: 720, height: 720, borderRadius: '50%',
          background: 'rgba(217,119,6,0.09)', filter: 'blur(160px)',
          pointerEvents: 'none', zIndex: 1,
          animation: 'hero-glow-pulse 4s ease-in-out infinite',
        }} />
        {/* Indigo glow — right behind card */}
        <div style={{
          position: 'absolute', bottom: '-8%', right: '-8%',
          width: 500, height: 500, borderRadius: '50%',
          background: 'rgba(99,102,241,0.05)', filter: 'blur(120px)',
          pointerEvents: 'none', zIndex: 1,
        }} />

        {/* Two-column grid */}
        <div
          className="hero-grid"
          style={{
            maxWidth: 1200, margin: '0 auto', width: '100%',
            display: 'flex', alignItems: 'center', gap: 40,
            position: 'relative', zIndex: 2,
          }}
        >
          {/* ── LEFT COLUMN ── */}
          <div className="hero-left" style={{ flex: '0 0 44%', maxWidth: '44%' }}>
            {/* Badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center',
              background: 'rgba(217,119,6,0.10)', border: '1px solid rgba(217,119,6,0.25)',
              borderRadius: 6, padding: '5px 12px', marginBottom: 28,
              animation: 'badge-glow 3.5s ease-in-out infinite',
            }}>
              <span style={{
                fontSize: 11, fontWeight: 700, color: T.orange,
                letterSpacing: '0.04em', textTransform: 'uppercase',
              }}>
                AI-Powered Compliance
              </span>
            </div>

            {/* Headline */}
            <h1 style={{
              fontSize: 'clamp(42px, 5.2vw, 66px)', fontWeight: 800,
              lineHeight: 0.95, letterSpacing: '-0.02em', marginBottom: 24,
            }}>
              <span style={{ display: 'block', color: T.textPrimary }}>Vendor Insurance</span>
              <span style={{ display: 'block', color: T.textPrimary }}>Verification</span>
              <span style={{ display: 'block', color: T.orange }}>Made Simple.</span>
            </h1>

            {/* Subheadline */}
            <p style={{
              fontSize: 18, color: T.textSecondary, lineHeight: 1.6,
              maxWidth: 450, marginBottom: 40,
            }}>
              Upload a COI, receive a plain-English compliance review, and identify vendor insurance gaps in seconds.
            </p>

            {/* CTAs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <Link href="/sign-up" className="btn-orange" style={{ fontSize: 15 }}>
                Start Free Trial <ArrowRight size={15} />
              </Link>
              <a href="#how-it-works" className="btn-ghost-lg">
                <PlayCircle size={16} />
                See How It Works
              </a>
            </div>
          </div>

          {/* ── RIGHT COLUMN — static dashboard replica ── */}
          <div className="hero-right hero-right-wrap" style={{ flex: 1, minWidth: 0, position: 'relative' }}>
            {/* Outer orange glow ring */}
            <div style={{
              position: 'absolute', inset: -20, borderRadius: 20,
              background: 'radial-gradient(ellipse, rgba(217,119,6,0.07) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />

            <div style={{
              background: T.surface,
              border: `1px solid ${T.borderAccent}`,
              borderRadius: 12,
              boxShadow: [
                '0 0 0 1px rgba(217,119,6,0.07)',
                '0 28px 64px rgba(0,0,0,0.65)',
                '0 0 80px rgba(217,119,6,0.05)',
              ].join(', '),
              overflow: 'hidden',
              animation: 'float-card 4s ease-in-out infinite',
            }}>

              {/* Card top bar */}
              <div style={{
                background: '#0d0d14',
                borderBottom: `1px solid ${T.borderAccent}`,
                padding: '9px 14px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <svg fill="none" viewBox="0 0 100 115" style={{ height: 13, width: 'auto', flexShrink: 0 }}>
                    <path d="M50 8C44 6 38 4 33 5C19 3 9 13 9 28L9 55C9 77 24 93 50 104C76 93 91 77 91 55L91 28C91 13 81 3 67 5C62 4 56 6 50 8Z" fill="#D97706"/>
                    <circle cx="50" cy="57" r="26" fill="rgba(0,0,0,0.82)"/>
                    <path d="M68 44A22 22 0 1 0 68 70L61 64A13 13 0 1 1 61 50Z" fill="#D97706"/>
                  </svg>
                  <span style={{ fontSize: 10, fontWeight: 700, color: T.textPrimary, letterSpacing: '0.1em' }}>COVIRA</span>
                </div>
              </div>

              {/* Sidebar + content */}
              <div style={{ display: 'flex' }}>

                {/* ── MINI SIDEBAR ── */}
                <div style={{
                  width: 108, flexShrink: 0,
                  background: '#0d0d14',
                  borderRight: `1px solid ${T.borderAccent}`,
                  padding: '8px 0',
                }}>
                  {SIDEBAR.map(({ Icon, label, active, badge }) => (
                    <div key={label} style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '5px 8px', margin: '1px 5px', borderRadius: 5,
                      background: active ? 'rgba(217,119,6,0.12)' : 'transparent',
                    }}>
                      <Icon size={11} color={active ? T.orange : T.textMuted} strokeWidth={active ? 2.2 : 1.8} />
                      <span style={{
                        fontSize: 9.5, fontWeight: active ? 600 : 400,
                        color: active ? T.orange : T.textMuted,
                        flex: 1, whiteSpace: 'nowrap',
                      }}>
                        {label}
                      </span>
                      {badge && (
                        <span style={{
                          fontSize: 7.5, fontWeight: 700, color: '#fff',
                          background: '#dc2626', borderRadius: 3,
                          padding: '1px 3px', lineHeight: 1.5,
                        }}>{badge}</span>
                      )}
                    </div>
                  ))}
                </div>

                {/* ── MAIN CONTENT ── */}
                <div style={{ flex: 1, padding: '10px 12px', minWidth: 0, overflow: 'hidden' }}>

                  {/* 4 metric cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 10 }}>
                    {[
                      { label: 'Total Vendors', value: '42', sub: '↑12% vs last month', subColor: T.green  },
                      { label: 'Compliant',      value: '29', sub: '69%',               subColor: T.green  },
                      { label: 'Issues Found',   value: '9',  sub: '21%',               subColor: T.red    },
                      { label: 'Expiring Soon',  value: '4',  sub: '10%',               subColor: T.orange },
                    ].map(m => (
                      <div key={m.label} style={{
                        background: '#0d0d14', border: `1px solid ${T.borderAccent}`,
                        borderRadius: 7, padding: '7px 9px',
                      }}>
                        <div style={{ fontSize: 7.5, color: T.textSecondary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{m.label}</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: '#ffffff', lineHeight: 1, marginBottom: 3 }}>{m.value}</div>
                        <div style={{ fontSize: 8.5, color: m.subColor, fontWeight: 600 }}>{m.sub}</div>
                      </div>
                    ))}
                  </div>

                  {/* Compliance Overview */}
                  <div style={{
                    background: '#0d0d14', border: `1px solid ${T.borderAccent}`,
                    borderRadius: 7, padding: '9px 11px', marginBottom: 8,
                  }}>
                    {/* Section header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 }}>
                      <span style={{ fontSize: 10.5, fontWeight: 600, color: T.textPrimary }}>Compliance Overview</span>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 3,
                        background: T.borderAccent, borderRadius: 4, padding: '2px 7px',
                        border: '1px solid rgba(255,255,255,0.05)',
                      }}>
                        <span style={{ fontSize: 8, color: T.textSecondary }}>This Month</span>
                        <ChevronDown size={8} color={T.textMuted} />
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      {/* SVG donut */}
                      <svg viewBox="0 0 100 100" width={86} height={86} style={{ flexShrink: 0 }}>
                        {/* Track */}
                        <circle cx="50" cy="50" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
                        {/* Compliant 69% — green, starts at 12 o'clock */}
                        <circle cx="50" cy="50" r={R} fill="none" stroke="#16a34a" strokeWidth="12"
                          strokeDasharray={`${C_CIRC * 0.69} ${C_CIRC * 0.31}`}
                          transform="rotate(-90 50 50)" />
                        {/* Issues 21% — red */}
                        <circle cx="50" cy="50" r={R} fill="none" stroke="#ef4444" strokeWidth="12"
                          strokeDasharray={`${C_CIRC * 0.21} ${C_CIRC * 0.79}`}
                          transform={`rotate(${-90 + 0.69 * 360} 50 50)`} />
                        {/* Expiring 10% — orange */}
                        <circle cx="50" cy="50" r={R} fill="none" stroke="#f59e0b" strokeWidth="12"
                          strokeDasharray={`${C_CIRC * 0.10} ${C_CIRC * 0.90}`}
                          transform={`rotate(${-90 + 0.90 * 360} 50 50)`} />
                        {/* Center label */}
                        <text x="50" y="46" textAnchor="middle" fill="#ffffff" fontSize="14" fontWeight="800" fontFamily="Inter, sans-serif">69%</text>
                        <text x="50" y="57" textAnchor="middle" fill="#9ca3af" fontSize="7.5" fontFamily="Inter, sans-serif">Compliant</text>
                      </svg>

                      {/* Legend */}
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
                        {[
                          { dot: '#16a34a', label: 'Compliant',     n: 29, pct: '69%' },
                          { dot: '#ef4444', label: 'Issues',        n: 9,  pct: '21%' },
                          { dot: '#f59e0b', label: 'Expiring Soon', n: 4,  pct: '10%' },
                          { dot: '#374151', label: 'Pending',       n: 0,  pct: '0%'  },
                        ].map(l => (
                          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 7, height: 7, borderRadius: '50%', background: l.dot, flexShrink: 0 }} />
                            <span style={{ fontSize: 9, color: T.textSecondary, flex: 1 }}>{l.label}</span>
                            <span style={{ fontSize: 9.5, fontWeight: 700, color: '#ffffff', marginRight: 4 }}>{l.n}</span>
                            <span style={{ fontSize: 9, fontWeight: 600, color: l.dot, minWidth: 26, textAlign: 'right' }}>{l.pct}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Recent Submissions */}
                  <div style={{
                    background: '#0d0d14', border: `1px solid ${T.borderAccent}`,
                    borderRadius: 7, overflow: 'hidden',
                  }}>
                    {/* Header */}
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '7px 11px', borderBottom: `1px solid ${T.borderAccent}`,
                    }}>
                      <span style={{ fontSize: 10.5, fontWeight: 600, color: T.textPrimary }}>Recent Submissions</span>
                      <span style={{ fontSize: 9, color: T.orange, fontWeight: 600 }}>View all</span>
                    </div>

                    {/* Column headers */}
                    <div style={{
                      display: 'grid', gridTemplateColumns: '1.9fr 1.15fr 1.1fr 0.45fr',
                      padding: '4px 11px',
                      background: 'rgba(255,255,255,0.02)',
                      borderBottom: `1px solid ${T.borderAccent}`,
                    }}>
                      {['Vendor', 'COI Uploaded', 'Status', 'Issues'].map(col => (
                        <span key={col} style={{ fontSize: 7.5, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{col}</span>
                      ))}
                    </div>

                    {/* Rows */}
                    {SUBMISSIONS.map(row => (
                      <div key={row.vendor} style={{
                        display: 'grid', gridTemplateColumns: '1.9fr 1.15fr 1.1fr 0.45fr',
                        padding: '5px 11px', alignItems: 'center',
                        borderBottom: `1px solid ${T.borderAccent}`,
                      }}>
                        <span style={{ fontSize: 9.5, color: T.textPrimary, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 6 }}>
                          {row.vendor}
                        </span>
                        <span style={{ fontSize: 9, color: T.textSecondary }}>{row.date}</span>
                        <span style={{
                          display: 'inline-block', fontSize: 8, fontWeight: 700,
                          padding: '2px 6px', borderRadius: 4,
                          background: row.sBg, color: row.sColor,
                          whiteSpace: 'nowrap',
                        }}>{row.status}</span>
                        <span style={{
                          fontSize: 10, fontWeight: 600, textAlign: 'center',
                          color: row.issues > 0 ? T.orange : T.textMuted,
                        }}>{row.issues}</span>
                      </div>
                    ))}
                  </div>

                </div>{/* end main content */}
              </div>{/* end sidebar+content */}
            </div>{/* end card */}
          </div>{/* end right col */}
        </div>{/* end hero grid */}
      </section>

      {/* ── TRUST BAR ─────────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(to bottom, #0a0a0f 0%, #0d0d17 100%)',
        borderTop: `1px solid ${T.borderSubtle}`,
        borderBottom: `1px solid ${T.borderSubtle}`,
        padding: '20px 24px',
      }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 16, flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: 12, color: T.textMuted, fontWeight: 500, marginRight: 8 }}>
            Covira checks every COI against:
          </span>
          {[
            'General Liability limits',
            'Additional Insured status',
            'Waiver of Subrogation',
            'Workers Comp coverage',
            'Policy expiration dates',
          ].map(pill => (
            <div key={pill} style={{
              background: 'rgba(217,119,6,0.07)', border: `1px solid rgba(217,119,6,0.18)`,
              borderRadius: 100, padding: '5px 14px',
              fontSize: 12, fontWeight: 500, color: T.orange,
              whiteSpace: 'nowrap',
            }}>
              {pill}
            </div>
          ))}
        </div>
      </div>

      {/* ── PROBLEM / SOLUTION ────────────────────────────────────────────── */}
      <section style={{ background: 'linear-gradient(to bottom, #0d0d17 0%, #0a0a0f 60%)', padding: 'clamp(72px, 9vw, 110px) 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div
            className="problem-grid"
            style={{ display: 'flex', gap: 24, alignItems: 'stretch' }}
          >
            {/* Red card */}
            <div style={{
              flex: 1, background: 'rgba(220,38,38,0.05)',
              border: `1px solid rgba(220,38,38,0.15)`,
              borderRadius: 16, padding: 'clamp(32px, 4vw, 48px)',
            }}>
              <h3 style={{
                fontSize: 'clamp(22px, 2.8vw, 30px)', fontWeight: 800,
                color: T.textPrimary, lineHeight: 1.2, marginBottom: 28,
                letterSpacing: '-0.8px',
              }}>
                Right now, one of your vendors is probably uninsured.
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginBottom: 32 }}>
                {[
                  'Your PM software stores COIs. It does not verify them.',
                  'Manual spreadsheet tracking misses renewals.',
                  "You won't know there's a gap until someone gets hurt.",
                ].map(item => (
                  <div key={item} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                      background: 'rgba(220,38,38,0.15)', border: `1px solid rgba(220,38,38,0.3)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <X size={10} color={T.red} />
                    </div>
                    <p style={{ fontSize: 15, color: T.textSecondary, lineHeight: 1.6 }}>{item}</p>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 13, color: T.textMuted, lineHeight: 1.7, fontStyle: 'italic' }}>
                The average property management firm manages 30+ vendors. Manually verifying each one is impossible.
              </p>
            </div>

            {/* Green card */}
            <div style={{
              flex: 1, background: 'rgba(22,163,74,0.05)',
              border: `1px solid rgba(22,163,74,0.15)`,
              borderRadius: 16, padding: 'clamp(32px, 4vw, 48px)',
              display: 'flex', flexDirection: 'column',
            }}>
              <h3 style={{
                fontSize: 'clamp(22px, 2.8vw, 30px)', fontWeight: 800,
                color: T.textPrimary, lineHeight: 1.2, marginBottom: 28,
                letterSpacing: '-0.8px',
              }}>
                With Covira, you know instantly.
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginBottom: 36, flex: 1 }}>
                {[
                  'Upload any COI — PDF, photo, or email attachment',
                  'AI reads every coverage detail in seconds',
                  'Get a plain-English report with specific action items',
                ].map(item => (
                  <div key={item} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                      background: 'rgba(22,163,74,0.15)', border: `1px solid rgba(22,163,74,0.3)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Check size={10} color="#22c55e" />
                    </div>
                    <p style={{ fontSize: 15, color: T.textSecondary, lineHeight: 1.6 }}>{item}</p>
                  </div>
                ))}
              </div>
              <Link href="/demo" className="btn-orange" style={{ alignSelf: 'flex-start' }}>
                See it in action <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────────── */}
      <section id="how-it-works" style={{
        background: '#0d0d17', borderTop: `1px solid ${T.borderSubtle}`,
        padding: 'clamp(72px, 9vw, 110px) 24px',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: T.orange, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 14 }}>
              HOW IT WORKS
            </p>
            <h2 style={{
              fontSize: 'clamp(28px, 3.8vw, 46px)', fontWeight: 800,
              color: T.textPrimary, letterSpacing: '-1.5px', lineHeight: 1.1,
            }}>
              Three steps. Fifteen seconds. Total confidence.
            </h2>
          </div>

          <div style={{ display: 'flex', gap: 0, position: 'relative', alignItems: 'stretch' }}>
            {/* Connector line */}
            <div
              className="steps-connector"
              style={{
                position: 'absolute', top: 52, left: 'calc(33.33% - 0px)', right: 'calc(33.33%)',
                height: 1, background: `linear-gradient(90deg, ${T.borderAccent}, ${T.borderAccent})`,
                zIndex: 0,
              }}
            />

            {[
              {
                Icon: Upload, num: '01', title: 'Upload',
                desc: 'Drop in a PDF or photo of any COI. We handle the rest.',
              },
              {
                Icon: Zap, num: '02', title: 'Analyze',
                desc: "Covira's AI reads every coverage limit, endorsement, and expiration date.",
              },
              {
                Icon: FileText, num: '03', title: 'Act',
                desc: 'Get a plain-English report with specific gaps and one-click vendor outreach.',
              },
            ].map(({ Icon, num, title, desc }) => (
              <div key={num} style={{ flex: 1, position: 'relative', zIndex: 1, padding: '0 12px' }}>
                <div
                  className="card-hover"
                  style={{
                    background: T.card, border: `1px solid ${T.borderSubtle}`,
                    borderRadius: 14, padding: '32px 28px', height: '100%',
                    textAlign: 'center',
                  }}
                >
                  <div style={{
                    width: 52, height: 52, borderRadius: 14,
                    background: 'rgba(217,119,6,0.10)', border: `1px solid rgba(217,119,6,0.2)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}>
                    <Icon size={22} color={T.orange} />
                  </div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: T.orange, letterSpacing: '0.12em', marginBottom: 10 }}>
                    Step {num}
                  </p>
                  <h4 style={{ fontSize: 18, fontWeight: 700, color: T.textPrimary, marginBottom: 12 }}>{title}</h4>
                  <p style={{ fontSize: 14, color: T.textSecondary, lineHeight: 1.7 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY TEAMS CHOOSE COVIRA ──────────────────────────────────────── */}
      <section style={{
        background: '#0a0a0f',
        borderTop: `1px solid ${T.borderSubtle}`,
        padding: 'clamp(72px, 9vw, 110px) 24px',
        overflow: 'hidden',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: 64, alignItems: 'center', flexWrap: 'wrap' }}>

            {/* LEFT — features */}
            <div style={{ flex: '0 0 420px', maxWidth: 460 }}>
              <p style={{
                fontSize: 11, fontWeight: 700, color: T.orange,
                letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 12,
              }}>Built for Property Managers</p>
              <h2 style={{
                fontSize: 'clamp(28px, 3.8vw, 44px)', fontWeight: 800,
                color: T.textPrimary, letterSpacing: '-1.5px', lineHeight: 1.1, marginBottom: 16,
              }}>
                Why Teams Choose <span style={{ color: T.orange }}>Covira</span>
              </h2>
              <p style={{
                fontSize: 15, color: T.textSecondary, lineHeight: 1.7,
                marginBottom: 40, maxWidth: 420,
              }}>
                Covira helps property management teams save time, reduce risk, and stay compliant—without the manual work.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 20px' }}>
                {[
                  { Icon: Clock,        title: 'Save Time',      desc: 'Automate certificate requests and follow-ups.' },
                  { Icon: Shield,       title: 'Reduce Risk',    desc: 'Identify coverage gaps before they become problems.' },
                  { Icon: CheckCircle2, title: 'Stay Compliant', desc: 'Track expirations and requirements in one central place.' },
                  { Icon: Users,        title: 'Built for PMs',  desc: 'Designed specifically for property management teams.' },
                ].map(({ Icon, title, desc }) => (
                  <div key={title} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{
                      width: 42, height: 42, flexShrink: 0,
                      border: `1.5px solid ${T.orange}`, borderRadius: 10,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'rgba(217,119,6,0.07)',
                    }}>
                      <Icon size={18} color={T.orange} strokeWidth={1.6} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: 14, fontWeight: 700, color: T.textPrimary, marginBottom: 4 }}>{title}</h4>
                      <p style={{ fontSize: 13, color: T.textSecondary, lineHeight: 1.5 }}>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT — rotated COI + compliance card */}
            <div style={{ flex: 1, position: 'relative', minHeight: 500, minWidth: 380 }}>

              {/* COI document */}
              <div style={{
                background: '#f5f4ef',
                borderRadius: 8,
                padding: '20px 22px',
                transform: 'rotate(-5deg)',
                boxShadow: '0 24px 72px rgba(0,0,0,0.65)',
                width: '88%',
                position: 'relative',
                zIndex: 1,
              }}>
                <div style={{ textAlign: 'center', marginBottom: 10, borderBottom: '1px solid #d1d5db', paddingBottom: 8 }}>
                  <p style={{ fontSize: 8.5, fontWeight: 700, color: '#111', letterSpacing: '0.10em', textTransform: 'uppercase' }}>
                    Certificate of Liability Insurance
                  </p>
                  <p style={{ fontSize: 7, color: '#6b7280', marginTop: 2 }}>DATE (MM/DD/YYYY): 04/15/2025</p>
                </div>
                {[
                  { label: 'PRODUCER', lines: ['Acme Insurance Brokers, LLC', '123 Main St, Suite 200', 'New York, NY 10001'] },
                  { label: 'INSURED',  lines: ['ABC Plumbing LLC', '456 Trade Avenue', 'Brooklyn, NY 11201'] },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 6, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.04em', minWidth: 54 }}>{row.label}</span>
                    <div>{row.lines.map((l, i) => <p key={i} style={{ fontSize: 7, color: '#374151', lineHeight: 1.5 }}>{l}</p>)}</div>
                  </div>
                ))}
                <div style={{ border: '1px solid #d1d5db', borderRadius: 3, overflow: 'hidden', marginTop: 8 }}>
                  <div style={{ background: '#e5e7eb', padding: '3px 8px' }}>
                    <span style={{ fontSize: 6.5, fontWeight: 700, color: '#111', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Type of Insurance</span>
                  </div>
                  {[
                    ['Commercial General Liability', '$1,000,000 / $2,000,000'],
                    ['Automobile Liability', '$1,000,000'],
                    ["Workers' Compensation", 'Statutory'],
                    ['Umbrella Liability', '$5,000,000'],
                  ].map(([type, limit]) => (
                    <div key={type} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 8px', borderBottom: '1px solid #e5e7eb' }}>
                      <span style={{ fontSize: 6.5, color: '#374151' }}>{type}</span>
                      <span style={{ fontSize: 6.5, fontWeight: 600, color: '#111' }}>{limit}</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 8, padding: '5px 8px', background: '#e5e7eb', borderRadius: 3 }}>
                  <p style={{ fontSize: 6, fontWeight: 700, color: '#374151', textTransform: 'uppercase', marginBottom: 2 }}>Certificate Holder</p>
                  <p style={{ fontSize: 6.5, color: '#374151' }}>Skyline Property Management LLC</p>
                  <p style={{ fontSize: 6.5, color: '#374151' }}>789 Park Ave, New York, NY 10021</p>
                </div>
              </div>

              {/* Compliance Summary card */}
              <div style={{
                position: 'absolute', bottom: -16, right: 0,
                zIndex: 2,
                background: '#111118',
                border: '1px solid rgba(255,255,255,0.09)',
                borderRadius: 14,
                padding: '18px 20px',
                width: 228,
                boxShadow: '0 16px 56px rgba(0,0,0,0.75)',
              }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: T.textPrimary, marginBottom: 14 }}>Compliance Summary</p>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <svg viewBox="0 0 60 60" width={52} height={52} style={{ flexShrink: 0 }}>
                    <circle cx="30" cy="30" r="23" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="6" />
                    <circle cx="30" cy="30" r="23" fill="none" stroke="#16a34a" strokeWidth="6"
                      strokeDasharray={`${2 * Math.PI * 23 * 0.75} ${2 * Math.PI * 23 * 0.25}`}
                      transform="rotate(-90 30 30)" strokeLinecap="round" />
                    <text x="30" y="28" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="800" fontFamily="Inter,sans-serif">75%</text>
                    <text x="30" y="37" textAnchor="middle" fill="#9ca3af" fontSize="5.5" fontFamily="Inter,sans-serif">Score</text>
                  </svg>
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#16a34a' }}>On Track</p>
                    <p style={{ fontSize: 9.5, color: T.textSecondary }}>Compliance</p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {[
                    { label: 'General Liability',    status: 'Verified', ok: true  },
                    { label: 'Additional Insured',   status: 'Verified', ok: true  },
                    { label: 'Waiver of Subrogation',status: 'Verified', ok: true  },
                    { label: 'Workers Comp',         status: 'Missing',  ok: false },
                  ].map(item => (
                    <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                      <span style={{ fontSize: 10, color: T.textSecondary }}>{item.label}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                        {item.ok
                          ? <Check size={10} color="#16a34a" strokeWidth={2.5} />
                          : <X size={10} color="#ef4444" strokeWidth={2.5} />}
                        <span style={{ fontSize: 9, fontWeight: 600, color: item.ok ? '#16a34a' : '#ef4444' }}>{item.status}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                  <a href="#" style={{
                    fontSize: 11, fontWeight: 600, color: T.orange,
                    textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4,
                  }}>
                    View Full Report <ArrowRight size={11} />
                  </a>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── PRICING ───────────────────────────────────────────────────────── */}
      <section id="pricing" style={{
        background: 'linear-gradient(to bottom, #0d0d17 0%, #0a0a0f 55%)', borderTop: `1px solid ${T.borderSubtle}`,
        padding: 'clamp(72px, 9vw, 110px) 24px',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: T.orange, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 14 }}>
              PRICING
            </p>
            <h2 style={{
              fontSize: 'clamp(28px, 3.8vw, 46px)', fontWeight: 800,
              color: T.textPrimary, letterSpacing: '-1.5px', lineHeight: 1.1, marginBottom: 12,
            }}>
              Simple, transparent pricing.
            </h2>
            <p style={{ fontSize: 15, color: T.textSecondary }}>
              No contracts. No per-seat fees. Cancel anytime.
            </p>
          </div>

          <div
            className="pricing-grid"
            style={{ display: 'flex', gap: 20, alignItems: 'stretch' }}
          >
            {[
              {
                name: 'Starter', price: '$49', period: '/mo', cap: 'Up to 25 vendor COI reviews',
                popular: false, buttonLabel: 'Start Free Trial',
                href: 'https://buy.stripe.com/test_6oU6oH0yy69Z6PX7iTdMI02',
                solid: false,
                features: ['AI COI analysis', 'Vendor database', 'Basic reporting', 'Email support'],
              },
              {
                name: 'Pro', price: '$99', period: '/mo', cap: 'Up to 100 vendor COI reviews',
                popular: true, buttonLabel: 'Start Free Trial',
                href: 'https://buy.stripe.com/test_8x2dR9gxw8i7eip46HdMI01',
                solid: true,
                features: ['Everything in Starter', 'Expiration tracking', 'Advanced reporting', 'Priority support', 'Export data'],
              },
              {
                name: 'Business', price: '$149', period: '/mo', cap: 'Up to 250 vendor COI reviews',
                popular: false, buttonLabel: 'Start Free Trial',
                href: 'https://buy.stripe.com/test_5kQ00jfts8i78Y58mXdMI00',
                solid: false,
                features: ['Everything in Pro', 'Team access', 'Custom requirements', 'API access', 'Dedicated support'],
              },
            ].map(plan => (
              <div
                key={plan.name}
                style={{
                  flex: 1, position: 'relative',
                  background: T.card,
                  border: plan.popular ? `1.5px solid ${T.orange}` : `1px solid ${T.borderSubtle}`,
                  borderRadius: 16, padding: '32px 28px',
                  display: 'flex', flexDirection: 'column',
                  boxShadow: plan.popular ? `0 0 40px rgba(217,119,6,0.12)` : 'none',
                }}
              >
                {plan.popular && (
                  <div style={{
                    position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
                    background: T.orange, color: '#fff',
                    fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
                    padding: '4px 16px', borderRadius: 100, whiteSpace: 'nowrap',
                  }}>
                    MOST POPULAR
                  </div>
                )}

                <p style={{ fontSize: 12, fontWeight: 700, color: T.textMuted, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>
                  {plan.name}
                </p>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, marginBottom: 6 }}>
                  <span style={{ fontSize: 44, fontWeight: 800, color: T.textPrimary, letterSpacing: '-2px', lineHeight: 1 }}>
                    {plan.price}
                  </span>
                  <span style={{ fontSize: 14, color: T.textMuted, marginBottom: 6 }}>{plan.period}</span>
                </div>
                <p style={{ fontSize: 12, color: T.textMuted, marginBottom: 28 }}>{plan.cap}</p>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
                  {plan.features.map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Check size={14} color={T.orange} style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: 14, color: T.textSecondary }}>{f}</span>
                    </div>
                  ))}
                </div>

                <a
                  href={plan.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pricing-btn"
                  style={{
                    background: plan.solid ? T.orange : 'transparent',
                    color: plan.solid ? '#fff' : T.orange,
                    border: `1.5px solid ${T.orange}`,
                  }}
                  onMouseEnter={e => {
                    if (plan.solid) e.currentTarget.style.background = T.orangeHover
                    else { e.currentTarget.style.background = 'rgba(217,119,6,0.08)' }
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = plan.solid ? T.orange : 'transparent'
                  }}
                >
                  {plan.buttonLabel}
                </a>
              </div>
            ))}
          </div>

          <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: T.textMuted }}>
            All plans include a 14-day free trial — no credit card required.
          </p>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────────────────── */}
      <section id="about" style={{
        background: T.bg, borderTop: `1px solid ${T.borderSubtle}`,
        padding: 'clamp(80px, 11vw, 130px) 24px',
        textAlign: 'center', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 600, height: 600, borderRadius: '50%',
          background: 'rgba(217,119,6,0.10)',
          filter: 'blur(100px)',
          pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{
            fontSize: 'clamp(40px, 6vw, 72px)', fontWeight: 900,
            letterSpacing: '-2.5px', lineHeight: 1.04, marginBottom: 20,
          }}>
            <span style={{ display: 'block', color: T.textPrimary }}>Stop assuming.</span>
            <span style={{ display: 'block', color: T.orange }}>Start knowing.</span>
          </h2>
          <p style={{ fontSize: 16, color: T.textSecondary, lineHeight: 1.7, marginBottom: 36, maxWidth: 440, margin: '0 auto 36px' }}>
            Join property managers who verify vendor insurance the smart way.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center' }}>
            <Link href="/sign-up" className="btn-orange" style={{ fontSize: 16, padding: '16px 36px' }}>
              Get Started Free — No Credit Card Required
            </Link>
            <a
              href="https://calendly.com/charles-covira/30min"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                fontSize: 16, fontWeight: 600, padding: '16px 32px',
                borderRadius: 10, textDecoration: 'none',
                border: '1px solid rgba(217,119,6,0.45)',
                color: '#D97706',
                background: 'rgba(217,119,6,0.06)',
                transition: 'background 150ms ease, border-color 150ms ease, transform 150ms ease',
              }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.background = 'rgba(217,119,6,0.12)'; el.style.borderColor = 'rgba(217,119,6,0.7)'; el.style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.background = 'rgba(217,119,6,0.06)'; el.style.borderColor = 'rgba(217,119,6,0.45)'; el.style.transform = '' }}
            >
              Book a Demo Call
            </a>
          </div>
          <p style={{ fontSize: 13, color: T.textMuted, marginTop: 16 }}>
            Takes 60 seconds to set up. First 3 vendors always free.
          </p>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer style={{
        background: T.bg, borderTop: `1px solid ${T.borderSubtle}`,
        padding: '48px 24px 32px',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div
            className="footer-inner"
            style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 40, gap: 32 }}
          >
            {/* Logo + tagline */}
            <div>
              <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', marginBottom: 10 }}>
                <svg fill="none" viewBox="0 0 100 115" style={{ height: 26, width: 'auto', flexShrink: 0 }}>
                  <path d="M50 8C44 6 38 4 33 5C19 3 9 13 9 28L9 55C9 77 24 93 50 104C76 93 91 77 91 55L91 28C91 13 81 3 67 5C62 4 56 6 50 8Z" fill="#D97706"/>
                  <circle cx="50" cy="57" r="26" fill="rgba(0,0,0,0.82)"/>
                  <path d="M68 44A22 22 0 1 0 68 70L61 64A13 13 0 1 1 61 50Z" fill="#D97706"/>
                </svg>
                <span style={{ fontSize: 15, fontWeight: 800, color: '#ffffff', letterSpacing: '0.20em' }}>COVIRA</span>
              </Link>
              <p style={{ fontSize: 12, color: T.textMuted }}>Instant. Accurate. Compliant.</p>
            </div>

            {/* Center links */}
            <div className="footer-links" style={{ display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'center' }}>
              {[
                { label: 'Pricing',          href: '/pricing'      },
                { label: 'How It Works',     href: '#how-it-works' },
                { label: 'About',            href: '#about'        },
                { label: 'Demo',             href: '/demo'         },
                { label: 'Privacy Policy',   href: '#'             },
                { label: 'Terms of Service', href: '#'             },
              ].map(l => (
                <a
                  key={l.label}
                  href={l.href}
                  style={{ fontSize: 13, color: T.textMuted, textDecoration: 'none', transition: 'color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = T.textPrimary)}
                  onMouseLeave={e => (e.currentTarget.style.color = T.textMuted)}
                >
                  {l.label}
                </a>
              ))}
            </div>

            {/* Right */}
            <p style={{ fontSize: 12, color: T.textMuted, textAlign: 'right', whiteSpace: 'nowrap' }}>
              © 2026 Covira AI Inc.<br />All rights reserved.
            </p>
          </div>

          <div style={{ borderTop: `1px solid ${T.borderSubtle}`, paddingTop: 20 }}>
            <p style={{ fontSize: 11, color: T.textMuted, lineHeight: 1.6 }}>
              Covira&apos;s analysis is for informational purposes only and does not constitute legal or insurance advice.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
