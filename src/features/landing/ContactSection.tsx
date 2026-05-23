import { memo, useState } from 'react'
import { MB } from '@/constants/tokens'
import { Icon } from '@/components/primitives/Icon'
import { Input } from '@/components/forms/Input'
import { Field } from '@/components/forms/Field'
import { Btn } from '@/components/primitives/Btn'
import { sendContactMessage } from '@/services/contact.service'
import { parseApiError } from '@/lib/api/contracts'
import { useScrollReveal } from '@/hooks/useAnimation'

export const ContactSection = memo(function ContactSection() {
  const { ref, visible } = useScrollReveal(0)
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setFieldErrors({})

    if (!formData.name.trim() || !formData.email.trim() || !formData.subject.trim() || !formData.message.trim()) {
      setError('All fields are required')
      return
    }

    setLoading(true)
    try {
      await sendContactMessage(formData)
      setSubmitted(true)
      setFormData({ name: '', email: '', subject: '', message: '' })
      setTimeout(() => setSubmitted(false), 5000)
    } catch (err) {
      const parsed = parseApiError(err)
      setError(parsed.message || 'Failed to send message')
      if (parsed.fieldErrors) {
        setFieldErrors(parsed.fieldErrors)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <section ref={ref} style={{ padding: '96px 24px', background: MB.bg, borderTop: `1px solid ${MB.line}` }}>
      <div className={`lp-reveal ${visible ? 'visible' : ''}`} style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center', marginBottom: 48 }}>
        <h2 style={{ fontSize: 'clamp(30px, 5vw, 48px)', fontWeight: 800, color: MB.ink, letterSpacing: '-0.025em', margin: '0 0 16px', lineHeight: 1.2 }}>
          Get in touch with us
        </h2>
        <p style={{ fontSize: 16, color: MB.text2, margin: 0, lineHeight: 1.6 }}>
          Have a question about MediBook? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
        </p>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        {submitted ? (
          <div className={`lp-reveal ${visible ? 'visible' : ''}`} style={{ padding: 48, textAlign: 'center', background: '#ECFDF5', borderRadius: 12, border: `1px solid ${MB.success}` }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: MB.success, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Icon name="check" size={28} color="#fff" />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: MB.ink, margin: '0 0 8px' }}>Message sent!</h3>
            <p style={{ fontSize: 14, color: MB.text2, margin: 0 }}>Thanks for reaching out. We'll get back to you shortly.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {error && (
              <div role="alert" style={{ padding: '12px 14px', background: MB.dangerBg, border: `1px solid ${MB.danger}`, borderRadius: 8, fontSize: 13, color: MB.danger, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <Icon name="alert" size={16} color={MB.danger} />
                <span>{error}</span>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Name" required htmlFor="contact-name" error={fieldErrors.name}>
                <input
                  id="contact-name"
                  value={formData.name}
                  onChange={(e) => handleChange({ ...e, target: { ...e.target, name: 'name' } as any })}
                  placeholder="Your name"
                  autoComplete="name"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: `1px solid ${fieldErrors.name ? MB.danger : MB.line}`,
                    fontSize: 14,
                    fontWeight: 400,
                    color: MB.text,
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                  }}
                />
              </Field>
              <Field label="Email" required htmlFor="contact-email" error={fieldErrors.email}>
                <input
                  id="contact-email"
                  value={formData.email}
                  onChange={(e) => handleChange({ ...e, target: { ...e.target, name: 'email' } as any })}
                  placeholder="your@email.com"
                  type="email"
                  autoComplete="email"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: `1px solid ${fieldErrors.email ? MB.danger : MB.line}`,
                    fontSize: 14,
                    fontWeight: 400,
                    color: MB.text,
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                  }}
                />
              </Field>
            </div>

            <Field label="Subject" required htmlFor="contact-subject" error={fieldErrors.subject}>
              <input
                id="contact-subject"
                value={formData.subject}
                onChange={(e) => handleChange({ ...e, target: { ...e.target, name: 'subject' } as any })}
                placeholder="What is this about?"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: `1px solid ${fieldErrors.subject ? MB.danger : MB.line}`,
                  fontSize: 14,
                  fontWeight: 400,
                  color: MB.text,
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                }}
              />
            </Field>

            <Field label="Message" required htmlFor="contact-message" error={fieldErrors.message}>
              <textarea
                id="contact-message"
                value={formData.message}
                onChange={(e) => handleChange({ ...e, target: { ...e.target, name: 'message' } as any })}
                placeholder="Your message..."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: `1px solid ${fieldErrors.message ? MB.danger : MB.line}`,
                  fontFamily: 'inherit',
                  fontSize: 14,
                  fontWeight: 400,
                  color: MB.text,
                  resize: 'vertical',
                  minHeight: 120,
                  boxSizing: 'border-box',
                }}
              />
            </Field>

            <Btn variant="primary" size="lg" full type="submit" loading={loading}>
              Send Message
            </Btn>
          </form>
        )}
      </div>
    </section>
  )
})
