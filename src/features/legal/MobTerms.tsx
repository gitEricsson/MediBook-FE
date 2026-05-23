import { memo } from 'react'
import { LegalPage, Section, Callout } from './LegalPage'

export default memo(function MobTerms() {
  return (
    <LegalPage
      title="Terms of Service"
      subtitle="The agreement between you and MediBook Health. Please read it carefully — by creating an account or booking a consultation, you agree to these terms."
      lastUpdated="May 1, 2026"
    >
      <Section title="1. Who we are">
        <p>MediBook Health (“MediBook,” “we,” “us”) operates a healthcare appointment and consultation platform that connects patients with licensed clinicians for in-person and telemedicine visits. We are not a medical provider — we are the platform through which independent clinicians deliver care.</p>
      </Section>

      <Section title="2. Eligibility">
        <p>You must be at least 18 years old, or have the consent of a parent/guardian, to use MediBook. By creating an account you confirm that the information you provide is accurate and that you have the legal authority to enter into this agreement.</p>
      </Section>

      <Section title="3. Account responsibilities">
        <p>You are responsible for keeping your login credentials confidential and for all activity that occurs under your account. Notify us immediately at <a href="mailto:security@medibook.health" style={{ color: 'inherit' }}>security@medibook.health</a> if you suspect unauthorized access. We will lock the account, rotate sessions, and walk you through recovery.</p>
        <p>You agree not to share your account, impersonate another person, or use the platform to harass clinicians or other users.</p>
      </Section>

      <Section title="4. Medical disclaimer">
        <Callout tone="warn">
          MediBook is not a replacement for emergency medical services. If you are experiencing a medical emergency, call your local emergency number immediately.
        </Callout>
        <p>Clinicians on MediBook are independent practitioners. Any clinical advice, prescription, or treatment plan you receive is between you and that clinician. MediBook does not control, endorse, or guarantee the outcome of any consultation.</p>
        <p>The AI assistant features (chat support, copilot summaries, draft replies) are decision-support tools — never substitutes for clinician judgment. Doctors review and approve any clinical output before it reaches you.</p>
      </Section>

      <Section title="5. Bookings, payments, and cancellations">
        <p>When you book a consultation, the slot is held but not confirmed until payment lands. If payment doesn’t complete within 30 minutes, the slot is released automatically.</p>
        <p>You may cancel a booking up to 2 hours before the scheduled time for a full refund. Cancellations inside the 2-hour window may incur a no-show fee at the clinician’s discretion.</p>
        <p>Emergency consultations are billed after the visit completes — you’ll receive an invoice for any outstanding balance directly in the app.</p>
      </Section>

      <Section title="6. Telemedicine">
        <p>Telemedicine (audio and video) consultations are delivered through our integrated calling provider. Chat between you and your clinician opens 10 minutes before the consultation start time and remains writable until 10 minutes after the scheduled end. After that the conversation becomes read-only but stays accessible for your records.</p>
      </Section>

      <Section title="7. Prescriptions">
        <p>Prescriptions issued through MediBook are governed by the laws of the jurisdiction in which the prescribing clinician is licensed. Some medications cannot be prescribed via telemedicine. The clinician will exercise independent judgment about what is appropriate for your case.</p>
      </Section>

      <Section title="8. Acceptable use">
        <ul style={{ paddingLeft: 20, margin: '8px 0' }}>
          <li>Do not attempt to access another patient’s records or a clinician’s private notes.</li>
          <li>Do not scrape, reverse-engineer, or attempt to disrupt the platform.</li>
          <li>Do not upload malicious content, illegal material, or content that infringes someone else’s rights.</li>
          <li>Treat clinicians and support staff with respect — harassment will result in account termination.</li>
        </ul>
      </Section>

      <Section title="9. Termination">
        <p>You may close your account at any time from your profile settings. We may suspend or terminate your account if you violate these terms or if we’re required to by law. We will retain medical records as required by applicable healthcare regulations even after closure.</p>
      </Section>

      <Section title="10. Limitation of liability">
        <p>To the maximum extent permitted by law, MediBook is not liable for indirect, incidental, or consequential damages arising from your use of the platform. Our total liability in any 12-month period will not exceed the fees you paid during that period.</p>
      </Section>

      <Section title="11. Changes to these terms">
        <p>We may update these terms from time to time. If the changes are material, we will notify you via email and in-app notification at least 30 days before they take effect. Continued use of MediBook after the effective date constitutes acceptance.</p>
      </Section>

      <Section title="12. Governing law">
        <p>These terms are governed by the laws of the Federal Republic of Nigeria. Disputes will be resolved in the courts of Lagos, Nigeria, unless your local consumer law requires otherwise.</p>
      </Section>
    </LegalPage>
  )
})
