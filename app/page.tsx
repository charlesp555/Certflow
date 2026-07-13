'use client'
import { useEffect, useRef, useState, type CSSProperties, type ElementType, type ReactNode } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X } from 'lucide-react'

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

// ── Hero subhead typewriter (ratified Bible override, owner decision 07/2026) ─
// Second sanctioned exception to §Motion ban #12, alongside the final-CTA
// line. Types ONCE on load, never loops; steady non-blinking cursor that
// vanishes on completion; prefers-reduced-motion shows the full sentence
// instantly. HERO_TYPE_MS is the single knob for typing speed — the final CTA
// runs at 19ms/char; the hero is deliberately slower and calmer.
const HERO_TYPE_MS = 38
const HERO_SUB = 'Every vendor COI verified against your insurance requirements. Coverage gaps explained in plain English before work begins.'

// ── Page ledger-grid (§12 sanctioned, single instance) ──────────────────────
// One continuous whisper-faint graph-paper layer behind the ENTIRE page —
// the only texture, visible only in the page's open space (sections with
// their own linework sit on opaque mats above it). This is the one knob:
// 0.045–0.08 is the visible whisper range (0.06 ≈ the original §12 grid's
// contrast; below ~0.04 the 1px ink-toned hairlines composite to under a
// 2% delta over carbon and vanish on real monitors).
const GRID_ALPHA = 0.07

// ── Hero evidence artifact data (Design Bible §Illustration & imagery) ──────
// Plausibility test: real-sounding trade LLC, real address format, real limit
// figures ($1M/$2M GL), real policy-number shapes, real date formats.
// "ABC Plumbing at 123 Main St" is banned. Hoisted to module scope so the
// static JSX isn't rebuilt per render (react-best-practices).
const CERT = {
  producer:    'Hartwell & Boyd Insurance Agency',
  insured:     'Calloway Mechanical Services LLC',
  insuredAddr: '4820 Industrial Pkwy, Ste 210, Cleveland, OH 44135',
  issued:      '06/30/2026',
}

// Stage 1 scan rows — each line resolves to its verification state as the
// scan head passes it. Verified lines get the orange stamp (§Color: orange is
// the moment something becomes verified, nothing else); failed lines carry
// --attention with the reason recorded as a datum (the expired date, the
// absence). Index order must match the .resolve-N keyframe timings in CSS.
type ScanRow = { coverage: string; policy?: string; detail: string; status: string; state: 'verified' | 'attention' }
const SCAN_ROWS: ScanRow[] = [
  { coverage: 'General Liability',    policy: 'GLP-7734921-02', detail: '$1,000,000 / $2,000,000', status: 'Verified',           state: 'verified'  },
  { coverage: 'Auto Liability',       policy: 'CA-8812305-01',  detail: '$1,000,000 CSL',          status: 'Verified',           state: 'verified'  },
  { coverage: 'Additional Insured',   policy: 'CG 20 10 04 13', detail: 'Endorsement attached',    status: 'Verified',           state: 'verified'  },
  { coverage: 'Workers Compensation',                           detail: 'Not on certificate',      status: 'Missing',            state: 'attention' },
  { coverage: 'Umbrella Liability',   policy: 'UMB-4471186-03', detail: '$5,000,000',              status: 'Expired 01/15/2026', state: 'attention' },
]

// ── Flow diagram data (Design Bible §The signature: ledger-set data IS
// verification). SINGLE SOURCE OF TRUTH for the "From certificate to verdict"
// section. Every coverage has exactly ONE status here; Stage 2 (the read) and
// Stage 3 (the verdict) both derive from this same array, so a coverage can
// never appear in two states — the old audit-trail/summary contradiction (WC
// shown Missing and Verified at once) is impossible by construction.
// Continues the Calloway Mechanical story from the hero artifact: same vendor,
// same missing Workers Compensation, here framed as the core transformation
// (certificate in → checked → verdict out). `found` is the neutral FACT read
// off the certificate; `status` is the JUDGMENT against your requirement —
// stage 2 states the fact, stage 3 renders the verdict, so no status color
// (orange/attention) appears until the verdict stage.
type FlowCheck = { coverage: string; required: string; found: string; status: 'Verified' | 'Missing'; state: 'verified' | 'attention' }
const FLOW_CHECKS: FlowCheck[] = [
  { coverage: 'General Liability',    required: '$1M / $2M', found: '$1M / $2M',    status: 'Verified', state: 'verified'  },
  { coverage: 'Auto Liability',       required: '$1M CSL',   found: '$1M CSL',      status: 'Verified', state: 'verified'  },
  { coverage: 'Additional Insured',   required: 'Required',  found: 'Endorsed',     status: 'Verified', state: 'verified'  },
  { coverage: 'Workers Compensation', required: 'Required',  found: 'Not provided', status: 'Missing',  state: 'attention' },
  { coverage: 'Expiration',           required: 'Current',   found: '06/30/2027',   status: 'Verified', state: 'verified'  },
]

// Verdict tally — COMPUTED from FLOW_CHECKS, never hand-typed, so the overall
// count can't drift out of sync with the per-coverage statuses.
const FLOW_VERIFIED = FLOW_CHECKS.filter(c => c.state === 'verified').length
const FLOW_FLAGGED  = FLOW_CHECKS.length - FLOW_VERIFIED

// Stage 1 input — the raw, unverified certificate. Mono policy numbers are the
// evidence texture (§The signature); no statuses appear here, it's the input.
const INPUT_POLICIES: { label: string; policy: string }[] = [
  { label: 'GL',   policy: 'GLP-7734921-02' },
  { label: 'AUTO', policy: 'CA-8812305-01'  },
  { label: 'AI',   policy: 'CG 20 10 04 13' },
]

// ── Compliance cycle stations (§Copywriting: consequence framing; the loop
// concept in Covira's ledger language — stations are numbered because the
// sequence is real and it returns to 01, which is the point). Station names
// are RECORDED (process states), descriptions are SAID. The only color is
// --attention on the caught gap (§Color: with its reason); nothing in the
// cycle is a verified state, so nothing here earns orange. ───────────────────
const CYCLE_STATIONS: { index: string; name: string; desc: string; flag?: boolean }[] = [
  { index: '01', name: 'Requirements set',     desc: 'Your coverage minimums, defined once.' },
  { index: '02', name: 'Certificate received', desc: 'Every vendor COI read against them.' },
  { index: '03', name: 'Gaps flagged',         desc: 'Missing or expired coverage caught.', flag: true },
  { index: '04', name: 'Vendor notified',      desc: 'Replacement requested automatically.' },
  { index: '05', name: 'Renewal tracked',      desc: 'Before each policy expires, the cycle runs again.' },
]

// ── Pricing plans (honest beta framing: Stripe is not live — plans are
// shown for transparency, every CTA joins the free beta; nothing implies a
// working paid checkout). Prices and vendor caps are DATA → rendered in the
// evidence face with tabular figures. `recommended` is OUR recommendation,
// stated as such — not "MOST POPULAR" (ban #6: implied crowd data we don't
// have; §Copywriting: claims require receipts). ──────────────────────────────
type Plan = { name: string; price: string; cap: string; features: string[]; recommended?: boolean }
const PLANS: Plan[] = [
  { name: 'Free',     price: '$0',   cap: 'Up to 3 vendors',   features: ['COI verification', 'Vendor database', 'Email support'] },
  { name: 'Starter',  price: '$49',  cap: 'Up to 25 vendors',  features: ['COI verification', 'Vendor database', 'Basic reporting', 'Email support'] },
  { name: 'Pro',      price: '$99',  cap: 'Up to 100 vendors', features: ['Everything in Starter', 'Expiration tracking', 'Advanced reporting', 'Priority support', 'Export data'], recommended: true },
  { name: 'Business', price: '$149', cap: 'Up to 250 vendors', features: ['Everything in Pro', 'Team access', 'Custom requirements', 'API access', 'Dedicated support'] },
]

// ── Key questions (Design Bible §Copywriting: direct, evidence-based, no
// hype; §Personality: confident not loud). Answers are the brand SAID; the
// two exact-dollar figures in the first answer are RECORDED (§Typography: the
// ledger voice — dollar limits are data, even mid-sentence), which is also
// the point of that answer, so the type does the arguing. Kept understated,
// like a reference document — no marketing gloss. ────────────────────────────
const FAQS: { q: string; a: ReactNode }[] = [
  {
    q: "Can't I just do this with ChatGPT or regular AI?",
    a: (
      <>
        Covira isn&apos;t a general chatbot. It&apos;s a verification engine tested against real ACORD certificates with known answers — it reads limits to the exact dollar (a <Recorded>$999,999</Recorded> limit fails a <Recorded>$1,000,000</Recorded> requirement), catches expired policies, and confirms endorsements on the actual policy. General AI guesses; Covira is built and tested to verify.
      </>
    ),
  },
  {
    q: 'How accurate is it?',
    a: 'Covira is stress-tested against hard, adversarial certificates with known-correct answers — including the traps that fool manual review (aggregate vs. per-occurrence limits, split-limit auto, expired coverage hiding behind current dates). It reads the actual document, shows what it found, and flags exactly what is missing.',
  },
  {
    q: 'What documents does it read?',
    a: 'ACORD 25 Certificates of Liability Insurance — the standard vendor compliance document. It checks General Liability, Auto, Workers Comp, Umbrella, Additional Insured, and Waiver of Subrogation against your requirements. Support for additional forms is added as customers need them.',
  },
  {
    q: 'Does it replace my property management software?',
    a: 'No — it fills the gap they leave. Your PM software stores certificates; Covira reads and verifies them. It works alongside whatever you already use.',
  },
  {
    q: 'How much does it cost?',
    a: 'Plans are per vendor, starting free for your first three. No sales call, no contract — you see the price and sign up. (Free during beta.)',
  },
  {
    q: 'Is this legal or insurance advice?',
    a: 'No. Covira reads and verifies certificates against your requirements — it is a tool for you, not legal or insurance advice. Final compliance decisions are yours.',
  },
]

