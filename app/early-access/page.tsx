'use client'
import { useState } from 'react'
import Nav from '../components/Nav'
import Footer from '../components/Footer'

export default function EarlyAccess() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    company: '',
    properties: '',
    vendors: '',
    pain: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await new Promise((r) => setTimeout(r, 1200))
    setSubmitted(true)
    setLoading(false)
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <Nav />

      <section>
        <div className="max-w-2xl mx-auto px-6 py-20">
          {!submitted ? (
            <>
              <div className="section-label">early access</div>
              <h1
                className="font-sans font-black mb-3"
                style={{ fontSize: 'clamp(26px, 4vw, 36px)', letterSpacing: '-1px' }}
              >
                Request early access<br />
                to{' '}
                <em className="not-italic" style={{ color: 'var(--amber)' }}>
                  Covira.
                </em>
              </h1>
              <p
                className="text-sm mb-10 leading-relaxed"
                style={{ color: 'var(--muted2)' }}
              >
                We&apos;re onboarding a small first cohort of property management
                teams. No sales call. No pitch deck. Just a quick form so we can
                understand your operation and make sure Covira is actually the
                right fit for you.
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {[
                  { id: 'name',       label: 'your name',             placeholder: 'Jane Smith',                  type: 'text'  },
                  { id: 'email',      label: 'work email',            placeholder: 'jane@yourcompany.com',        type: 'email' },
                  { id: 'company',    label: 'company name',          placeholder: 'Anchor Property Management',  type: 'text'  },
                  { id: 'properties', label: 'how many properties do you manage?', placeholder: '14', type: 'text' },
                  { id: 'vendors',    label: 'rough number of active vendors / contractors', placeholder: '40–60', type: 'text' },
                ].map((field) => (
                  <div key={field.id}>
                    <label
                      htmlFor={field.id}
                      className="mono text-[10px] tracking-widest uppercase block mb-2"
                      style={{ color: 'var(--muted)' }}
                    >
                      {field.label}
                    </label>
                    <input
                      id={field.id}
                      type={field.type}
                      required
                      placeholder={field.placeholder}
                      value={form[field.id as keyof typeof form]}
                      onChange={(e) => setForm({ ...form, [field.id]: e.target.value })}
                      className="w-full rounded-md px-4 py-3 text-sm outline-none transition-colors"
                      style={{
                        background: 'var(--bg2)',
                        border: '0.5px solid var(--border2)',
                        color: 'var(--text)',
                      }}
                      onFocus={(e) => (e.target.style.borderColor = 'var(--amber)')}
                      onBlur={(e) => (e.target.style.borderColor = 'var(--border2)')}
                    />
                  </div>
                ))}

                <div>
                  <label
                    htmlFor="pain"
                    className="mono text-[10px] tracking-widest uppercase block mb-2"
                    style={{ color: 'var(--muted)' }}
                  >
                    biggest COI headache right now (optional but helpful)
                  </label>
                  <textarea
                    id="pain"
                    rows={4}
                    placeholder="e.g. we manually track 60 vendor certificates in a spreadsheet and renewals keep slipping through..."
                    value={form.pain}
                    onChange={(e) => setForm({ ...form, pain: e.target.value })}
                    className="w-full rounded-md px-4 py-3 text-sm outline-none resize-none transition-colors"
                    style={{
                      background: 'var(--bg2)',
                      border: '0.5px solid var(--border2)',
                      color: 'var(--text)',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = 'var(--amber)')}
                    onBlur={(e) => (e.target.style.borderColor = 'var(--border2)')}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary self-start mt-2"
                  style={{ opacity: loading ? 0.6 : 1 }}
                >
                  {loading ? 'submitting...' : 'submit_request() →'}
                </button>

                <p className="mono text-[10px]" style={{ color: 'var(--muted)' }}>
                  No spam. No sales call unless you want one. We&apos;ll follow up
                  within 48 hours.
                </p>
              </form>
            </>
          ) : (
            <div className="text-center py-16">
              <div
                className="mono text-[10px] tracking-widest uppercase mb-6"
                style={{ color: 'var(--green)' }}
              >
                // request_received
              </div>
              <h2
                className="font-sans font-black mb-4"
                style={{ fontSize: 28, letterSpacing: '-1px' }}
              >
                You&apos;re on the list.
              </h2>
              <p
                className="text-sm leading-relaxed max-w-sm mx-auto"
                style={{ color: 'var(--muted2)' }}
              >
                We&apos;ll review your request and follow up within 48 hours. If
                Covira is the right fit for your operation, we&apos;ll get you
                onboarded fast.
              </p>
              <div
                className="mono text-[10px] mt-8"
                style={{ color: 'var(--muted)' }}
              >
                covira.io — built for the people actually doing the work
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}
