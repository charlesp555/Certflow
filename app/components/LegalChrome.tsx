// Shared chrome + typographic primitives for Covira's legal documents
// (Terms of Service, Privacy Policy). Design Bible: carbon ground, one graphite
// reading panel, seam hairlines, Schibsted Grotesk voice, --ink-primary
// headings / --ink-secondary body, a single generous reading measure, no
// decoration — these are documents, not marketing.
//
// The Bible color tokens are defined page-locally here (via the .legal-doc
// scope) because the landing page's :root token block only exists while that
// page is mounted; these standalone routes must carry their own.

import Link from 'next/link'
import Image from 'next/image'
import type { ReactNode, CSSProperties } from 'react'

const SCOPE_STYLE = `
  .legal-doc {
    --carbon:        #0C0E12;
    --graphite:      #171A21;
    --seam:          #262B35;
    --ink-primary:   #F2F4F8;
    --ink-secondary: #9AA3B2;
    --verified:      #F97316;
    --measure:       68ch;
    --radius:        8px;

    min-height: 100vh;
    background: var(--carbon);
    color: var(--ink-secondary);
    font-family: var(--font-voice), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    -webkit-font-smoothing: antialiased;
  }

  .legal-doc a.legal-link { color: var(--verified); text-decoration: none; }
  .legal-doc a.legal-link:hover { text-decoration: underline; }

  .legal-doc p { margin: 0 0 16px; font-size: 16px; line-height: 1.72; color: var(--ink-secondary); }
  .legal-doc p:last-child { margin-bottom: 0; }

  .legal-doc ul { margin: 0 0 16px; padding-left: 22px; }
  .legal-doc li { font-size: 16px; line-height: 1.72; color: var(--ink-secondary); margin-bottom: 8px; }
  .legal-doc li:last-child { margin-bottom: 0; }

  .legal-doc strong { color: var(--ink-primary); font-weight: 600; }

  .legal-panel { padding: clamp(28px, 5vw, 56px); }

  @media (max-width: 640px) {
    .legal-panel { padding: 24px 20px; }
  }
`

/** The full document chrome: minimal header, one graphite reading panel, and a
 *  quiet footer that cross-links the two policies and returns home. */
export function LegalDocument({
  title,
  lastUpdated,
  children,
}: {
  title: string
  lastUpdated: string
  children: ReactNode
}) {
  return (
    <div className="legal-doc">
      <style>{SCOPE_STYLE}</style>

      {/* Header — logo lockup only; no marketing nav on a document */}
      <header
        style={{
          borderBottom: '1px solid var(--seam)',
          background: 'var(--graphite)',
        }}
      >
        <div
          style={{
            maxWidth: 880,
            margin: '0 auto',
            padding: '0 24px',
            height: 64,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <Image src="/covira-logo.png?v=3" alt="" width={36} height={36} style={{ flexShrink: 0 }} />
            <span
              style={{
                fontFamily: 'var(--font-voice)',
                fontWeight: 700,
                fontSize: 15,
                letterSpacing: '0.20em',
                color: 'var(--ink-primary)',
              }}
            >
              COVIRA
            </span>
          </Link>
        </div>
      </header>

      {/* Document */}
      <main style={{ maxWidth: 880, margin: '0 auto', padding: '48px 24px 80px' }}>
        <article
          className="legal-panel"
          style={{
            background: 'var(--graphite)',
            border: '1px solid var(--seam)',
            borderRadius: 'var(--radius)',
          }}
        >
          <h1
            style={{
              fontFamily: 'var(--font-voice)',
              fontSize: 'clamp(28px, 4vw, 34px)',
              fontWeight: 700,
              lineHeight: 1.15,
              color: 'var(--ink-primary)',
              letterSpacing: '-0.01em',
              margin: '0 0 12px',
            }}
          >
            {title}
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-evidence), monospace',
              fontSize: 13,
              color: 'var(--ink-secondary)',
              margin: '0 0 8px',
              letterSpacing: '0.02em',
            }}
          >
            Last updated: {lastUpdated}
          </p>

          <div style={{ maxWidth: 'var(--measure)' }}>{children}</div>
        </article>

        {/* Footer — cross-links between the two documents + home */}
        <footer
          style={{
            marginTop: 28,
            paddingTop: 24,
            borderTop: '1px solid var(--seam)',
            display: 'flex',
            gap: 24,
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <Link href="/terms" className="legal-link" style={{ fontSize: 14 }}>Terms of Service</Link>
            <Link href="/privacy" className="legal-link" style={{ fontSize: 14 }}>Privacy Policy</Link>
            <Link href="/" className="legal-link" style={{ fontSize: 14 }}>Home</Link>
          </div>
          <span
            style={{
              fontFamily: 'var(--font-evidence), monospace',
              fontSize: 11,
              color: 'var(--ink-secondary)',
            }}
          >
            © 2026 Covira LLC
          </span>
        </footer>
      </main>
    </div>
  )
}

/** A numbered top-level section. */
export function Section({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section style={{ marginTop: 36 }}>
      <h2
        style={{
          fontFamily: 'var(--font-voice)',
          fontSize: 20,
          fontWeight: 700,
          lineHeight: 1.3,
          color: 'var(--ink-primary)',
          margin: '0 0 12px',
        }}
      >
        <span style={{ color: 'var(--ink-secondary)', fontWeight: 500 }}>{n}. </span>
        {title}
      </h2>
      {children}
    </section>
  )
}

/** Lead paragraph directly under the title, before the first numbered section. */
export function Lead({ children }: { children: ReactNode }) {
  return <div style={{ marginTop: 20 }}>{children}</div>
}

/** An inline placeholder the owner must fill in before publishing — rendered in
 *  the evidence face with an orange outline so it can't be missed on the page. */
export function Placeholder({ children }: { children: ReactNode }) {
  const style: CSSProperties = {
    fontFamily: 'var(--font-evidence), monospace',
    fontSize: 13,
    color: 'var(--verified)',
    border: '1px solid rgba(249,115,22,0.4)',
    background: 'rgba(249,115,22,0.06)',
    borderRadius: 4,
    padding: '1px 6px',
    whiteSpace: 'normal',
  }
  return <span style={style}>{children}</span>
}