// ── Two-voice typography components (Design Bible §Typography) ──────────────
// The reusable form of the two-voice rule. Prefer these over ad-hoc font-family
// declarations so the said/recorded split stays enforceable across the page.
//   <Said>     — Schibsted Grotesk. Everything the brand SAYS: headlines, body,
//                labels, buttons. Use `variant="headline"` for display type
//                (600 weight, tight tracking/leading) or the default for body.
//   <Recorded> — IBM Plex Mono, tabular figures. Everything the system RECORDS:
//                policy numbers, dates, dollar limits, statuses, timestamps,
//                vendor IDs. This is the ledger voice — it IS the verification.
type VoiceProps = {
  as?: ElementType
  className?: string
  style?: CSSProperties
  children: ReactNode
}

function Said({ as: Tag = 'span', variant, className = '', style, children }: VoiceProps & { variant?: 'headline' | 'body' }) {
  const base = variant === 'headline' ? 'voice-headline' : variant === 'body' ? 'voice-body' : 'voice'
  return <Tag className={`${base}${className ? ` ${className}` : ''}`} style={style}>{children}</Tag>
}

function Recorded({ as: Tag = 'span', className = '', style, children }: VoiceProps) {
  return <Tag className={`evidence${className ? ` ${className}` : ''}`} style={style}>{children}</Tag>
}

// ── The verification stamp (Design Bible §Iconography) ──────────────────────
// A drawn brand asset, deliberately distinct from a generic checkmark: an
// elongated auditor's tick with a heavier 2.6 stroke, squared terminals, and a
// mitered joint. Motion is applied by the parent (the scan cycle's resolve
// keyframes carry the Bible's stamp shape: 1.06 → 1.0, ~160ms, stops dead).
function VerifiedMark() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path
        d="M2 9.5 6.2 13.5 14.5 2.5"
        fill="none" stroke="var(--verified)"
        strokeWidth="2.6" strokeLinecap="square" strokeLinejoin="miter"
      />
    </svg>
  )
}

// The failed-verification mark — same drawn family as VerifiedMark
// (§Iconography: single family, squared terminals, heavier stroke), set in
// --attention. Used only beside a stated reason, never decoratively (§Color).
function FailMark() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path
        d="M3 3 13 13 M13 3 3 13"
        fill="none" stroke="var(--attention)"
        strokeWidth="2.6" strokeLinecap="square"
      />
    </svg>
  )
}

// ── Flow connector — a hairline seam arrow between the three stages ─────────
// Horizontal on desktop; the media query rotates it to point down when the
// stages stack on narrow screens. Purely structural (§Section transitions:
// structural, not decorative), so it stays out of the resolve choreography.
function FlowArrow() {
  return (
    <svg className="flow-arrow-svg" width="46" height="16" viewBox="0 0 46 16" aria-hidden="true">
      <path d="M0 8 H40" stroke="var(--seam)" strokeWidth="1.5" />
      <path d="M34 3 L40 8 L34 13" fill="none" stroke="var(--seam)" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" />
    </svg>
  )
}

// ── The flow diagram — "From certificate to verdict" ────────────────────────
// Replaces the old audit-trail + verification-summary pair, whose two views
// could disagree (WC Missing in the trail, Verified in the summary). This
// explains the product as a single left-to-right transformation:
//   input (raw COI)  →  read (checked against your requirements)  →  verdict.
// Every status is derived from FLOW_CHECKS, so the diagram cannot contradict
// itself. Own component (react-best-practices: re-render scope) so the phase
// state stays local. One orchestrated resolve on scroll-in, plays ONCE
// (§Motion: settle and stop dead, no loop); reduced motion rests at the
// resolved end state statically.
function FlowSection() {
  const stageRef = useRef<HTMLDivElement | null>(null)
  const [phase, setPhase] = useState<'idle' | 'running' | 'resolved'>('idle')

  useEffect(() => {
    // Reduced motion: the resolved diagram, statically — no staggered resolve
    // (§Motion: prefers-reduced-motion fully respected).
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setPhase('resolved')
      return
    }
    const el = stageRef.current
    if (!el) return
    // No IntersectionObserver (or SSR) → show the resolved state rather than a
    // blank section; the choreography is an enhancement, not a gate on content.
    if (!('IntersectionObserver' in window)) { setPhase('resolved'); return }
    // IntersectionObserver only — the native scroll is never touched. Fires
    // once when the diagram is ~30% visible, then disconnects (latch).
    const io = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) { setPhase('running'); io.disconnect(); break }
      }
    }, { threshold: 0.3 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const runClass = phase === 'running' ? ' is-running' : phase === 'resolved' ? ' is-resolved' : ''

  return (
    <>
      {/* Transparent over the root carbon (§7: one uniform ground). The three
          panels + connectors carry their own linework, so the diagram sits on
          an opaque carbon mat that blocks the page grid. */}
      <section style={{ borderTop: '1px solid var(--seam)', padding: 'clamp(72px, 9vw, 112px) 24px' }}>
        <div style={{ maxWidth: 'var(--content-max)', margin: '0 auto' }}>

          <Said as="h2" variant="headline" style={{ fontSize: 'clamp(25px, 3.2vw, 39px)', color: 'var(--ink-primary)', marginBottom: 14 }}>
            From certificate to verdict.
          </Said>
          <Said as="p" variant="body" style={{ color: 'var(--ink-secondary)', marginBottom: 48 }}>
            A vendor&apos;s certificate comes in. Covira checks every coverage against your requirements. You get one clear answer.
          </Said>

          <div ref={stageRef} className={`flow-diagram${runClass}`}>

            {/* ── STAGE 1 — INPUT: the raw, unverified certificate ─────────── */}
            <div className="flow-stage flow-input">
              <Said as="p" className="flow-cap">A vendor sends a certificate</Said>
              <div className="artifact flow-cert">
                <div className="flow-cert-body">
                  <Recorded as="p" style={{ fontSize: 10.5, letterSpacing: '0.07em', opacity: 0.6 }}>
                    CERTIFICATE OF LIABILITY INSURANCE
                  </Recorded>
                  <Recorded as="p" style={{ fontSize: 12.5, marginTop: 12 }}>{CERT.insured}</Recorded>
                  <div className="flow-cert-lines">
                    {INPUT_POLICIES.map(p => (
                      <div key={p.label} style={{ display: 'flex', gap: 10 }}>
                        <Recorded style={{ fontSize: 10.5, opacity: 0.5, minWidth: 34 }}>{p.label}</Recorded>
                        <Recorded style={{ fontSize: 11.5 }}>{p.policy}</Recorded>
                      </div>
                    ))}
                  </div>
                  <Recorded as="p" style={{ fontSize: 10.5, opacity: 0.55, marginTop: 12 }}>Issued {CERT.issued}</Recorded>
                </div>
              </div>
            </div>

            <div className="flow-connector"><FlowArrow /></div>

            {/* ── STAGE 2 — READ: checked against your requirements ─────────
                The intelligence. Each row states a fact read off the cert
                (`found`), matched to your `required` minimum. Values are
                NEUTRAL ink here — no orange/attention — because this stage
                reports what's on the certificate; the judgment is stage 3.
                The `found` column resolves one row at a time as the section
                scrolls in. */}
            <div className="flow-stage flow-process">
              <Said as="p" className="flow-cap">Covira checks it against your requirements</Said>
              <div className="flow-panel">
                <div className="flow-proc-head">
                  <Recorded>COVERAGE</Recorded>
                  <Recorded>REQUIRED</Recorded>
                  <Recorded>ON CERTIFICATE</Recorded>
                </div>
                {FLOW_CHECKS.map((c, i) => (
                  <div key={c.coverage} className="flow-proc-row">
                    <Recorded className="flow-cov">{c.coverage}</Recorded>
                    <Recorded className="flow-req">{c.required}</Recorded>
                    <Recorded className="flow-found" style={{ animationDelay: `${420 + i * 140}ms` }}>
                      {c.found}
                    </Recorded>
                  </div>
                ))}
              </div>
            </div>

            <div className="flow-connector"><FlowArrow /></div>

            {/* ── STAGE 3 — OUTPUT: the verdict ────────────────────────────
                The clear answer. Verified coverages get the orange stamp
                (§Color: orange is earned at the instant of verification);
                the flagged coverage carries --attention with its reason
                (the tally + the visible Missing row). Overall status lands
                last. Every status here reads from the SAME FLOW_CHECKS as
                stage 2 — no contradiction is possible. */}
            <div className="flow-stage flow-output">
              <Said as="p" className="flow-cap">You get a clear verdict</Said>
              <div className="flow-panel flow-verdict-panel">
                <div className="flow-overall" style={{ animationDelay: '2000ms' }}>
                  <Recorded style={{ fontSize: 11, letterSpacing: '0.07em', color: 'var(--attention)' }}>ACTION REQUIRED</Recorded>
                  <Recorded as="p" style={{ fontSize: 12, color: 'var(--ink-secondary)', marginTop: 6 }}>
                    {FLOW_VERIFIED} of {FLOW_CHECKS.length} verified · {FLOW_FLAGGED} flagged
                  </Recorded>
                </div>
                <div className="flow-verdict-list">
                  {FLOW_CHECKS.map((c, i) => (
                    <div key={c.coverage} className="flow-verdict-row">
                      <Said className="flow-vcov">{c.coverage}</Said>
                      {c.state === 'verified' ? (
                        <span className="flow-verdict status-cell" style={{ animationDelay: `${1200 + i * 150}ms` }}>
                          <VerifiedMark />
                          <Recorded style={{ fontSize: 12, color: 'var(--verified)', whiteSpace: 'nowrap' }}>Verified</Recorded>
                        </span>
                      ) : (
                        <span className="flow-verdict flow-verdict-flag status-cell" style={{ animationDelay: `${1200 + i * 150}ms` }}>
                          <FailMark />
                          <Recorded style={{ fontSize: 12, color: 'var(--attention)', whiteSpace: 'nowrap' }}>Missing</Recorded>
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
    </>
  )
}

// ── Compliance cycle — radial loop with a traveling reading head ─────────────
// Own component (react-best-practices: re-render scope) so the run/resolved
// phase state stays local. The head starts traveling when the stage is ~35%
// visible — otherwise the first revolution (the demonstration) would play
// off-screen. IntersectionObserver only; the scroll is never touched.
function CycleSection() {
  const stageRef = useRef<HTMLDivElement | null>(null)
  const [phase, setPhase] = useState<'idle' | 'running' | 'resolved'>('idle')

  useEffect(() => {
    // Reduced motion: the finished board, statically — all stations
    // recorded, gap flagged, no traveling point (§Motion).
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setPhase('resolved')
      return
    }
    const el = stageRef.current
    if (!el) return
    const io = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) { setPhase('running'); io.disconnect(); break }
      }
    }, { threshold: 0.35 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <>
      {/* ── THE COMPLIANCE CYCLE — radial rebuild. The previous vertical
          list read as a second timeline and didn't say "loop"; the ring
          does. Covira's version of a cycle diagram: seam ring, mono
          stations, quiet mono center — no orb, no gradient track, no
          cards, no arrows (§Components; §Background ban list). Orange
          appears ONLY as the traveling reading head (verification in
          motion); red only on the caught gap (§Color). Stations are
          fixed; only the head moves. id="how-it-works" preserved. */}
      {/* Transparent over the root carbon (§7: one uniform ground). The
          cycle ring/connectors are their own linework — the stage and the
          mobile list sit on opaque carbon mats that block the page grid. */}
      <section id="how-it-works" style={{ borderTop: '1px solid var(--seam)', padding: 'clamp(72px, 9vw, 112px) 24px' }}>
        <div style={{ maxWidth: 'var(--content-max)', margin: '0 auto' }}>

          <Said as="h2" variant="headline" style={{ fontSize: 'clamp(25px, 3.2vw, 39px)', color: 'var(--ink-primary)', marginBottom: 14 }}>
            Compliance is a cycle, not a checkbox.
          </Said>
          <Said as="p" variant="body" style={{ color: 'var(--ink-secondary)', marginBottom: 40 }}>
            Every renewal, every new vendor, every expiring policy — Covira reads it again.
          </Said>

          {/* Desktop: the radial stage */}
          <div
            ref={stageRef}
            className={`cycle-stage${phase === 'running' ? ' is-running' : ''}${phase === 'resolved' ? ' is-resolved' : ''}`}
          >
            <div className="cycle-ring" aria-hidden="true" />
            <div className="cycle-orbit" aria-hidden="true"><span className="cycle-point" /></div>
            <Recorded className="cycle-center">CONTINUOUS VERIFICATION</Recorded>
            {CYCLE_STATIONS.map((st, i) => (
              <div key={st.index} className={`cycle-st st-${i + 1}`}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                  <Recorded style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-secondary)' }}>{st.index}</Recorded>
                  <Recorded style={{ fontSize: 13.5, color: 'var(--ink-primary)' }}>{st.name}</Recorded>
                  {st.flag ? <span className="cycle-flag"><FailMark /></span> : null}
                </span>
                <Said as="p" style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--ink-secondary)', margin: '3px 0 0' }}>
                  {st.desc}
                </Said>
              </div>
            ))}
          </div>

          {/* Mobile: the compact ledger list (static — the radial stage
              needs width the small screens don't have) */}
          <div className="cycle-list">
            {CYCLE_STATIONS.map(st => (
              <div key={st.index} className="cycle-station">
                <Recorded style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-secondary)' }}>{st.index}</Recorded>
                <div>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                    <Recorded style={{ fontSize: 13.5, color: 'var(--ink-primary)' }}>{st.name}</Recorded>
                    {st.flag ? <FailMark /> : null}
                  </span>
                  <Said as="p" style={{ fontSize: 14.5, lineHeight: 1.55, color: 'var(--ink-secondary)', margin: '3px 0 0' }}>
                    {st.desc}
                  </Said>
                </div>
              </div>
            ))}
            <div className="cycle-station" style={{ borderBottom: 'none', paddingBottom: 4 }}>
              <Recorded style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-secondary)', opacity: 0.6 }}>→</Recorded>
              <Recorded style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-secondary)' }}>runs again from 01</Recorded>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

