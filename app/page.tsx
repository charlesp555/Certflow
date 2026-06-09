'use client'
import { useState } from 'react'
import Link from 'next/link'
import {
  Shield, Menu, X, Check, AlertTriangle, CheckCircle2,
  ArrowRight, Upload, Zap, FileText,
} from 'lucide-react'

const T = {
  bg: '#0a0a0f',
  surface: '#0f0f17',
  card: '#13131f',
  borderSubtle: '#1a1a2e',
  borderAccent: '#2a2a3e',
  orange: '#D97706',
  orangeHover: '#B45309',
  orangeGlow: 'rgba(217,119,6,0.15)',
  green: '#16a34a',
  red: '#dc2626',
  textPrimary: '#f8f8f8',
  textSecondary: '#8b8fa8',
  textMuted: '#4b5063',
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

        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(220,38,38,0); }
          50% { box-shadow: 0 0 16px 4px rgba(220,38,38,0.18); }
        }
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

        .hero-left  { animation: fade-in 0.5s ease forwards; }
        .hero-right { animation: slide-up 0.6s 0.15s ease both; }
        .alert-card { animation: pulse-glow 3s ease-in-out infinite; }
        .success-card { animation: slide-up 0.7s 0.9s ease both; opacity: 0; }

        .nav-link {
          font-size: 14px; font-weight: 500;
          color: ${T.textSecondary}; text-decoration: none;
          transition: color 0.15s;
        }
        .nav-link:hover { color: ${T.textPrimary}; }

        .btn-orange {
          display: inline-flex; align-items: center; gap: 6px;
          background: ${T.orange}; color: #fff; font-weight: 600;
          font-size: 15px; padding: 13px 26px; border-radius: 10px;
          border: none; text-decoration: none;
          box-shadow: 0 4px 20px rgba(217,119,6,0.28);
          transition: background 0.15s, box-shadow 0.15s, transform 0.1s;
        }
        .btn-orange:hover {
          background: ${T.orangeHover};
          box-shadow: 0 6px 28px rgba(217,119,6,0.38);
          transform: translateY(-1px);
        }
        .btn-orange-sm {
          display: inline-flex; align-items: center; gap: 5px;
          background: ${T.orange}; color: #fff; font-weight: 600;
          font-size: 13px; padding: 9px 18px; border-radius: 8px;
          border: none; text-decoration: none;
          box-shadow: 0 2px 12px rgba(217,119,6,0.25);
          transition: background 0.15s;
        }
        .btn-orange-sm:hover { background: ${T.orangeHover}; }

        .btn-ghost {
          display: inline-flex; align-items: center; gap: 6px;
          background: transparent; color: ${T.textSecondary}; font-weight: 500;
          font-size: 14px; padding: 8px 18px; border-radius: 8px;
          border: 1px solid ${T.borderAccent}; text-decoration: none;
          transition: border-color 0.15s, color 0.15s;
        }
        .btn-ghost:hover { border-color: ${T.orange}; color: ${T.textPrimary}; }

        .btn-ghost-lg {
          display: inline-flex; align-items: center; gap: 6px;
          background: transparent; color: ${T.textSecondary}; font-weight: 600;
          font-size: 15px; padding: 13px 26px; border-radius: 10px;
          border: 1px solid ${T.borderAccent}; text-decoration: none;
          transition: border-color 0.15s, color 0.15s;
        }
        .btn-ghost-lg:hover { border-color: ${T.orange}; color: ${T.textPrimary}; }

        .card-hover { transition: border-color 0.2s, transform 0.2s; }
        .card-hover:hover { border-color: rgba(217,119,6,0.3) !important; transform: translateY(-2px); }

        .demo-link {
          font-size: 15px; font-weight: 600; color: ${T.orange};
          text-decoration: none; display: inline-flex; align-items: center; gap: 4px;
          border-bottom: 1px solid transparent; transition: border-color 0.15s;
        }
        .demo-link:hover { border-bottom-color: ${T.orange}; }

        @media (max-width: 1023px) {
          .hero-grid { flex-direction: column !important; }
          .hero-right-wrap { display: none !important; }
          .steps-connector { display: none !important; }
        }
        @media (max-width: 767px) {
          .problem-grid { flex-direction: column !important; }
          .pricing-grid { flex-direction: column !important; }
          .testimonial-grid { flex-direction: column !important; }
          .trust-pills { flex-wrap: wrap !important; gap: 10px !important; }
          .footer-inner { flex-direction: column !important; gap: 24px !important; }
          .footer-links { flex-wrap: wrap !important; gap: 14px !important; }
        }
      `}</style>

      {/* ── NAV ────────────────────────────────────────────────────── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(10,10,15,0.85)',
        borderBottom: `1px solid ${T.borderSubtle}`,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
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
            <Link href="/dashboard" className="nav-link">Product</Link>
            <Link href="/pricing" className="nav-link">Pricing</Link>
            <a href="#about" className="nav-link">About</a>
            <a href="#how-it-works" className="nav-link">How It Works</a>
          </div>

          {/* Right — desktop */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }} className="desktop-nav">
            <Link href="/sign-in" className="btn-ghost">Log In</Link>
            <Link href="/sign-up" className="btn-orange-sm">Get Started Free</Link>
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
              { label: 'Product', href: '/dashboard' },
              { label: 'Pricing', href: '/pricing' },
              { label: 'About', href: '#about' },
              { label: 'How It Works', href: '#how-it-works' },
            ].map(l => (
              <a
                key={l.label}
                href={l.href}
                onClick={() => setNavOpen(false)}
                style={{
                  display: 'block', color: T.textSecondary, fontSize: 15,
                  fontWeight: 500, padding: '14px 0',
                  borderBottom: `1px solid ${T.borderSubtle}`,
                }}
              >
                {l.label}
              </a>
            ))}
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <Link href="/sign-in" className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>Log In</Link>
              <Link href="/sign-up" className="btn-orange" style={{ flex: 1, justifyContent: 'center', fontSize: 14 }}>Get Started Free</Link>
            </div>
          </div>
        )}
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────── */}
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
              <Link href="/upload" className="demo-link">
                See a live demo <ArrowRight size={15} />
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

          {/* RIGHT — 45% */}
          <div className="hero-right hero-right-wrap" style={{ flex: '0 0 45%', maxWidth: '45%' }}>
            {/* Glow ring */}
            <div style={{
              position: 'absolute', inset: -32, borderRadius: 28,
              background: 'radial-gradient(ellipse, rgba(217,119,6,0.07) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />

            <div style={{
              background: T.card,
              border: `1px solid rgba(217,119,6,0.2)`,
              borderRadius: 16,
              boxShadow: '0 32px 80px rgba(0,0,0,0.65), 0 0 0 1px rgba(217,119,6,0.08)',
              overflow: 'hidden',
              position: 'relative',
            }}>
              {/* Card header */}
              <div style={{
                background: T.surface, borderBottom: `1px solid ${T.borderSubtle}`,
                padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Shield size={13} color={T.orange} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: T.textPrimary, letterSpacing: '0.1em' }}>
                    COVIRA COMPLIANCE ALERT
                  </span>
                </div>
                <div style={{
                  background: 'rgba(217,119,6,0.15)', border: `1px solid rgba(217,119,6,0.3)`,
                  borderRadius: 100, padding: '3px 10px',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}>
                  <div style={{
                    width: 5, height: 5, borderRadius: '50%', background: T.orange,
                    animation: 'live-pulse 1.5s ease-in-out infinite',
                  }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: T.orange, letterSpacing: '0.08em' }}>LIVE</span>
                </div>
              </div>

              <div style={{ padding: 18 }}>
                {/* Vendor info */}
                <div style={{ marginBottom: 14 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary }}>Pinnacle Roofing Inc.</p>
                  <p style={{ fontSize: 11, color: T.textMuted, marginTop: 3 }}>COI uploaded 2 minutes ago</p>
                </div>

                {/* Red alert */}
                <div
                  className="alert-card"
                  style={{
                    background: 'rgba(220,38,38,0.06)', border: `1px solid rgba(220,38,38,0.25)`,
                    borderRadius: 10, padding: '14px 16px', marginBottom: 14,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
                    <AlertTriangle size={14} color={T.red} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: T.red, letterSpacing: '0.08em' }}>
                      COVERAGE GAP DETECTED
                    </span>
                  </div>
                  {[
                    { label: 'General Liability: $500,000', note: 'BELOW MINIMUM' },
                    { label: 'Additional Insured:', note: 'NOT LISTED' },
                    { label: 'Waiver of Subrogation:', note: 'MISSING' },
                  ].map(item => (
                    <div key={item.label} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '5px 0', borderBottom: `1px solid rgba(220,38,38,0.12)`,
                      fontSize: 11,
                    }}>
                      <span style={{ color: T.textSecondary }}>{item.label}</span>
                      <span style={{
                        color: T.red, fontWeight: 700, fontSize: 10, letterSpacing: '0.05em',
                      }}>{item.note}</span>
                    </div>
                  ))}
                </div>

                {/* Send button */}
                <button style={{
                  width: '100%', padding: '10px', background: T.orange,
                  border: 'none', borderRadius: 8, color: '#fff',
                  fontSize: 13, fontWeight: 600, marginBottom: 14,
                  cursor: 'pointer', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: 6,
                  transition: 'background 0.15s',
                }}>
                  Send Vendor Request <ArrowRight size={13} />
                </button>

                {/* Green success card */}
                <div
                  className="success-card"
                  style={{
                    background: 'rgba(22,163,74,0.07)', border: `1px solid rgba(22,163,74,0.25)`,
                    borderRadius: 10, padding: '12px 14px',
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                  }}
                >
                  <CheckCircle2 size={16} color={T.green} style={{ marginTop: 1, flexShrink: 0 }} />
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: T.green }}>
                      Summit Electric Co. — Compliant
                    </p>
                    <p style={{ fontSize: 11, color: T.textMuted, marginTop: 3 }}>
                      All 5 requirements met · Expires Feb 2027
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST BAR ───────────────────────────────────────────────── */}
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

      {/* ── PROBLEM SECTION ─────────────────────────────────────────── */}
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
                  'You won\'t know there\'s a gap until someone gets hurt.',
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
                      <Check size={10} color={T.green} />
                    </div>
                    <p style={{ fontSize: 15, color: T.textSecondary, lineHeight: 1.6 }}>{item}</p>
                  </div>
                ))}
              </div>
              <Link href="/upload" className="btn-orange" style={{ alignSelf: 'flex-start' }}>
                See it in action <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────────── */}
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
            ].map(({ Icon, num, title, desc }, i) => (
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

      {/* ── PRICING ─────────────────────────────────────────────────── */}
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
                buttonStyle: 'outline',
                features: [
                  'AI COI analysis',
                  'Vendor database',
                  'Basic reporting',
                  'Email support',
                ],
              },
              {
                name: 'Pro', price: '$99', period: '/mo', cap: 'Up to 100 vendor COI reviews',
                popular: true, buttonLabel: 'Start Free Trial',
                href: 'https://buy.stripe.com/test_8x2dR9gxw8i7eip46HdMI01',
                buttonStyle: 'solid',
                features: [
                  'Everything in Starter',
                  'Expiration tracking',
                  'Advanced reporting',
                  'Priority support',
                  'Export data',
                ],
              },
              {
                name: 'Business', price: '$149', period: '/mo', cap: 'Up to 250 vendor COI reviews',
                popular: false, buttonLabel: 'Start Free Trial',
                href: 'https://buy.stripe.com/test_5kQ00jfts8i78Y58mXdMI00',
                buttonStyle: 'outline',
                features: [
                  'Everything in Pro',
                  'Team access',
                  'Custom requirements',
                  'API access',
                  'Dedicated support',
                ],
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
                  style={{
                    display: 'block', textAlign: 'center', padding: '12px',
                    borderRadius: 9, fontSize: 14, fontWeight: 600,
                    background: plan.buttonStyle === 'solid' ? T.orange : 'transparent',
                    color: plan.buttonStyle === 'solid' ? '#fff' : T.orange,
                    border: `1.5px solid ${T.orange}`,
                    transition: 'background 0.15s, color 0.15s',
                    textDecoration: 'none',
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

      {/* ── TESTIMONIALS ────────────────────────────────────────────── */}
      <section id="about" style={{
        background: T.surface, borderTop: `1px solid ${T.borderSubtle}`,
        padding: 'clamp(72px, 9vw, 110px) 24px',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <h2 style={{
              fontSize: 'clamp(26px, 3.5vw, 42px)', fontWeight: 800,
              color: T.textPrimary, letterSpacing: '-1.2px', marginBottom: 10,
            }}>
              Property managers trust Covira.
            </h2>
            <p style={{ fontSize: 15, color: T.textSecondary }}>Real feedback from real operators.</p>
          </div>

          <div
            className="testimonial-grid"
            style={{ display: 'flex', gap: 20, alignItems: 'stretch' }}
          >
            {[
              {
                quote: "We had a contractor working our properties for three months with a lapsed policy. We had no idea. Covira would have caught it on day one.",
                name: 'Marcus D.',
                role: 'Portfolio Manager, Greenway Properties',
              },
              {
                quote: "I manage 40 vendors across six properties. This used to take my assistant a full day every month. Now it takes ten minutes.",
                name: 'Sandra K.',
                role: 'Operations Director, Coastal PM Group',
              },
              {
                quote: "The plain-English reports are what got me. I'm not an insurance person. Now I don't need to be.",
                name: 'Tyler B.',
                role: 'Owner, Benchmark Property Management',
              },
            ].map((t, i) => (
              <div
                key={i}
                className="card-hover"
                style={{
                  flex: 1, background: T.card,
                  border: `1px solid ${T.borderSubtle}`,
                  borderRadius: 14, padding: '28px 24px',
                  display: 'flex', flexDirection: 'column',
                }}
              >
                <div style={{ display: 'flex', gap: 2, marginBottom: 18 }}>
                  {[...Array(5)].map((_, j) => (
                    <span key={j} style={{ color: T.orange, fontSize: 13 }}>★</span>
                  ))}
                </div>
                <p style={{
                  fontSize: 14, color: T.textSecondary, lineHeight: 1.8,
                  flex: 1, marginBottom: 24, fontStyle: 'italic',
                }}>
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div style={{ borderTop: `1px solid ${T.borderSubtle}`, paddingTop: 16 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: T.textPrimary }}>{t.name}</p>
                  <p style={{ fontSize: 12, color: T.textMuted, marginTop: 3 }}>{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ───────────────────────────────────────────────── */}
      <section style={{
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

      {/* ── FOOTER ──────────────────────────────────────────────────── */}
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
                { label: 'Product', href: '/dashboard' },
                { label: 'Pricing', href: '/pricing' },
                { label: 'How It Works', href: '#how-it-works' },
                { label: 'About', href: '#about' },
                { label: 'Privacy Policy', href: '#' },
                { label: 'Terms of Service', href: '#' },
              ].map(l => (
                <a
                  key={l.label}
                  href={l.href}
                  style={{ fontSize: 13, color: T.textMuted, textDecoration: 'none', transition: 'color 0.15s' }}
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
