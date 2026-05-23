import { memo } from 'react'
import { LegalPage, Section, Callout } from './LegalPage'

export default memo(function MobPrivacy() {
  return (
    <LegalPage
      title="Privacy Policy"
      subtitle="How MediBook collects, uses, stores, and protects your information — written in plain English, with the technical details available if you want them."
      lastUpdated="May 1, 2026"
    >
      <Callout>
        We never sell your health data. Period. Clinical information is encrypted at rest, access is audited, and you can request your full record at any time.
      </Callout>

      <Section title="1. What we collect">
        <p><strong>Account data</strong> — your name, email, phone number, date of birth, and password (stored as a salted hash; we never see your actual password).</p>
        <p><strong>Health data</strong> — your medical history, allergies, blood group, consultation notes, prescriptions, and any messages you exchange with clinicians.</p>
        <p><strong>Booking and payment data</strong> — the appointments you book, the clinicians you see, and the gateway-issued payment references (we do not store full card numbers; these are handled by Paystack, Monnify, and Stripe directly).</p>
        <p><strong>Device and usage data</strong> — IP address, browser type, and basic usage telemetry, used to keep the platform secure and to debug issues.</p>
      </Section>

      <Section title="2. How we use it">
        <ul style={{ paddingLeft: 20, margin: '8px 0' }}>
          <li>To deliver the booking, consultation, and follow-up workflows you sign up for.</li>
          <li>To send transactional notifications (booking confirmations, reminders 48 / 24 / 2 hours before your appointment, payment receipts).</li>
          <li>To detect and prevent fraud, abuse, and unauthorized access.</li>
          <li>To improve the platform — strictly using aggregated, de-identified data.</li>
          <li>To meet our legal and regulatory obligations (e.g. medical record retention).</li>
        </ul>
      </Section>

      <Section title="3. How we protect it">
        <p>Clinical fields — diagnosis, treatment plans, prescriptions, consultation transcripts, medical history, allergies, blood group, and visit reasons — are encrypted at the field level using <strong>AES-256-GCM</strong> with keys derived via PBKDF2 (310,000 iterations). Each field is encrypted with a fresh IV.</p>
        <p>Connections to MediBook are protected by TLS 1.2+. Access to clinical data is gated by role-based authorization and audited — every read of a patient record is logged with the actor, time, and reason.</p>
        <p>We use short-lived JWT access tokens with rotating refresh tokens. Sessions idle out after 15 minutes of inactivity. Refresh-token reuse is detected and forces a re-authentication.</p>
      </Section>

      <Section title="4. Who can see your data">
        <p><strong>You.</strong> Always. You can view your full profile, history, prescriptions, and consultation notes in the app.</p>
        <p><strong>Clinicians you book with.</strong> They see the clinical context they need to treat you. A clinician who has not had a consultation with you must request — and receive your explicit approval — before they can view your historical records.</p>
        <p><strong>Our staff.</strong> A small number of trained personnel may access clinical data when strictly necessary to operate, audit, or investigate security incidents. All such access is logged.</p>
        <p><strong>Third parties.</strong> We use a narrow set of processors who are contractually bound to handle your data on our behalf: payment gateways, transactional email providers, our cloud infrastructure, and our calling provider. We never share data with advertisers, data brokers, or data-analytics vendors.</p>
      </Section>

      <Section title="5. AI features and your data">
        <p>Our AI assistants (general chat support, visit copilot for clinicians) operate under strict guardrails:</p>
        <ul style={{ paddingLeft: 20, margin: '8px 0' }}>
          <li>Chats are classified before being sent to any model — emergency/symptom messages are routed to a clinician path, not to the model.</li>
          <li>Visit summaries and draft replies are stored encrypted and require clinician approval before being sent.</li>
          <li>We do not use your clinical data to train third-party AI models.</li>
        </ul>
      </Section>

      <Section title="6. Your rights">
        <ul style={{ paddingLeft: 20, margin: '8px 0' }}>
          <li><strong>Access.</strong> You can download your full record from your profile at any time.</li>
          <li><strong>Correction.</strong> You can edit your profile information directly; corrections to clinical notes require clinician sign-off.</li>
          <li><strong>Deletion.</strong> You can close your account from your profile. We will retain medical records as required by applicable healthcare regulations; everything else is removed.</li>
          <li><strong>Portability.</strong> Exports are provided in machine-readable JSON.</li>
          <li><strong>Objection.</strong> Email <a href="mailto:privacy@medibook.health" style={{ color: 'inherit' }}>privacy@medibook.health</a> to object to any processing not strictly required for your care.</li>
        </ul>
      </Section>

      <Section title="7. Data retention">
        <p>Medical records are retained for the duration required by applicable regulations (typically 7 years for adult patients, longer for pediatric records). Notification history is retained for 30 days. Audit logs are retained for 1 year. Inactive accounts are anonymized after 24 months if no medical records require retention.</p>
      </Section>

      <Section title="8. International transfers">
        <p>MediBook’s primary infrastructure is hosted in <strong>us-central1</strong> on Google Cloud. If you are outside the region of hosting, your data is transferred under standard contractual clauses approved by the relevant data-protection authority.</p>
      </Section>

      <Section title="9. Cookies and tracking">
        <p>We use a small number of strictly necessary cookies for session management and CSRF protection. We do not use analytics cookies, advertising cookies, or third-party trackers. You will not see a cookie banner because there is nothing to consent to beyond what we need to keep you logged in.</p>
      </Section>

      <Section title="10. Children">
        <p>MediBook is not intended for users under 13. Patients aged 13–17 may use the platform with the consent of a parent or guardian, who is the account holder and bears responsibility for the account.</p>
      </Section>

      <Section title="11. Changes to this policy">
        <p>Material changes will be announced via email and in-app notification at least 30 days before they take effect. The "Last updated" stamp at the top of this page always reflects the most recent revision.</p>
      </Section>

      <Section title="12. Contact our Data Protection Officer">
        <p>Email <a href="mailto:privacy@medibook.health" style={{ color: 'inherit' }}>privacy@medibook.health</a>. For urgent security disclosures, use <a href="mailto:security@medibook.health" style={{ color: 'inherit' }}>security@medibook.health</a> — we respond within 24 hours.</p>
      </Section>
    </LegalPage>
  )
})
