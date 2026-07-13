// ─────────────────────────────────────────────────────────────────────────────
// DRAFT — NOT LEGAL ADVICE. This Terms of Service is a working draft prepared
// for Covira and is PENDING REVIEW BY A LICENSED ATTORNEY before it is relied
// upon or presented as final. Placeholders (mailing address, contact email) are
// marked on the page and must be filled in prior to publishing.
// ─────────────────────────────────────────────────────────────────────────────

import type { Metadata } from 'next'
import { LegalDocument, Section, Lead, Placeholder } from '../components/LegalChrome'

export const metadata: Metadata = {
  title: 'Terms of Service — Covira',
  description: 'The terms that govern your use of Covira.',
}

export default function TermsPage() {
  return (
    <LegalDocument title="Terms of Service" lastUpdated="July 13, 2026">
      <Lead>
        <p>
          These Terms of Service (the &ldquo;Terms&rdquo;) are an agreement between you and{' '}
          <strong>Covira LLC</strong>, a Mississippi limited liability company (&ldquo;Covira,&rdquo;
          &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;). They govern your access to and use
          of the Covira application and related services (the &ldquo;Service&rdquo;).
        </p>
        <p>
          By creating an account or using the Service, you agree to these Terms. If you are using the
          Service on behalf of a company or other organization, you represent that you have authority
          to bind that organization, and &ldquo;you&rdquo; refers to that organization. If you do not
          agree to these Terms, do not use the Service.
        </p>
      </Lead>

      <Section n={1} title="What Covira Does — and What It Doesn't">
        <p>
          Covira reads ACORD 25 Certificates of Liability Insurance and reports whether the coverage
          shown on the certificate meets the requirements you configure. It is a tool to help you
          review certificates faster.
        </p>
        <p>Covira reads a certificate as it is presented to it. Specifically, Covira does <strong>not</strong>:</p>
        <ul>
          <li>verify that a certificate is genuine, or detect that a certificate has been forged, altered, or fabricated;</li>
          <li>confirm with any insurance carrier or broker that a policy exists, is in force, or has not been cancelled;</li>
          <li>guarantee that the information it extracts from a certificate is accurate or complete; or</li>
          <li>make compliance decisions for you.</li>
        </ul>
        <p>
          Covira is a reading and comparison tool, not a verification, authentication, or underwriting
          service. You are responsible for the final decision about whether a vendor meets your
          requirements.
        </p>
      </Section>

      <Section n={2} title="Beta Service">
        <p>
          The Service is currently offered as a <strong>free beta</strong>. That means:
        </p>
        <ul>
          <li>No payment is required and none is taken during the beta.</li>
          <li>The Service may contain errors, produce incorrect results, and change or be interrupted without notice.</li>
          <li>We may add, change, suspend, or discontinue any part of the Service — or the entire Service — at any time.</li>
          <li>We make no service-level commitments: no guaranteed uptime, availability, response time, or accuracy.</li>
        </ul>
        <p>
          Because the Service is a free beta, you should treat its output as a starting point for your
          own review, not as a finished answer you can rely on without checking.
        </p>
      </Section>

      <Section n={3} title="Not Professional Advice">
        <p>
          Covira's output is provided for <strong>informational purposes only</strong>. It is not
          legal advice, insurance advice, risk-management advice, or any other kind of professional
          advice, and using Covira does not create any professional or advisory relationship between
          you and us.
        </p>
        <p>
          You are solely responsible for your compliance decisions and for any action you take — or
          decline to take — based on Covira's output. If you need professional advice about insurance
          requirements or coverage, consult a qualified insurance or legal professional.
        </p>
      </Section>

      <Section n={4} title="No Authenticity Verification">
        <p>
          Covira does not authenticate certificates. It cannot and does not detect fraudulent,
          forged, altered, or expired-but-misrepresented certificates, and it does not confirm
          coverage status, policy limits, or cancellation with any carrier or broker.
        </p>
        <p>
          A certificate that Covira reports as meeting your requirements may still be fake, out of
          date, or contradicted by the actual policy. Independent verification with the issuing
          carrier or broker is the only way to confirm that coverage is real and in force, and Covira
          does not perform that step.
        </p>
      </Section>

      <Section n={5} title="Scope — ACORD 25 Only">
        <p>
          Covira is built, tested, and supported for <strong>ACORD 25 Certificates of Liability
          Insurance only</strong>. The Service is designed to refuse to grade documents it cannot
          identify as an ACORD 25.
        </p>
        <p>
          Any other document type — a different ACORD form, a policy declarations page, an
          endorsement, a binder, a carrier letter, or anything else — is outside the supported scope.
          If the Service produces any output regarding a non-ACORD-25 document, that output is
          unsupported and unwarranted, and you should not rely on it.
        </p>
      </Section>

      <Section n={6} title="Your Responsibilities">
        <p>When you use the Service, you represent and agree that:</p>
        <ul>
          <li>
            <strong>You have the right to upload the documents you submit.</strong> You upload
            certificates and information belonging to your vendors and other third parties. You
            represent that you have the necessary rights, permissions, and legal basis to upload that
            information to Covira and to have it processed as described in our Privacy Policy.
          </li>
          <li>
            <strong>You are responsible for the requirements you configure.</strong> Covira compares
            certificates against the requirements you set. You are responsible for the accuracy,
            completeness, and appropriateness of those requirements. Covira does not decide what
            coverage you should require.
          </li>
          <li>
            <strong>You are responsible for your account.</strong> Keep your login credentials secure
            and do not share your account. You are responsible for activity that occurs under your
            account.
          </li>
          <li>
            <strong>You will review Covira's output.</strong> You will not treat Covira's output as a
            substitute for your own judgment or for independent verification of coverage.
          </li>
        </ul>
      </Section>

      <Section n={7} title="Acceptable Use">
        <p>You agree not to:</p>
        <ul>
          <li>upload documents or information you do not have the right to upload;</li>
          <li>use the Service to violate any law or the rights of any third party;</li>
          <li>attempt to gain unauthorized access to the Service, other accounts, or our systems, or to interfere with or disrupt the Service;</li>
          <li>reverse engineer, scrape, or copy the Service except as permitted by law;</li>
          <li>upload malware or malicious content; or</li>
          <li>use the Service to build or train a competing product.</li>
        </ul>
      </Section>

      <Section n={8} title="Accounts, Suspension, and Termination">
        <p>
          You may stop using the Service and delete your account at any time (see our Privacy Policy
          for how to request deletion of your data). We may suspend or terminate your access to the
          Service at any time, with or without notice, including if we believe you have violated these
          Terms or to protect the Service or other users. Sections of these Terms that by their nature
          should survive termination — including Sections 3, 4, 9, 10, 11, and 12 — will survive.
        </p>
      </Section>

      <Section n={9} title="Disclaimer of Warranties — &ldquo;As Is&rdquo;">
        <p>
          THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE,&rdquo; WITH ALL FAULTS
          AND WITHOUT WARRANTY OF ANY KIND. TO THE FULLEST EXTENT PERMITTED BY LAW, COVIRA DISCLAIMS
          ALL WARRANTIES, WHETHER EXPRESS, IMPLIED, STATUTORY, OR OTHERWISE, INCLUDING ANY IMPLIED
          WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.
        </p>
        <p>
          Without limiting the above, Covira does not warrant that the Service or its output will be
          accurate, complete, reliable, current, error-free, or fit for any particular purpose; that
          certificates it reviews are genuine or that coverage is in force; that the Service will be
          uninterrupted, secure, or available; or that any errors will be corrected. No advice or
          information, whether oral or written, obtained from Covira creates any warranty not expressly
          stated in these Terms.
        </p>
        <p>Some jurisdictions do not allow the exclusion of certain warranties, so some of the above may not apply to you.</p>
      </Section>

      <Section n={10} title="Limitation of Liability">
        <p>
          TO THE FULLEST EXTENT PERMITTED BY LAW, COVIRA AND ITS OWNERS, MEMBERS, OFFICERS, EMPLOYEES,
          AND AGENTS WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL,
          EXEMPLARY, OR PUNITIVE DAMAGES, OR FOR ANY LOSS OF PROFITS, REVENUE, DATA, GOODWILL, OR
          BUSINESS OPPORTUNITY, ARISING OUT OF OR RELATING TO THE SERVICE OR THESE TERMS, WHETHER
          BASED ON CONTRACT, TORT (INCLUDING NEGLIGENCE), STRICT LIABILITY, OR ANY OTHER THEORY, AND
          WHETHER OR NOT COVIRA HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
        </p>
        <p>
          THIS INCLUDES, WITHOUT LIMITATION, ANY DAMAGES ARISING FROM: your reliance on Covira's
          output; a certificate that was fraudulent, altered, expired, or otherwise inaccurate; a
          policy that was not actually in force; an incorrect, incomplete, or missed extraction or
          compliance result; a document outside the ACORD 25 scope; or any decision you made or failed
          to make in connection with a vendor's insurance.
        </p>
        <p>
          TO THE FULLEST EXTENT PERMITTED BY LAW, COVIRA'S TOTAL AGGREGATE LIABILITY FOR ALL CLAIMS
          ARISING OUT OF OR RELATING TO THE SERVICE OR THESE TERMS WILL NOT EXCEED THE GREATER OF (a)
          THE TOTAL AMOUNT YOU PAID COVIRA FOR THE SERVICE IN THE TWELVE (12) MONTHS BEFORE THE EVENT
          GIVING RISE TO THE CLAIM — WHICH, DURING THE FREE BETA, IS ZERO DOLLARS ($0) — OR (b) ONE
          HUNDRED U.S. DOLLARS ($100).
        </p>
        <p>
          These limitations apply even if a remedy fails of its essential purpose. Some jurisdictions
          do not allow the limitation or exclusion of certain damages, so some of the above may not
          apply to you; in that case, our liability is limited to the maximum extent permitted by law.
        </p>
      </Section>

      <Section n={11} title="Indemnification">
        <p>
          To the fullest extent permitted by law, you will indemnify and hold harmless Covira and its
          owners, members, officers, employees, and agents from and against any claims, damages,
          losses, liabilities, and expenses (including reasonable legal fees) arising out of or
          relating to: (a) your use of the Service; (b) documents or information you upload, including
          any claim that you did not have the right to upload them; (c) your requirements
          configuration or compliance decisions; or (d) your violation of these Terms or of any law or
          third-party right.
        </p>
      </Section>

      <Section n={12} title="Governing Law">
        <p>
          These Terms are governed by the laws of the State of Mississippi, without regard to its
          conflict-of-laws rules. You agree that the exclusive venue for any dispute arising out of or
          relating to these Terms or the Service will be the state or federal courts located in
          Mississippi, and you consent to their jurisdiction.
        </p>
      </Section>

      <Section n={13} title="Changes to These Terms">
        <p>
          We may update these Terms from time to time. When we do, we will revise the &ldquo;Last
          updated&rdquo; date at the top of this page. If we make a material change, we will take
          reasonable steps to notify you. Your continued use of the Service after a change takes effect
          means you accept the updated Terms.
        </p>
      </Section>

      <Section n={14} title="Contact">
        <p>Questions about these Terms? Contact us:</p>
        <ul>
          <li>Email: <Placeholder>CONTACT EMAIL — e.g. legal@covira.io — TO BE CONFIRMED</Placeholder></li>
          <li>
            Mail: Covira LLC, <Placeholder>MAILING ADDRESS — TO BE ADDED</Placeholder>
          </li>
        </ul>
      </Section>
    </LegalDocument>
  )
}
