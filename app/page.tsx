'use client'
import { useState } from 'react'
import Link from 'next/link'
import {
  Shield, Menu, X, Check, Users, AlertTriangle, Clock,
  CheckCircle2, ArrowRight, Upload, Zap, FileText,
} from 'lucide-react'

const T = {
  bg:            '#0a0a0f',
  surface:       '#0f0f17',
  card:          '#13131f',
  borderSubtle:  '#1a1a2e',
  borderAccent:  '#2a2a3e',
  orange:        '#D97706',
  orangeHover:   '#B45309',
  orangeGlow:    'rgba(217,119,6,0.15)',
  green:         '#22c55e',
  red:           '#dc2626',
  textPrimary:   '#f8f8f8',
  textSecondary: '#8b8fa8',
  textMuted:     '#4b5063',
}

export default function Home() {
  const [navOpen, setNavOpen] = useState(false)

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
          50%       { transform: translateY(-6px); }
        }
        @keyframes orange-btn-glow {
          0%, 100% { box-shadow: 0 4px 20px rgba(217,119,6,0.28); }
          50%       { box-shadow: 0 4px 32px rgba(217,119,6,0.55), 0 0 0 6px rgba(217,119,6,0.12); }
        }
        @keyframes particle-drift {
          0%   { transform: translate(0,0) scale(1); opacity: 0.6; }
          50%  { transform: translate(-12px,-18px) scale(1.2); opacity: 0.3; }
          100% { transform: translate(0,0) scale(1); opacity: 0.6; }
        }

        .hero-left  { animation: fade-in 0.5s ease forwards; }
        .hero-right { animation: slide-up 0.6s 0.15s ease both; }

        /* ── Nav link with orange underline slide-in ── */
        .nav-link {
          font-size: 14px; font-weight: 500;
          color: ${T.textSecondary}; text-decoration: none;
          position: relative; padding-bottom: 3px;
          transition: color 0.2s ease;
        }
        .nav-link::after {
          content: '';
          position: absolute; bottom: 0; left: 0;
          width: 100%; height: 1.5px;
          background: ${T.orange};
          transform: scaleX(0); transform-origin: left;
          transition: transform 0.2s ease;
        }
        .nav-link:hover { color: ${T.textPrimary}; }
        .nav-link:hover::after { transform: scaleX(1); }

        /* ── Buttons ── */
        .btn-orange {
          display: inline-flex; align-items: center; gap: 6px;
          background: ${T.orange}; color: #fff; font-weight: 600;
          font-size: 15px; padding: 13px 26px; border-radius: 10px;
          border: none; text-decoration: none;
          box-shadow: 0 4px 20px rgba(217,119,6,0.28);
          transition: background 0.2s, box-shadow 0.2s, transform 0.2s;
        }
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
          transition: background 0.2s, box-shadow 0.2s, transform 0.2s;
        }
        .btn-orange-sm:hover {
          background: ${T.orangeHover};
          box-shadow: 0 4px 20px rgba(217,119,6,0.40);
          transform: translateY(-1px);
        }

        .btn-ghost {
          display: inline-flex; align-items: center; gap: 6px;
          background: transparent; color: ${T.textSecondary}; font-weight: 500;
          font-size: 14px; padding: 8px 18px; border-radius: 8px;
          border: 1px solid ${T.borderAccent}; text-decoration: none;
          transition: border-color 0.2s, color 0.2s;
        }
        .btn-ghost:hover { border-color: ${T.orange}; color: ${T.textPrimary}; }

        .btn-ghost-lg {
          display: inline-flex; align-items: center; gap: 6px;
          background: transparent; color: ${T.textSecondary}; font-weight: 600;
          font-size: 15px; padding: 13px 26px; border-radius: 10px;
          border: 1px solid ${T.borderAccent}; text-decoration: none;
          transition: border-color 0.2s, color 0.2s;
        }
        .btn-ghost-lg:hover { border-color: ${T.orange}; color: ${T.textPrimary}; }

        /* ── Demo link — arrow slides right ── */
        .demo-link {
          font-size: 15px; font-weight: 600; color: ${T.orange};
          text-decoration: none; display: inline-flex; align-items: center; gap: 4px;
          border-bottom: 1px solid transparent; transition: border-color 0.2s, gap 0.2s;
        }
        .demo-link:hover { border-bottom-color: ${T.orange}; gap: 8px; }
        .demo-link .demo-arrow { transition: transform 0.2s ease; }
        .demo-link:hover .demo-arrow { transform: translateX(4px); }

        /* ── How it works cards ── */
        .card-hover { transition: border-color 0.2s, transform 0.2s; }
        .card-hover:hover { border-color: rgba(217,119,6,0.3) !important; transform: translateY(-2px); }

        /* ── Pricing buttons ── */
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
        background: 'rgba(10,10,15,0.88)',
        borderBottom: `1px solid ${T.borderSubtle}`,
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
      }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto', padding: '0 24px',
          height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          {/* Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="7" fill="rgba(217,119,6,0.12)" />
              <path d="M14 5L6 9v6c0 4.4 3.4 8.5 8 9.5 4.6-1 8-5.1 8-9.5V9L14 5z" fill="#D97706" fillOpacity="0.9"/>
              <path d="M11 14l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontSize: 16, fontWeight: 700, color: T.textPrimary, letterSpacing: '0.08em' }}>COVIRA</span>
          </Link>

          {/* Center nav — desktop */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }} className="desktop-nav">
            <Link href="/pricing" className="nav-link">Pricing</Link>
            <a href="#about" className="nav-link">About</a>
            <a href="#how-it-works" className="nav-link">How It Works</a>
            <Link href="/demo" className="nav-link">Demo</Link>
          </div>

          {/* Right — desktop */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }} className="desktop-nav">
            <Link href="/sign-in" className="btn-ghost">Log In</Link>
            <Link href="/demo" className="btn-orange-sm">Take Interactive Tour</Link>
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
            background: T.surface, borderTop: `1px solid ${T.borderSubtle}`,
            padding: '12px 24px 24px',
          }}>
            {[
              { label: 'Pricing',      href: '/pricing' },
              { label: 'About',        href: '#about' },
              { label: 'How It Works', href: '#how-it-works' },
              { label: 'Demo',         href: '/demo' },
            ].map(l => (
              <a
                key={l.label}
                href={l.href}
                onClick={() => setNavOpen(false)}
                style={{
                  display: 'block', color: T.textSecondary, fontSize: 15,
                  fontWeight: 500, padding: '14px 0',
                  borderBottom: `1px solid ${T.borderSubtle}`,
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
              <Link href="/demo" className="btn-orange" style={{ flex: 1, justifyContent: 'center', fontSize: 14 }}>Take Interactive Tour</Link>
            </div>
          </div>
        )}
      </nav>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section style={{
        minHeight: 'calc(100vh - 64px)',
        background: T.bg, padding: 'clamp(60px, 8vw, 100px) 24px',
        position: 'relative', overflow: 'hidden',
        display: 'flex', alignItems: 'center',
      }}>
        {/* BG grid */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: `linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px)`,
          backgroundSize: '56px 56px',
        }} />
        {/* Ambient glow */}
        <div style={{
          position: 'absolute', top: '20%', right: '-10%',
          width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(217,119,6,0.10) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />

        <div
          className="hero-grid"
          style={{
            maxWidth: 1200, margin: '0 auto', width: '100%',
            display: 'flex', alignItems: 'center', gap: 64,
            position: 'relative',
          }}
        >
          {/* LEFT — 55% */}
          <div className="hero-left" style={{ flex: '0 0 55%', maxWidth: '55%' }}>
            {/* Pill badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(217,119,6,0.08)', border: `1px solid rgba(217,119,6,0.2)`,
              borderRadius: 100, padding: '6px 14px', marginBottom: 32,
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.orange }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: T.orange, letterSpacing: '0.04em' }}>
                Trusted by property managers
              </span>
            </div>

            {/* Headline */}
            <h1 style={{
              fontSize: 'clamp(44px, 5.8vw, 72px)', fontWeight: 900,
              lineHeight: 1.04, letterSpacing: '-2.5px', marginBottom: 24,
            }}>
              <span style={{ display: 'block', color: T.textPrimary }}>Your vendors say</span>
              <span style={{ display: 'block', color: T.textPrimary }}>they&apos;re covered.</span>
              <span style={{ display: 'block', color: T.orange, fontStyle: 'italic' }}>Prove it.</span>
            </h1>

            {/* Subhead */}
            <p style={{
              fontSize: 18, color: T.textSecondary, lineHeight: 1.7,
              maxWidth: 480, marginBottom: 40,
            }}>
              One uninsured vendor. One incident. One lawsuit. Covira verifies vendor insurance
              instantly so you&apos;re never exposed.
            </p>

            {/* CTAs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', marginBottom: 40 }}>
              <Link href="/sign-up" className="btn-orange" style={{ fontSize: 16, padding: '14px 30px' }}>
                Start Verifying Free
              </Link>
              <Link href="/demo" className="demo-link">
                See a live demo <span className="demo-arrow"><ArrowRight size={15} /></span>
              </Link>
            </div>

            {/* Social proof */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
              fontSize: 13, color: T.textSecondary,
            }}>
              <span>✓ Free for up to 3 vendors</span>
              <span style={{ color: T.textMuted }}>·</span>
              <span>✓ No credit card required</span>
              <span style={{ color: T.textMuted }}>·</span>
              <span>✓ Results in under 15 seconds</span>
            </div>
          </div>

          {/* RIGHT — 45% — mini dashboard preview */}
          <div className="hero-right hero-right-wrap" style={{ flex: '0 0 45%', maxWidth: '45%', position: 'relative' }}>
            {/* Outer glow ring */}
            <div style={{
              position: 'absolute', inset: -24, borderRadius: 28,
              background: 'radial-gradient(ellipse, rgba(217,119,6,0.09) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />

            <div style={{
              background: '#0d0d16',
              border: '1px solid rgba(217,119,6,0.28)',
              borderRadius: 18,
              boxShadow: '0 32px 80px rgba(0,0,0,0.70), 0 0 0 1px rgba(217,119,6,0.06), 0 0 60px rgba(217,119,6,0.07)',
              overflow: 'hidden',
              position: 'relative',
              animation: 'float-card 5s ease-in-out infinite',
            }}>

              {/* Card header */}
              <div style={{
                background: '#0f0f1a',
                borderBottom: '1px solid rgba(217,119,6,0.15)',
                padding: '13px 18px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Shield size={12} color={T.orange} />
                  <span style={{ fontSize: 10, fontWeight: 800, color: T.textPrimary, letterSpacing: '0.12em' }}>COVIRA DASHBOARD</span>
                </div>
                <div style={{
                  background: 'rgba(34,197,94,0.10)', border: '1px solid rgba(34,197,94,0.25)',
                  borderRadius: 100, padding: '3px 10px',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}>
                  <div style={{
                    width: 5, height: 5, borderRadius: '50%', background: T.green,
                    animation: 'live-pulse 1.5s ease-in-out infinite',
                  }} />
                  <span style={{ fontSize: 9, fontWeight: 700, color: T.green, letterSpacing: '0.1em' }}>LIVE</span>
                </div>
              </div>

              <div style={{ padding: '16px 18px 18px' }}>

                {/* 2×2 metric grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                  {[
                    { label: 'Total Vendors', value: '42',  color: T.textPrimary,   Icon: Users         },
                    { label: 'Compliant',      value: '29',  color: T.green,         Icon: CheckCircle2  },
                    { label: 'Issues Found',   value: '9',   color: T.orange,        Icon: AlertTriangle },
                    { label: 'Expiring Soon',  value: '4',   color: '#fbbf24',       Icon: Clock         },
                  ].map(({ label, value, color, Icon }) => (
                    <div key={label} style={{
                      background: '#13131f', border: '1px solid #1a1a2e',
                      borderRadius: 10, padding: '11px 13px',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                      <div>
                        <div style={{ fontSize: 9, color: T.textMuted, fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1, letterSpacing: '-0.5px' }}>{value}</div>
                      </div>
                      <Icon size={14} color={color} style={{ opacity: 0.5 }} />
                    </div>
                  ))}
                </div>

                {/* Vendor rows */}
                <div style={{
                  background: '#13131f', border: '1px solid #1a1a2e',
                  borderRadius: 10, overflow: 'hidden', marginBottom: 12,
                }}>
                  {[
                    { name: 'ABC Plumbing LLC',   status: 'Issues Found', statusColor: T.orange, statusBg: 'rgba(217,119,6,0.10)', statusBorder: 'rgba(217,119,6,0.22)' },
                    { name: 'Summit Electric Co.', status: 'Compliant',    statusColor: T.green,  statusBg: 'rgba(34,197,94,0.09)',  statusBorder: 'rgba(34,197,94,0.22)' },
                    { name: 'Bluewater HVAC',      status: 'Compliant',    statusColor: T.green,  statusBg: 'rgba(34,197,94,0.09)',  statusBorder: 'rgba(34,197,94,0.22)' },
                  ].map((v, i) => (
                    <div key={v.name} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '9px 12px',
                      borderBottom: i < 2 ? '1px solid #1a1a2e' : 'none',
                    }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: T.textPrimary }}>{v.name}</span>
                      <span style={{
                        fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                        background: v.statusBg, color: v.statusColor, border: `1px solid ${v.statusBorder}`,
                        whiteSpace: 'nowrap',
                      }}>{v.status}</span>
                    </div>
                  ))}
                </div>

                {/* Bottom line */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <ArrowRight size={11} color={T.orange} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: T.orange }}>4 vendors need attention</span>
                </div>
              </div>

              {/* Orange particle glow — bottom right */}
              <div style={{
                position: 'absolute', bottom: -20, right: -20,
                width: 120, height: 120, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(217,119,6,0.18) 0%, transparent 70%)',
                pointerEvents: 'none',
                animation: 'particle-drift 6s ease-in-out infinite',
              }} />
              <div style={{
                position: 'absolute', bottom: 10, right: 10,
                width: 60, height: 60, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(217,119,6,0.10) 0%, transparent 70%)',
                pointerEvents: 'none',
                animation: 'particle-drift 4s 1s ease-in-out infinite',
              }} />
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST BAR ─────────────────────────────────────────────────────── */}
      <div style={{
        background: T.surface,
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
      <section style={{ background: T.bg, padding: 'clamp(72px, 9vw, 110px) 24px' }}>
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
        background: T.surface, borderTop: `1px solid ${T.borderSubtle}`,
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

      {/* ── PRICING ───────────────────────────────────────────────────────── */}
      <section id="pricing" style={{
        background: T.bg, borderTop: `1px solid ${T.borderSubtle}`,
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
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(217,119,6,0.10) 0%, transparent 70%)',
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
          <Link href="/sign-up" className="btn-orange" style={{ fontSize: 16, padding: '16px 36px' }}>
            Get Started Free — No Credit Card Required
          </Link>
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
                <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
                  <rect width="28" height="28" rx="7" fill="rgba(217,119,6,0.12)" />
                  <path d="M14 5L6 9v6c0 4.4 3.4 8.5 8 9.5 4.6-1 8-5.1 8-9.5V9L14 5z" fill="#D97706" fillOpacity="0.85"/>
                  <path d="M11 14l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span style={{ fontSize: 15, fontWeight: 700, color: T.textPrimary, letterSpacing: '0.07em' }}>COVIRA</span>
              </Link>
              <p style={{ fontSize: 12, color: T.textMuted }}>Instant. Accurate. Compliant.</p>
            </div>

            {/* Center links */}
            <div className="footer-links" style={{ display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'center' }}>
              {[
                { label: 'Pricing',         href: '/pricing' },
                { label: 'How It Works',    href: '#how-it-works' },
                { label: 'About',           href: '#about' },
                { label: 'Demo',            href: '/demo' },
                { label: 'Privacy Policy',  href: '#' },
                { label: 'Terms of Service',href: '#' },
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