// ── Key questions — dropdown accordion ──────────────────────────────────────
// Own component (react-best-practices: re-render scope) so toggling a row
// re-renders only this section. Rows open independently — a reference document
// you can leave several entries open in, not a single-slot accordion. Native
// and accessible: each trigger is a real <button> with aria-expanded /
// aria-controls; the panel is a labelled region kept in the DOM (so it stays
// readable) and animated open with the CSS grid-rows 0fr→1fr technique —
// height settles on the --settle curve, no JS measurement, no bounce, and the
// global reduced-motion rule collapses it to an instant toggle. Dark evidence
// aesthetic: one graphite card, seam hairline dividers, a neutral plus that
// becomes a minus (§Color: no orange here — nothing is a verified state).
function FaqSection() {
  const [open, setOpen] = useState<Set<number>>(() => new Set())
  const toggle = (i: number) =>
    setOpen(prev => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })

  return (
    <>
      {/* Transparent over the root carbon (§7: one uniform ground). The
          accordion card is opaque graphite, so it covers the page grid. */}
      <section style={{ borderTop: '1px solid var(--seam)', padding: 'clamp(72px, 9vw, 112px) 24px' }}>
        <div style={{ maxWidth: 780, margin: '0 auto' }}>

          <Said as="h2" variant="headline" style={{ fontSize: 'clamp(25px, 3.2vw, 39px)', color: 'var(--ink-primary)', marginBottom: 14 }}>
            Key questions.
          </Said>
          <Said as="p" variant="body" style={{ color: 'var(--ink-secondary)', marginBottom: 40 }}>
            Straight answers, before you sign up.
          </Said>

          <div className="faq-list">
            {FAQS.map((item, i) => {
              const isOpen = open.has(i)
              return (
                <div className="faq-item" key={i}>
                  <button
                    type="button"
                    className="faq-q"
                    id={`faq-trigger-${i}`}
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${i}`}
                    onClick={() => toggle(i)}
                  >
                    <Said as="span" className="faq-q-text">{item.q}</Said>
                    <span className="faq-icon" aria-hidden="true" />
                  </button>
                  <div
                    className="faq-panel"
                    id={`faq-panel-${i}`}
                    role="region"
                    aria-labelledby={`faq-trigger-${i}`}
                    data-open={isOpen}
                  >
                    <div className="faq-panel-inner">
                      <Said as="p" className="faq-a">{item.a}</Said>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

        </div>
      </section>
    </>
  )
}

// ── Final CTA — the closer ───────────────────────────────────────────────────
// NOTE — ratified Bible override (owner decision, 07/2026): the subhead uses
// a typewriter effect, a one-off exception to §Motion ban #12. Built as the
// restrained version: types ONCE when scrolled into view (IntersectionObserver,
// latched, never loops), fast even pacing (~19ms/char ≈ 1.2s total), steady
// non-blinking cursor that vanishes on completion, zero layout shift (typed
// text overlays a hidden copy of the full line, so wrapping is identical).
// prefers-reduced-motion renders the full sentence instantly, no typing.
const CTA_LINE = 'Your first three vendors are free. Setup takes about a minute.'

function CtaSection() {
  const sectionRef = useRef<HTMLElement | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startedRef = useRef(false)
  const [typedCount, setTypedCount] = useState(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setTypedCount(CTA_LINE.length)
      return
    }
    const el = sectionRef.current
    if (!el) return
    const io = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting && !startedRef.current) {
          startedRef.current = true
          io.disconnect()
          intervalRef.current = setInterval(() => {
            setTypedCount(c => Math.min(c + 1, CTA_LINE.length))
          }, 19)
          break
        }
      }
    }, { threshold: 0.4 })
    io.observe(el)
    return () => {
      io.disconnect()
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  // stop the ticker once the line is complete
  useEffect(() => {
    if (typedCount >= CTA_LINE.length && intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [typedCount])

  const done = typedCount >= CTA_LINE.length

  return (
    <>
      {/* ── FINAL CTA — Design Bible rebuild ────────────────────────────────
          Deleted: "Stop assuming. Start knowing." (ban: "Stop X. Start Y."),
          "Join property managers who…" (implied social proof) + "the smart
          way" (banned phrase), the animated radial glow (§Background), the
          glowing primary button (§Buttons: flat fill only), old orange
          #D97706 → --verified. The closer states certainty quietly
          (§Emotional goals: certainty is the terminal emotion) — headline
          all ink, orange reserved for the one primary action. */}
      <section ref={sectionRef} id="about" style={{ borderTop: '1px solid var(--seam)', padding: 'clamp(88px, 12vw, 140px) 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <Said as="h2" variant="headline" style={{ fontSize: 'clamp(31px, 4.5vw, 49px)', color: 'var(--ink-primary)', marginBottom: 18 }}>
            Know exactly which vendors are covered.
          </Said>

          {/* Typed subhead — full text exposed to screen readers via
              aria-label; the visual typing is aria-hidden. The hidden copy
              reserves exact width/wrap so nothing shifts as it types. */}
          <p aria-label={CTA_LINE} style={{ margin: '0 0 36px' }}>
            <span aria-hidden="true" style={{ position: 'relative', display: 'inline-block' }}>
              <Said style={{ visibility: 'hidden', fontSize: 18, lineHeight: 1.6 }}>{CTA_LINE}</Said>
              <Said style={{ position: 'absolute', inset: 0, textAlign: 'left', fontSize: 18, lineHeight: 1.6, color: 'var(--ink-secondary)' }}>
                {CTA_LINE.slice(0, typedCount)}
                {!done && typedCount > 0 ? (
                  <span style={{ display: 'inline-block', width: 2, height: '1em', background: 'var(--ink-secondary)', verticalAlign: '-0.15em', marginLeft: 2 }} />
                ) : null}
              </Said>
            </span>
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
            <Link href="/sign-up" className="btn-verify">Verify your first certificate</Link>
            <a
              href="https://calendly.com/charles-covira/30min"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-quiet"
            >
              Book a demo
            </a>
          </div>
        </div>
      </section>
    </>
  )
}

// Typed hero subhead — same restrained construction as the CTA line: the
// visual typing is aria-hidden with the full text on the wrapper's aria-label,
// and a hidden copy of the complete sentence reserves exact width/wrap so
// nothing shifts as it types (zero layout shift). Starts on mount — the hero
// is above the fold, so "on load" and "scrolled into view" are the same event.
function HeroTypedSubhead() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [typedCount, setTypedCount] = useState(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setTypedCount(HERO_SUB.length)
      return
    }
    intervalRef.current = setInterval(() => {
      setTypedCount(c => Math.min(c + 1, HERO_SUB.length))
    }, HERO_TYPE_MS)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  // stop the ticker once the line is complete
  useEffect(() => {
    if (typedCount >= HERO_SUB.length && intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [typedCount])

  const done = typedCount >= HERO_SUB.length

  return (
    <p aria-label={HERO_SUB} style={{ margin: '0 0 36px' }}>
      <span aria-hidden="true" style={{ position: 'relative', display: 'inline-block' }}>
        <Said variant="body" style={{ visibility: 'hidden', display: 'inline-block' }}>{HERO_SUB}</Said>
        <Said variant="body" style={{ position: 'absolute', inset: 0, color: 'var(--ink-secondary)' }}>
          {HERO_SUB.slice(0, typedCount)}
          {!done && typedCount > 0 ? (
            <span style={{ display: 'inline-block', width: 2, height: '1em', background: 'var(--ink-secondary)', verticalAlign: '-0.15em', marginLeft: 2 }} />
          ) : null}
        </Said>
      </span>
    </p>
  )
}

export default function Home() {
  const [navOpen, setNavOpen] = useState(false)

  return (
    // Root — the ONE page ground: flat carbon edge to edge, every section
    // transparent over it (§7: no per-section shifts). position + isolation
    // let the .page-grid layer sit at z -1: above this background, below
    // ALL content.
    <div style={{ background: 'var(--carbon)', minHeight: '100vh', color: T.textPrimary, fontFamily: 'Inter, sans-serif', position: 'relative', isolation: 'isolate' }}>
      <div className="page-grid" aria-hidden="true" />
      <style>{`
        /* ── FONTS ─────────────────────────────────────────────────────────
           The two Covira voices (Schibsted Grotesk = SAID, IBM Plex Mono =
           RECORDED) are self-hosted via next/font in app/layout.tsx, which
           exposes them as --font-voice / --font-evidence on <html>. The
           .voice / .evidence classes below just consume those variables.
           Inter is retained via @import ONLY until the last legacy section is
           rebuilt, then it must be removed — it is not a Covira face. */
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        /* ── DESIGN TOKENS (Design Bible appendix) ─────────────────────────
           Single source of truth. Sections consume these as var(--token) from
           inline styles or classes — do not reintroduce a parallel JS palette. */
        :root {
          /* Color — carbon ground, orange earned, NO green/purple/glass */
          --carbon:        #0C0E12; /* primary ground, cold near-black */
          --graphite:      #171A21; /* raised surfaces: cards, nav */
          --seam:          #262B35; /* borders / hairlines */
          --ink-primary:   #F2F4F8; /* primary text */
          --ink-secondary: #9AA3B2; /* secondary text */
          --document:      #FAF9F6; /* evidence surfaces ONLY — warm paper */
          --document-ink:  #15181E; /* text on document surfaces */
          --verified:      #F97316; /* verification states, primary CTA, the stamp — nothing else */
          --attention:     #E5484D; /* failed verification / lapsed coverage — sparingly, with a reason */

          /* Two voices — supplied on <html> by next/font (app/layout.tsx):
             --font-voice = Schibsted Grotesk (SAID), --font-evidence = IBM Plex Mono (RECORDED). */

          /* Type scale — 1.25 ratio: 13 16 20 25 31 39 49 61 */
          --text-xs:   13px;
          --text-base: 16px; /* body baseline */
          --text-md:   20px;
          --text-lg:   25px;
          --text-xl:   31px;
          --text-2xl:  39px;
          --text-3xl:  49px;
          --text-4xl:  61px;

          /* Spacing & layout — base unit 4px, 24px component rhythm */
          --unit:          4px;
          --section-gap:   96px;   /* 96–128px between major sections */
          --gap-component: 24px;   /* 24–32px inside components */
          --radius:        8px;    /* the only radius */
          --content-max:   1120px; /* max content width */
          --measure:       68ch;   /* max text-column measure */

          /* Motion — things settle and stop DEAD; no bounce/spring */
          --settle-distance: 10px;                              /* 8–12px arrival */
          --settle:          200ms cubic-bezier(0.2,0.8,0.2,1); /* 180–240ms, ease-out, no overshoot */
          --stamp:           160ms ease-out;                    /* verified mark meeting paper */
        }

        /* ── TWO-VOICE TYPOGRAPHY (reusable) ───────────────────────────────
           .voice     → Schibsted Grotesk: headlines, body, labels, buttons.
           .evidence  → IBM Plex Mono, tabular figures: any real datum —
                        policy numbers, dates, dollar limits, statuses,
                        timestamps, vendor IDs. Never italic, never bold for
                        emphasis, never orange unless the datum is a verified
                        state. Reads like it was printed by a machine.
           Also exposed as <Said> / <Recorded> React components below. */
        .voice { font-family: var(--font-voice); }
        .voice-headline {
          font-family: var(--font-voice);
          font-weight: 600;            /* 500–700 range */
          letter-spacing: -0.02em;     /* tight tracking */
          line-height: 1.07;           /* 1.05–1.1 tight leading */
        }
        .voice-body {
          font-family: var(--font-voice);
          font-weight: 400;
          font-size: 18px; /* Bible body range is 16–18px; marketing surfaces use the 18px upper bound */
          line-height: 1.6;
          max-width: var(--measure);
        }
        .evidence {
          font-family: var(--font-evidence);
          font-style: normal;                 /* never italic */
          font-weight: 400;                    /* never bold for emphasis */
          font-variant-numeric: tabular-nums;  /* tabular figures */
          font-feature-settings: "tnum" 1;
          letter-spacing: 0;
        }

        /* ── MOTION PRIMITIVES (the settle + the stamp) ────────────────────
           Reusable arrival animations. One orchestrated moment per page max;
           apply deliberately when sections are built, not decoratively. */
        @keyframes settle {
          /* downward arrival per §Motion ("short downward ease-out") —
             starts above its resting place and settles down onto it */
          from { opacity: 0; transform: translateY(calc(-1 * var(--settle-distance))); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes stamp {
          from { opacity: 0; transform: scale(1.06); }
          to   { opacity: 1; transform: scale(1); }
        }
        /* settle-datum — the settle at datum scale (6px, 180ms) for small
           inline values that change state (counts, statuses). Same curve,
           same dead stop; distance reduced so a 13px datum doesn't lurch. */
        @keyframes settle-datum {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .settle       { animation: settle var(--settle) both; }
        .stamp        { animation: stamp var(--stamp) both; }
        .settle-datum { animation: settle-datum 180ms cubic-bezier(0.2,0.8,0.2,1) both; }

        /* ── PAGE LEDGER-GRID (§12 sanctioned) ─────────────────────────────
           The single continuous texture: 1px hairlines on the 24px rhythm,
           drawn with repeating-linear-gradient (a line-drawing tool, not a
           wash — washes stay banned). Absolute at z -1 inside the isolated
           root: above the carbon ground, below every piece of content.
           Sections carrying their own linework (audit trail, cycle) sit on
           opaque carbon mats that fully cover it — the grid shows only in
           the page's open space. Tune with GRID_ALPHA (top of file). */
        .page-grid {
          position: absolute; inset: 0; z-index: -1; pointer-events: none;
          --grid-line: rgba(154,163,178, ${GRID_ALPHA}); /* ink-toned hairline */
          background-image:
            repeating-linear-gradient(to bottom, var(--grid-line) 0, var(--grid-line) 1px, transparent 1px, transparent 24px),
            repeating-linear-gradient(to right,  var(--grid-line) 0, var(--grid-line) 1px, transparent 1px, transparent 24px);
        }

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        a { cursor: pointer; text-decoration: none; }
        button { cursor: pointer; }

        html { scroll-behavior: smooth; }

        /* ── HERO (Design Bible rebuild) ───────────────────────────────────
           Flat carbon ground — §Background bans mesh/aurora/radial/dot-grid.
           Buttons per §Component philosophy: primary = verified-orange fill
           with carbon text, the ONLY orange fill in the system; secondary =
           transparent + seam border. Focus ring = 1px ink, never orange glow
           (orange is earned). Hover = one-step surface shift, no lift. */
        .hero-shell {
          /* transparent over the root carbon — the page grid may show in the
             hero's open margins; the document artifact is opaque above it */
          padding: clamp(64px, 9vw, 112px) 24px;
        }
        .hero-grid {
          max-width: var(--content-max); margin: 0 auto;
          display: flex; align-items: center; gap: 56px;
        }
        .hero-copy { flex: 0 0 44%; max-width: 44%; }
        .hero-artifact-col { flex: 1 1 auto; min-width: 0; }

        .btn-verify {
          display: inline-flex; align-items: center; justify-content: center;
          background: var(--verified); color: var(--carbon);
          font-family: var(--font-voice); font-weight: 600; font-size: var(--text-base);
          padding: 13px 26px; border-radius: var(--radius);
          border: none; text-decoration: none;
          transition: background 150ms ease;
        }
        .btn-verify:hover { background: #E1660D; } /* one-step press shade — proposed token --verified-press */
        .btn-quiet {
          display: inline-flex; align-items: center; justify-content: center;
          background: transparent; color: var(--ink-primary);
          font-family: var(--font-voice); font-weight: 500; font-size: var(--text-base);
          padding: 13px 26px; border-radius: var(--radius);
          border: 1px solid var(--seam); text-decoration: none;
          transition: border-color 150ms ease;
        }
        .btn-quiet:hover { border-color: var(--ink-secondary); }
        .btn-verify:focus-visible, .btn-quiet:focus-visible {
          outline: 1px solid var(--ink-primary); outline-offset: 2px;
        }

        /* Evidence artifact — the one light surface (§The signature). Sits on
           the grid: no float, no tilt, no soft drop shadow. Hairlines are
           document-ink at low opacity (paper seams, not carbon seams). */
        .artifact {
          background: var(--document); color: var(--document-ink);
          border: 1px solid rgba(21,24,30,0.18);
          border-radius: var(--radius);
          padding: 24px;
        }
        .paper-hairline { border-top: 1px solid rgba(21,24,30,0.12); }

        /* ── STAGE 1 — the read (scanning certificate, plays ONCE) ─────────
           One shared 4.8s pass, run a single time on load: the scan head
           sweeps top→bottom over 0–58% (~2.8s, linear — calm, machine-
           paced), each row resolves as the head passes it, and the fully-
           read certificate then RESTS permanently (fill-mode: both holds the
           final frame). No loop — the page arc is tension → resolution →
           certainty, and certainty is a state, not a cycle (§Emotional
           goals; §Motion: things settle and stop dead). This one pass is the
           page's single orchestrated moment. Bible extension ratified this
           session: machine-work motion is exempt from the 400ms UI cap
           because it depicts the product working, not a UI transition. The
           scan head is INK, not orange — scanning is checking, not
           confirming; orange appears only at the instant a line resolves
           verified (§Color: orange is earned). Resolve timings
           (29/35/41/47/53%) approximate each row's vertical position × the
           58% sweep window on an even 6% cadence (~290ms between landings —
           one line resolving after another as the head descends); they must
           stay in SCAN_ROWS index order.
           STAMP FEEL (polish 2026-07-09): the ink arrives near-instantly
           (~29ms) at 1.055 scale, then PRESSES to 1.0 over ~130ms on a
           decelerating bezier (no overshoot — control ys ≤ 1) and stops
           dead. Appear + press ≈ 160ms = the --stamp token. Opacity leading
           scale is what makes it read as a stamp meeting paper rather than
           a fade-pop. Failure flags do NOT press — a failure is recorded,
           not stamped (§Color: --attention states, no ceremony); they keep
           a calm ~145ms fade.
           transform-only sweep = compositor-friendly (react-best-practices).
           prefers-reduced-motion: the global rule collapses every animation
           to its final frame — the resolved certificate, statically. */
        .scan-artifact { position: relative; overflow: hidden; }
        /* The reading head — softened (polish 2026-07-09): 1px edge at 30%
           ink with a taller, fainter approach gloss, so it reads as a line
           being READ, not a barcode laser. Pace unchanged: 4.8s linear,
           calm and machine-paced. */
        .scan-line {
          position: absolute; inset: 0; pointer-events: none;
          background: linear-gradient(to bottom, transparent calc(100% - 34px), rgba(21,24,30,0.04) 100%);
          border-bottom: 1px solid rgba(21,24,30,0.30);
          animation: scan-sweep 4.8s linear both;
        }
        @keyframes scan-sweep {
          0%   { transform: translateY(-100%); opacity: 0; }
          2%   { opacity: 1; }
          56%  { opacity: 1; }
          58%  { transform: translateY(0); opacity: 0; }
          100% { transform: translateY(0); opacity: 0; }
        }
        .status-cell {
          display: inline-flex; align-items: center; gap: 6px;
          justify-self: end;
        }
        /* Stamps press in on the settle bezier; flags fade on plain ease-out. */
        .resolve-1 { animation: resolve-stamp-1 4.8s cubic-bezier(0.16,1,0.3,1) both; }
        .resolve-2 { animation: resolve-stamp-2 4.8s cubic-bezier(0.16,1,0.3,1) both; }
        .resolve-3 { animation: resolve-stamp-3 4.8s cubic-bezier(0.16,1,0.3,1) both; }
        .resolve-4 { animation: resolve-flag-4  4.8s ease-out both; }
        .resolve-5 { animation: resolve-flag-5  4.8s ease-out both; }
        @keyframes resolve-stamp-1 { 0%, 29% { opacity: 0; transform: scale(1.06); } 29.6% { opacity: 1; transform: scale(1.055); } 32.3%, 100% { opacity: 1; transform: scale(1); } }
        @keyframes resolve-stamp-2 { 0%, 35% { opacity: 0; transform: scale(1.06); } 35.6% { opacity: 1; transform: scale(1.055); } 38.3%, 100% { opacity: 1; transform: scale(1); } }
        @keyframes resolve-stamp-3 { 0%, 41% { opacity: 0; transform: scale(1.06); } 41.6% { opacity: 1; transform: scale(1.055); } 44.3%, 100% { opacity: 1; transform: scale(1); } }
        @keyframes resolve-flag-4  { 0%, 47% { opacity: 0; } 50%, 100% { opacity: 1; } }
        @keyframes resolve-flag-5  { 0%, 53% { opacity: 0; } 56%, 100% { opacity: 1; } }

        /* ── Audit tag (evidence label) ────────────────────────────────────
           A mono, hairline-seam, SQUARE-cornered label (used by the pricing
           section's "FREE DURING BETA"). Bible extension ratified in-session:
           0 radius marks archival/evidence labels; the 8px token stays
           reserved for interactive components — radius encodes interactive
           vs archival. */
        .audit-tag {
          display: inline-block;
          border: 1px solid var(--seam);
          padding: 5px 10px;
          font-size: var(--text-xs);
          color: var(--ink-secondary);
          white-space: nowrap;
        }

        /* ── FLOW DIAGRAM — "From certificate to verdict" (Bible rebuild) ───
           Replaces the audit-trail/summary pair. Three stages left-to-right —
           input (warm document COI) → read (graphite check panel) → verdict
           (graphite result panel) — joined by hairline seam arrows. One
           orchestrated resolve on scroll-in: the certificate settles, the
           found column fills row by row, then the verdict stamps land and
           the overall status arrives last (§Motion: settle and stop dead, one
           moment, no loop). Opaque carbon mat — the panels/connectors are
           their own linework, so the page grid must not bleed through. */
        .flow-diagram {
          display: flex; align-items: stretch;
          gap: clamp(10px, 1.6vw, 20px);
          background: var(--carbon);
        }
        .flow-stage { display: flex; flex-direction: column; min-width: 0; }
        .flow-input   { flex: 0 0 clamp(220px, 22vw, 264px); }
        .flow-process { flex: 1 1 auto; }
        .flow-output  { flex: 0 0 clamp(248px, 26vw, 300px); }
        /* Stage caption (SAID). min-height aligns the three panel bodies even
           when captions wrap to different line counts. */
        .flow-cap {
          font-family: var(--font-voice); font-weight: 600;
          font-size: 14px; line-height: 1.3; color: var(--ink-primary);
          min-height: 38px; margin-bottom: 14px;
        }
        .flow-connector {
          display: flex; align-items: center; justify-content: center;
          flex: 0 0 auto; align-self: center;
        }
        .flow-arrow-svg { display: block; }

        /* Stage 1 — the warm document card (reuses .artifact). Height 100% so
           it matches the taller process panel; padding tightened for the
           compact input. */
        .flow-cert { height: 100%; padding: 16px; }
        .flow-cert-lines {
          margin-top: 12px; padding-top: 12px;
          border-top: 1px solid rgba(21,24,30,0.12);
          display: flex; flex-direction: column; gap: 7px;
        }

        /* Stage 2 & 3 — graphite record panels (§Components: graphite, seam
           border, 8px radius, no shadow, no hover lift). */
        .flow-panel {
          background: var(--graphite);
          border: 1px solid var(--seam);
          border-radius: var(--radius);
          padding: 18px; height: 100%;
        }
        .flow-proc-head, .flow-proc-row {
          display: grid;
          grid-template-columns: 1.4fr 0.9fr 1fr;
          gap: 12px; align-items: baseline;
        }
        .flow-proc-head { padding-bottom: 9px; border-bottom: 1px solid var(--seam); }
        .flow-proc-head .evidence {
          font-size: 10px; letter-spacing: 0.06em;
          color: var(--ink-secondary); opacity: 0.7;
        }
        .flow-proc-row { padding: 11px 0; border-bottom: 1px solid var(--seam); }
        .flow-proc-row:last-child { border-bottom: none; }
        .flow-cov { font-size: 12.5px; color: var(--ink-primary); }
        .flow-req { font-size: 12px; color: var(--ink-secondary); }
        .flow-found { font-size: 12px; color: var(--ink-primary); }

        /* Stage 3 — the verdict panel */
        .flow-verdict-panel { display: flex; flex-direction: column; }
        .flow-overall { padding-bottom: 14px; margin-bottom: 4px; border-bottom: 1px solid var(--seam); }
        .flow-verdict-row {
          display: flex; align-items: center; justify-content: space-between;
          gap: 10px; padding: 9px 0; border-bottom: 1px solid var(--seam);
        }
        .flow-verdict-row:last-child { border-bottom: none; }
        .flow-vcov { font-size: 13px; color: var(--ink-primary); }

        /* ── FLOW CHOREOGRAPHY ─────────────────────────────────────────────
           Idle: the resolving pieces are hidden until the section scrolls in.
           Running: staggered arrival (delays set inline per row) — the found
           values settle in, the verified verdicts PRESS the stamp shape, the
           flagged verdict fades (a failure is recorded, not stamped —
           §Color), overall status settles last. The both fill mode holds the 0%
           frame through each delay and the 100% frame after, so nothing
           flashes. Resolved / reduced motion: every piece at its final state,
           statically, with no animation. */
        .flow-cert-body, .flow-found, .flow-verdict, .flow-overall { opacity: 0; }
        .is-running .flow-cert-body { animation: flow-in 460ms cubic-bezier(0.2,0.8,0.2,1) 80ms both; }
        .is-running .flow-found     { animation: settle-datum 200ms cubic-bezier(0.2,0.8,0.2,1) both; }
        .is-running .flow-verdict   { animation: stamp var(--stamp) both; }
        .is-running .flow-verdict-flag { animation: flow-fade 200ms ease-out both; }
        .is-running .flow-overall   { animation: flow-in 320ms cubic-bezier(0.2,0.8,0.2,1) both; }
        .is-resolved .flow-cert-body,
        .is-resolved .flow-found,
        .is-resolved .flow-verdict,
        .is-resolved .flow-overall { opacity: 1; }
        @keyframes flow-in { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes flow-fade { from { opacity: 0; } to { opacity: 1; } }

        /* ── COMPLIANCE CYCLE — radial. The ring is a seam, not a glowing
           track; the center is a quiet mono label, not an orb; stations are
           type anchored around the ring, not cards (§Components). Bible
           extension ratified this session: the cycle ring is the page's
           ONLY perpetual motion — the section's claim is that verification
           repeats, so the traveling reading head IS the content, not
           decoration; stations never move or rotate. First revolution
           activates each station as the head passes (opacity-only settle —
           positioning transforms are never animated); stations then stay
           recorded and the head continues. Runs from ~35% visibility
           (IntersectionObserver — no scroll listeners). 12s/revolution:
           methodical sweep, not a spinner. prefers-reduced-motion →
           .is-resolved: finished board, static, no traveling point. */
        .cycle-stage {
          display: none;
          position: relative;
          width: min(660px, 100%);
          height: 560px;
          margin: 0 auto;
          /* opaque mat — ring + connectors are their own linework; the page
             grid must not bleed through behind them */
          background: var(--carbon);
        }
        .cycle-list { display: block; max-width: 720px; padding: 10px 0; background: var(--carbon); }
        @media (min-width: 768px) {
          .cycle-stage { display: block; }
          .cycle-list { display: none; }
        }
        .cycle-ring {
          position: absolute; left: 50%; top: 50%;
          width: 340px; height: 340px; margin: -170px 0 0 -170px;
          border: 1px solid var(--seam); border-radius: 50%;
        }
        .cycle-center {
          position: absolute; left: 50%; top: 50%;
          transform: translate(-50%, -50%);
          font-size: 11px; letter-spacing: 0.08em;
          color: var(--ink-secondary);
          text-align: center;
        }
        /* the reading head — a 6px verified point on the seam, no glow */
        .cycle-orbit {
          position: absolute; left: 50%; top: 50%;
          width: 0; height: 0; opacity: 0; pointer-events: none;
        }
        .cycle-point {
          position: absolute; left: -3px; top: -173px;
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--verified);
        }
        .is-running .cycle-orbit { opacity: 1; animation: cycle-orbit 12s linear infinite; }
        @keyframes cycle-orbit { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        /* stations — dim until the head passes (first revolution), then
           recorded for good. Angles: 01 top, then 72° steps clockwise;
           activation percentages = angle / 360. */
        .cycle-st { position: absolute; max-width: 190px; opacity: 0.45; }
        .st-1 { left: 50%; transform: translateX(-50%); top: 28px; text-align: center; }
        .st-2 { right: 8px;  top: 168px;   text-align: left;  }
        .st-3 { right: 56px; bottom: 34px; text-align: left;  }
        .st-4 { left: 56px;  bottom: 34px; text-align: right; }
        .st-5 { left: 8px;   top: 168px;   text-align: right; }
        .is-running .st-1 { animation: st-act-1 12s ease-out both; }
        .is-running .st-2 { animation: st-act-2 12s ease-out both; }
        .is-running .st-3 { animation: st-act-3 12s ease-out both; }
        .is-running .st-4 { animation: st-act-4 12s ease-out both; }
        .is-running .st-5 { animation: st-act-5 12s ease-out both; }
        @keyframes st-act-1 { 0%       { opacity: 0.45; }  2%, 100% { opacity: 1; } }
        @keyframes st-act-2 { 0%, 20%  { opacity: 0.45; } 22%, 100% { opacity: 1; } }
        @keyframes st-act-3 { 0%, 40%  { opacity: 0.45; } 42%, 100% { opacity: 1; } }
        @keyframes st-act-4 { 0%, 60%  { opacity: 0.45; } 62%, 100% { opacity: 1; } }
        @keyframes st-act-5 { 0%, 80%  { opacity: 0.45; } 82%, 100% { opacity: 1; } }
        /* the caught gap's mark appears only when the head reaches it */
        .cycle-flag { opacity: 0; display: inline-flex; }
        .is-running .cycle-flag { animation: cycle-flag-act 12s ease-out both; }
        @keyframes cycle-flag-act { 0%, 40% { opacity: 0; } 42%, 100% { opacity: 1; } }
        /* reduced motion / resolved: finished board, no traveling point */
        .is-resolved .cycle-st { opacity: 1; }
        .is-resolved .cycle-flag { opacity: 1; }
        .is-resolved .cycle-orbit { opacity: 0; }

        /* mobile fallback list rows (shared ledger row shape) */
        .cycle-station {
          display: grid;
          grid-template-columns: 40px 1fr;
          gap: clamp(12px, 2vw, 20px);
          align-items: baseline;
          padding: 14px 0;
          border-bottom: 1px solid var(--seam);
        }
        .cycle-station:last-child { border-bottom: none; }

        /* ── Nav link (Design Bible migration) — voice face, quiet pill
           highlight on hover: one-step seam tint + ink shift, 8px radius
           (interactive), no glow, no motion (§Components: hover = one-step
           surface shift, no lift). */
        .nav-link {
          font-family: var(--font-voice);
          font-size: 14px; font-weight: 500;
          color: var(--ink-secondary); text-decoration: none;
          display: inline-flex; align-items: center; gap: 3px;
          padding: 7px 12px; border-radius: var(--radius);
          transition: color 150ms ease, background 150ms ease;
        }
        .nav-link:hover { color: var(--ink-primary); background: rgba(38,43,53,0.55); } /* --seam @ 55% */
        .nav-link:focus-visible { outline: 1px solid var(--ink-primary); outline-offset: 2px; }

        /* ── Nav buttons (Design Bible migration) — the "Get Started" pair is
           the header's one orange fill: --verified with carbon text, flat, no
           glow/shimmer/lift (§Buttons: flat fill only; §Color: orange is
           earned). Hover = the same one-step press shade as .btn-verify. */
        .btn-orange, .btn-orange-sm {
          display: inline-flex; align-items: center; justify-content: center; gap: 6px;
          background: var(--verified); color: var(--carbon);
          font-family: var(--font-voice); font-weight: 600;
          border: none; text-decoration: none; border-radius: var(--radius);
          transition: background 150ms ease;
        }
        .btn-orange    { font-size: 15px; padding: 13px 26px; }
        .btn-orange-sm { font-size: 13px; padding: 9px 18px; }
        .btn-orange:hover, .btn-orange-sm:hover { background: #E1660D; } /* matches .btn-verify press shade */

        /* Log In — quiet secondary: seam border, ink shift on hover, no
           orange (orange is earned), no lift. */
        .btn-ghost {
          display: inline-flex; align-items: center; justify-content: center; gap: 6px;
          background: transparent; color: var(--ink-secondary);
          font-family: var(--font-voice); font-weight: 500;
          font-size: 14px; padding: 8px 18px; border-radius: var(--radius);
          border: 1px solid var(--seam); text-decoration: none;
          transition: border-color 150ms ease, color 150ms ease;
        }
        .btn-ghost:hover { border-color: var(--ink-secondary); color: var(--ink-primary); }
        .btn-ghost:focus-visible, .btn-orange:focus-visible, .btn-orange-sm:focus-visible {
          outline: 1px solid var(--ink-primary); outline-offset: 2px;
        }

        /* ── Footer link (Design Bible migration) — voice face, ink shift
           only. */
        .footer-link {
          font-family: var(--font-voice);
          font-size: var(--text-xs); color: var(--ink-secondary);
          text-decoration: none; transition: color 150ms ease;
        }
        .footer-link:hover { color: var(--ink-primary); }
        .footer-link:focus-visible { outline: 1px solid var(--ink-primary); outline-offset: 2px; }


        /* ── PRICING (Bible rebuild) — record cards: graphite, seam border,
           8px radius, no shadow, no hover lift (§Components). Opaque, so
           they cover the page grid themselves. The recommended plan is
           signaled structurally — a one-step stronger hairline + a stated
           mono label ("RECOMMENDED" is our claim and true; "MOST POPULAR"
           implies crowd data we don't have, ban #6). Feature bullets use a
           neutral 4px marker: a bullet is not a verified state, so no
           checkmark and no orange (§Color). */
        .plan-card {
          background: var(--graphite);
          border: 1px solid var(--seam);
          border-radius: var(--radius);
          padding: 24px;
          display: flex; flex-direction: column;
        }
        .plan-card.recommended { border-color: rgba(154,163,178,0.5); }
        .pricing-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
          align-items: stretch;
        }
        .plan-dot {
          width: 4px; height: 4px; flex-shrink: 0;
          background: var(--ink-secondary); opacity: 0.5;
        }

        /* ── KEY QUESTIONS accordion (Design Bible §Components) ─────────────
           One graphite record card, seam hairline dividers between rows, 8px
           radius (interactive). Triggers are full-width buttons; the answer
           panel animates open with grid-template-rows 0fr→1fr (height settles
           on the --settle curve, clipped by the inner overflow, no bounce).
           Expand indicator is a neutral plus that loses its vertical stroke to
           become a minus — no orange, no green (§Color: nothing here is a
           verified state). */
        .faq-list {
          background: var(--graphite);
          border: 1px solid var(--seam);
          border-radius: var(--radius);
          overflow: hidden; /* clip row corners to the card radius */
        }
        .faq-item + .faq-item { border-top: 1px solid var(--seam); }
        .faq-q {
          width: 100%;
          display: flex; align-items: center; justify-content: space-between; gap: 20px;
          background: transparent; border: none; text-align: left;
          padding: 20px 22px;
          transition: background 150ms ease;
        }
        .faq-q:hover { background: rgba(38,43,53,0.4); } /* --seam tint */
        .faq-q:focus-visible { outline: 1px solid var(--ink-primary); outline-offset: -2px; }
        .faq-q-text {
          font-family: var(--font-voice); font-weight: 500;
          font-size: 16px; line-height: 1.4; color: var(--ink-primary);
        }
        /* neutral plus → minus */
        .faq-icon { position: relative; width: 13px; height: 13px; flex-shrink: 0; }
        .faq-icon::before, .faq-icon::after {
          content: ''; position: absolute; background: var(--ink-secondary);
          transition: transform var(--settle), opacity var(--settle);
        }
        .faq-icon::before { left: 0; top: 6px; width: 13px; height: 1.5px; }  /* horizontal bar */
        .faq-icon::after  { left: 6px; top: 0; width: 1.5px; height: 13px; }  /* vertical bar */
        .faq-q[aria-expanded="true"] .faq-icon::after { transform: scaleY(0); opacity: 0; }
        /* answer panel — grid-rows collapse, clipped by the inner wrapper */
        .faq-panel {
          display: grid; grid-template-rows: 0fr;
          transition: grid-template-rows var(--settle);
        }
        .faq-panel[data-open="true"] { grid-template-rows: 1fr; }
        .faq-panel-inner { overflow: hidden; }
        .faq-a {
          font-family: var(--font-voice); font-weight: 400;
          font-size: 15px; line-height: 1.6; color: var(--ink-secondary);
          padding: 0 22px 22px; max-width: 64ch;
        }

        /* ── Responsive ── */
        @media (max-width: 1023px) {
          /* Flow diagram stacks; connectors rotate to point down */
          .flow-diagram { flex-direction: column; }
          .flow-input, .flow-process, .flow-output { flex: 1 1 auto; width: 100%; }
          .flow-cap { min-height: 0; margin-bottom: 12px; }
          .flow-connector { align-self: center; padding: 2px 0; }
          .flow-connector .flow-arrow-svg { transform: rotate(90deg); }
          .pricing-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .hero-grid { flex-direction: column; align-items: flex-start; }
          .hero-copy { flex: 1 1 auto; max-width: 640px; }
          /* the evidence artifact is the signature — it stays on mobile */
          .hero-artifact-col { width: 100%; max-width: 600px; }
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
        @media (max-width: 767px) {
          .pricing-grid { grid-template-columns: 1fr; max-width: 440px; }
          .footer-inner { flex-direction: column !important; gap: 24px !important; }
          .footer-links { flex-wrap: wrap !important; gap: 14px !important; }
          .footer-copyright { text-align: left !important; white-space: normal !important; }
        }
        @media (max-width: 479px) {
          .hero-ctas { flex-direction: column !important; align-items: stretch !important; }
          .hero-ctas .btn-verify, .hero-ctas .btn-quiet { justify-content: center; }
          /* Process panel: drop the REQUIRED column so coverage + what's on
             the certificate stay readable on the narrowest screens */
          .flow-proc-head, .flow-proc-row { grid-template-columns: 1.3fr 1fr; }
          .flow-req, .flow-proc-head .evidence:nth-child(2) { display: none; }
        }

        /* ── Accessibility: reduced motion fully respected (Design Bible
           §Motion) — settle and stamp collapse to instant state changes. */
        @media (prefers-reduced-motion: reduce) {
          html { scroll-behavior: auto; }
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>

      {/* ── NAV — Design Bible migration ──────────────────────────────────
          Translucent graphite bar floating over the carbon ground: graphite
          @ 80% + backdrop blur, hairline seam beneath. All text in the voice
          face; the logo is the real shield-C mark (public/covira-logo.png). */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(23,26,33,0.8)', /* --graphite @ 80% */
        borderBottom: '1px solid var(--seam)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto', padding: '0 24px',
          height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          {/* Logo — the real shield-C mark (public/covira-logo.png).
              next/image serves 1x/2x variants from the 1254px source, so it
              stays crisp on retina. alt="" — the wordmark carries the name. */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <Image src="/covira-logo.png?v=3" alt="" width={44} height={44} priority style={{ flexShrink: 0 }} />
            <Said style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-primary)', letterSpacing: '0.20em' }}>COVIRA</Said>
          </Link>

          {/* Center nav — desktop. Gap 8 + 12px link padding ≈ the old 32px
              rhythm, so the hover pill doesn't inflate the spacing. */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} className="desktop-nav">
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
            aria-expanded={navOpen}
            style={{
              display: 'none', background: 'none',
              border: '1px solid var(--seam)', borderRadius: 'var(--radius)',
              width: 40, height: 40, alignItems: 'center', justifyContent: 'center',
              color: 'var(--ink-primary)',
            }}
            className="mobile-menu-btn"
          >
            {navOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Mobile dropdown */}
        {navOpen && (
          <div style={{
            background: 'var(--graphite)', borderTop: '1px solid var(--seam)',
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
                  display: 'block', fontFamily: 'var(--font-voice)',
                  color: 'var(--ink-secondary)', fontSize: 15,
                  fontWeight: 500, padding: '14px 0',
                  borderBottom: '1px solid var(--seam)',
                  transition: 'color 150ms ease',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--ink-primary)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--ink-secondary)')}
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

      {/* ── HERO — Design Bible rebuild ───────────────────────────────────
          Flat carbon, no mesh/dots/glow (§Background). Left: the thesis, all
          ink-primary in the voice face — orange is reserved for the one
          primary action and the stamps (§Color: orange is earned). Right: the
          evidence artifact — a certificate treated as a legal exhibit on the
          one permitted light surface, sitting on the grid, unrotated, no soft
          shadow (§The signature; §Spacing: floating is banned). The stamps
          landing on verified rows are this page's single orchestrated motion
          moment (§Motion: one per page max). */}
      <section className="hero-shell">
        <div className="hero-grid">

          {/* Thesis column — everything here is SAID (Schibsted), except the
              proof line, which is RECORDED (mono): it names actual checks. */}
          <div className="hero-copy">
            {/* Two beats, all ink-primary — orange is earned by verification,
                never by headlines (§Color). Confidence is carried by the full
                stop and the short second beat, not by color (§Personality:
                confident not loud). */}
            <Said as="h1" variant="headline" style={{ fontSize: 'clamp(31px, 4.4vw, 49px)', color: 'var(--ink-primary)', marginBottom: 20 }}>
              Your property software stores certificates. Covira verifies them.
            </Said>
            <HeroTypedSubhead />
            <div className="hero-ctas" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link href="/sign-up" className="btn-verify">Verify a certificate</Link>
              <a href="#how-it-works" className="btn-quiet">See how it works</a>
            </div>
            <Recorded as="p" style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-secondary)', marginTop: 24 }}>
              Example check: GL limits · additional insured · waiver · expiration
            </Recorded>
          </div>

          {/* Evidence artifact — the certificate being READ, once. The
              artifact settles (200ms), the ink scan head sweeps down a single
              time, each line resolves under it (verified = orange stamp,
              failed = attention flag), and the resolved certificate rests as
              the permanent state — the audit that already happened and came
              back clean. Reduced motion shows the resolved state statically
              via the global rule. */}
          <div className="hero-artifact-col settle">
            <div className="artifact scan-artifact">
              <div className="scan-line" aria-hidden="true" />

              {/* Document header */}
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, paddingBottom: 10, borderBottom: '1px solid rgba(21,24,30,0.35)' }}>
                <Recorded style={{ fontSize: 11, letterSpacing: '0.08em' }}>CERTIFICATE OF LIABILITY INSURANCE</Recorded>
                <Recorded style={{ fontSize: 11 }}>{CERT.issued}</Recorded>
              </div>

              {/* Parties */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '12px 0' }}>
                <div style={{ display: 'flex', gap: 10 }}>
                  <Recorded style={{ fontSize: 11, opacity: 0.55, minWidth: 66 }}>PRODUCER</Recorded>
                  <Recorded style={{ fontSize: 13 }}>{CERT.producer}</Recorded>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <Recorded style={{ fontSize: 11, opacity: 0.55, minWidth: 66 }}>INSURED</Recorded>
                  <div>
                    <Recorded as="p" style={{ fontSize: 13 }}>{CERT.insured}</Recorded>
                    <Recorded as="p" style={{ fontSize: 13, opacity: 0.75 }}>{CERT.insuredAddr}</Recorded>
                  </div>
                </div>
              </div>

              {/* Scan ledger — row seams only, no zebra (§Tables/ledgers).
                  Each row's status cell resolves as the scan head passes it;
                  .resolve-N timing must match SCAN_ROWS index order. */}
              <div className="paper-hairline" style={{ paddingTop: 10 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.2fr 1fr', gap: 8, paddingBottom: 6 }}>
                  <Recorded style={{ fontSize: 11, opacity: 0.55, letterSpacing: '0.06em' }}>COVERAGE</Recorded>
                  <Recorded style={{ fontSize: 11, opacity: 0.55, letterSpacing: '0.06em' }}>LIMIT / DETAIL</Recorded>
                  <Recorded style={{ fontSize: 11, opacity: 0.55, letterSpacing: '0.06em', textAlign: 'right' }}>STATUS</Recorded>
                </div>
                {SCAN_ROWS.map((row, i) => (
                  <div key={row.coverage} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.2fr 1fr', gap: 8, alignItems: 'center', padding: '8px 0', borderTop: '1px solid rgba(21,24,30,0.10)' }}>
                    <div>
                      <Recorded as="p" style={{ fontSize: 12.5 }}>{row.coverage}</Recorded>
                      {row.policy ? <Recorded as="p" style={{ fontSize: 10.5, opacity: 0.55 }}>{row.policy}</Recorded> : null}
                    </div>
                    <Recorded style={{ fontSize: 12 }}>{row.detail}</Recorded>
                    <span className={`status-cell resolve-${i + 1}`}>
                      {row.state === 'verified' ? <VerifiedMark /> : null}
                      <Recorded style={{ fontSize: 12, color: row.state === 'verified' ? 'var(--verified)' : 'var(--attention)', whiteSpace: 'nowrap' }}>
                        {row.status}
                      </Recorded>
                    </span>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </div>
      </section>

      <FlowSection />

      <CycleSection />

      {/* ── PRICING — Bible rebuild + honest beta framing ───────────────────
          Deleted: "MOST POPULAR" badge (ban #6), colored checkmark bullets
          (unearned color, §5), gradient background, hover-lift buttons,
          Stripe checkout links (Stripe is NOT live — implying a working
          paid checkout would be a false claim, §Copywriting). Plans stay
          visible for transparency; every CTA joins the free beta, which is
          real. Prices/caps are DATA → evidence face, tabular figures. */}
      <section id="pricing" style={{ borderTop: '1px solid var(--seam)', padding: 'clamp(72px, 9vw, 112px) 24px' }}>
        <div style={{ maxWidth: 'var(--content-max)', margin: '0 auto' }}>

          <Said as="h2" variant="headline" style={{ fontSize: 'clamp(25px, 3.2vw, 39px)', color: 'var(--ink-primary)', marginBottom: 14 }}>
            Priced per vendor. No sales call, no contract.
          </Said>

          {/* Honest beta note — the plans are what launch will cost; today
              everything is free. Squared audit tag, not a marketing pill. */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 44 }}>
            <Recorded className="audit-tag" style={{ color: 'var(--ink-primary)' }}>FREE DURING BETA</Recorded>
            <Said style={{ fontSize: 15, color: 'var(--ink-secondary)' }}>
              Every plan is free while Covira is in beta — this is what they&apos;ll cost at launch.
            </Said>
          </div>

          <div className="pricing-grid">
            {PLANS.map(plan => (
              <div key={plan.name} className={plan.recommended ? 'plan-card recommended' : 'plan-card'}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, marginBottom: 18 }}>
                  <Said style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-primary)' }}>{plan.name}</Said>
                  {plan.recommended ? (
                    <Recorded style={{ fontSize: 10.5, letterSpacing: '0.08em', color: 'var(--ink-secondary)' }}>RECOMMENDED</Recorded>
                  ) : null}
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginBottom: 4 }}>
                  <Recorded style={{ fontSize: 'var(--text-2xl)', color: 'var(--ink-primary)', lineHeight: 1 }}>{plan.price}</Recorded>
                  <Recorded style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-secondary)' }}>/mo at launch</Recorded>
                </div>
                <Recorded as="p" style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-secondary)', margin: '0 0 20px' }}>{plan.cap}</Recorded>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24, flex: 1, paddingTop: 14, borderTop: '1px solid var(--seam)' }}>
                  {plan.features.map(f => (
                    <span key={f} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className="plan-dot" />
                      <Said style={{ fontSize: 13.5, color: 'var(--ink-secondary)' }}>{f}</Said>
                    </span>
                  ))}
                </div>

                {/* The label says what happens: joining the beta is real;
                    "Start Free Trial" into a dead Stripe checkout is not.
                    One orange fill in the section (§Buttons). */}
                <Link
                  href="/sign-up"
                  className={plan.recommended ? 'btn-verify' : 'btn-quiet'}
                  style={{ width: '100%', fontSize: 14, padding: '11px 16px' }}
                >
                  Join the beta
                </Link>
              </div>
            ))}
          </div>

          <Recorded as="p" style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-secondary)', marginTop: 20 }}>
            No credit card required during beta.
          </Recorded>
        </div>
      </section>

      <FaqSection />

      <CtaSection />

      {/* ── FOOTER — Design Bible migration ───────────────────────────────
          Bookends the nav: the SAME surface treatment — translucent --graphite
          @ 80% + 16px backdrop-blur + a hairline --seam edge (on top here,
          mirroring the nav's bottom edge) — so the top and bottom of the page
          read as one system. Voice face throughout; the logo is the real
          shield-C mark, same lockup as the nav. Tagline is a plain descriptor
          (the old tricolon is banned §14) — the last live instance lived in
          layout.tsx's openGraph description, fixed alongside this. */}
      <footer style={{
        borderTop: '1px solid var(--seam)',
        background: 'rgba(23,26,33,0.8)', /* --graphite @ 80% — matches the nav */
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        padding: '48px 24px 32px',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div
            className="footer-inner"
            style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 40, gap: 32 }}
          >
            {/* Logo + descriptor */}
            <div>
              <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 10 }}>
                <Image src="/covira-logo.png?v=3" alt="" width={40} height={40} style={{ flexShrink: 0 }} />
                <Said style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-primary)', letterSpacing: '0.20em' }}>COVIRA</Said>
              </Link>
              <Said as="p" style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-secondary)', maxWidth: '32ch', lineHeight: 1.5 }}>
                Vendor insurance verification for property managers.
              </Said>
            </div>

            {/* Center links */}
            <div className="footer-links" style={{ display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'center' }}>
              {[
                { label: 'Pricing',          href: '/pricing'      },
                { label: 'How It Works',     href: '#how-it-works' },
                { label: 'About',            href: '#about'        },
                { label: 'Demo',             href: '/demo'         },
                { label: 'Privacy Policy',   href: '/privacy'      },
                { label: 'Terms of Service', href: '/terms'        },
              ].map(l => (
                <a key={l.label} href={l.href} className="footer-link">
                  {l.label}
                </a>
              ))}
            </div>

            {/* Right */}
            <Said as="p" className="footer-copyright" style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-secondary)', textAlign: 'right', whiteSpace: 'nowrap', lineHeight: 1.6 }}>
              © 2026 Covira AI Inc.<br />All rights reserved.
            </Said>
          </div>

          <div style={{ borderTop: '1px solid var(--seam)', paddingTop: 20 }}>
            <Said as="p" style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-secondary)', lineHeight: 1.6, opacity: 0.8 }}>
              Covira&apos;s analysis is for informational purposes only and does not constitute legal or insurance advice.
            </Said>
          </div>
        </div>
      </footer>
    </div>
  )
}
