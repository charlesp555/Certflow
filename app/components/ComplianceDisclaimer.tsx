// Compliance-report disclaimer — a legal requirement. It must appear, always
// visible, anywhere a user reads a compliance verdict: vendor profile, report
// detail, submissions, and any exported compliance report (use the exported
// COMPLIANCE_DISCLAIMER constant for non-JSX output like CSV). Fine print per
// the Design Bible: ink-secondary Schibsted above a seam hairline — a
// footnote, not an alert. No red, no orange, no icon, never dismissable or
// collapsible. The text is fixed legal copy — do not edit or paraphrase it.

export const COMPLIANCE_DISCLAIMER =
  'Covira analyzes certificates of insurance and reports what it finds against the requirements you set. This analysis is provided for informational purposes only and does not constitute legal, insurance, or professional advice. Covira does not verify the authenticity of certificates or the current status of underlying policies with carriers. Final compliance decisions, and any reliance on this analysis, remain your responsibility.'

export default function ComplianceDisclaimer({ style }: { style?: React.CSSProperties }) {
  return (
    <p style={{
      margin: 0, paddingTop: 14,
      borderTop: '1px solid #262B35',              // --seam
      fontSize: 12, lineHeight: 1.7,
      color: '#9AA3B2',                            // --ink-secondary
      fontFamily: 'var(--font-voice), sans-serif', // Schibsted Grotesk (Said)
      ...style,
    }}>
      {COMPLIANCE_DISCLAIMER}
    </p>
  )
}
