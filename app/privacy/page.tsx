// ─────────────────────────────────────────────────────────────────────────────
// DRAFT — NOT LEGAL ADVICE. This Privacy Policy is a working draft prepared for
// Covira and is PENDING REVIEW BY A LICENSED ATTORNEY before it is relied upon
// or presented as final. Placeholders (mailing address, contact email) are
// marked on the page and must be filled in prior to publishing.
// ─────────────────────────────────────────────────────────────────────────────

import type { Metadata } from 'next'
import { LegalDocument, Section, Lead, Placeholder } from '../components/LegalChrome'

export const metadata: Metadata = {
  title: 'Privacy Policy — Covira',
  description: 'How Covira collects, uses, and protects information.',
}

export default function PrivacyPage() {
  return (
    <LegalDocument title="Privacy Policy" lastUpdated="July 13, 2026">
      <Lead>
        <p>
          This Privacy Policy explains how <strong>Covira LLC</strong>, a Mississippi limited liability
          company (&ldquo;Covira,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;),
          collects, uses, shares, and protects information when you use the Covira application and
          related services (the &ldquo;Service&rdquo;).
        </p>
        <p>
          Covira reads ACORD 25 Certificates of Liability Insurance and reports whether they meet the
          requirements you configure. To do that, we handle information about you and — importantly —
          information about your vendors. Please read Section 2 carefully.
        </p>
      </Lead>

      <Section n={1} title="Information We Collect">
        <p>We collect the following:</p>
        <ul>
          <li>
            <strong>Account information.</strong> Your name and email address, handled through our
            authentication provider, Clerk, when you create and sign in to your account.
          </li>
          <li>
            <strong>Company information.</strong> Details you provide about your organization, such as
            company name, industry, size, website, and address.
          </li>
          <li>
            <strong>Requirement settings.</strong> The insurance requirements you configure for Covira
            to check certificates against.
          </li>
          <li>
            <strong>Uploaded certificates and extracted data.</strong> The certificate files you
            upload and the information read from them — <strong>including personal and business
            information about your vendors and other third parties</strong> (see Section 2), such as
            vendor business names, addresses, contact names, contact email addresses, policy numbers,
            coverage types, and coverage limits.
          </li>
          <li>
            <strong>Basic technical data.</strong> Standard information your browser and our hosting
            provider generate when you use a web application, such as IP address and request logs,
            used to operate and secure the Service.
          </li>
        </ul>
      </Section>

      <Section n={2} title="Data About Your Vendors (Third-Party Information)">
        <p>
          When you upload a certificate, you are uploading information about your vendors and other
          third parties — not just about yourself. That information can include personal data such as
          contact names and email addresses.
        </p>
        <p>
          <strong>You are responsible for having the right to upload this information.</strong> By
          uploading a certificate or other document, you represent that you have the necessary rights,
          permissions, and legal basis to provide that third-party information to Covira and to have it
          processed as described in this Policy. With respect to your vendors' information, you act as
          the controller of that data and Covira processes it on your behalf to provide the Service.
        </p>
      </Section>

      <Section n={3} title="How We Use Information">
        <p>We use the information we collect solely to provide and operate the Service, including to:</p>
        <ul>
          <li>authenticate you and maintain your account;</li>
          <li>read uploaded certificates and compare them against your configured requirements;</li>
          <li>store your vendors, submissions, results, and settings so you can access them;</li>
          <li>secure, maintain, and troubleshoot the Service; and</li>
          <li>communicate with you about the Service.</li>
        </ul>
        <p>
          <strong>We do not sell your information.</strong> <strong>We do not use your information —
          including uploaded certificates or the data extracted from them — to train artificial
          intelligence models.</strong> We do not use your information for advertising.
        </p>
      </Section>

      <Section n={4} title="Sub-processors — Who Processes Data For Us">
        <p>
          We use a small number of third-party service providers to run the Service. They process
          information only to provide their service to us, under their own terms and privacy
          commitments:
        </p>
        <ul>
          <li><strong>Supabase</strong> — database and storage for your account data, vendors, submissions, and uploaded files (hosted in the United States).</li>
          <li><strong>Clerk</strong> — user authentication and account management (your name, email, and login).</li>
          <li><strong>Vercel</strong> — application hosting and delivery.</li>
          <li>
            <strong>Anthropic</strong> — document analysis. <strong>The content of the certificates you
            upload is transmitted to Anthropic's API to be read and analyzed.</strong> Anthropic
            processes this content to return the analysis to us; per Anthropic's API terms, submitted
            content is not used to train its models.
          </li>
        </ul>
      </Section>

      <Section n={5} title="How Long We Keep Data, and Deletion">
        <p>
          We keep your information for as long as your account is active and as needed to provide the
          Service. You can delete individual vendors and their associated data from within the app at
          any time.
        </p>
        <p>
          <strong>You can request deletion of your account and all associated data.</strong> To do so,
          contact us at <Placeholder>CONTACT EMAIL — e.g. privacy@covira.io — TO BE CONFIRMED</Placeholder>{' '}
          from the email address associated with your account. We are committed to honoring valid
          deletion requests and will delete your account data from our systems, and instruct our
          sub-processors to delete it from theirs, within a reasonable period, except where we are
          required to retain certain information by law.
        </p>
      </Section>

      <Section n={6} title="Security">
        <p>We take reasonable measures to protect the information in the Service. In particular:</p>
        <ul>
          <li><strong>Per-account data isolation.</strong> We use database row-level security so that each account can access only its own data.</li>
          <li><strong>Encrypted transit.</strong> Data moving between your browser, our Service, and our sub-processors is encrypted using standard TLS (HTTPS).</li>
          <li><strong>Authenticated access.</strong> Access to your data requires signing in to your authenticated account.</li>
        </ul>
        <p>
          We want to be honest about the limits of these measures. No method of transmission or storage
          is perfectly secure, and we cannot guarantee absolute security. We do not hold, and do not
          claim, any formal security or compliance certification — for example, we are not SOC 2
          certified and the Service is not HIPAA compliant. If that changes, we will update this
          Policy.
        </p>
      </Section>

      <Section n={7} title="Cookies and Analytics">
        <p>
          Covira uses only the <strong>essential cookies</strong> required to keep you signed in and to
          operate the Service securely — these are set by our authentication provider, Clerk, to
          maintain your session.
        </p>
        <p>
          <strong>We do not run third-party advertising or product-analytics tracking</strong> (for
          example, Google Analytics, advertising pixels, or similar). We do not track you across other
          websites. If we add analytics in the future, we will update this Policy first.
        </p>
      </Section>

      <Section n={8} title="Your Choices and Rights">
        <p>
          You can access and update much of your account and company information directly in the app.
          You can delete vendor data in the app, and you can request deletion of your entire account
          and data as described in Section 5. Depending on where you live, you may have additional
          rights over your personal information, such as the right to access or correct it; contact us
          using the details in Section 10 to exercise them.
        </p>
      </Section>

      <Section n={9} title="Children">
        <p>
          The Service is intended for use by businesses and is not directed to children under 13, and
          we do not knowingly collect personal information from children.
        </p>
      </Section>

      <Section n={10} title="Changes and Contact">
        <p>
          We may update this Policy from time to time. When we do, we will revise the &ldquo;Last
          updated&rdquo; date at the top of this page, and we will take reasonable steps to notify you
          of material changes.
        </p>
        <p>For privacy questions or requests, contact us:</p>
        <ul>
          <li>Email: <Placeholder>CONTACT EMAIL — e.g. privacy@covira.io — TO BE CONFIRMED</Placeholder></li>
          <li>Mail: Covira LLC, <Placeholder>MAILING ADDRESS — TO BE ADDED</Placeholder></li>
        </ul>
      </Section>
    </LegalDocument>
  )
}
