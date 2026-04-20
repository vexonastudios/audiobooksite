'use client';

import { useState } from 'react';
import { Mail, Send, CheckCircle, AlertCircle, MessageSquare, Phone, MapPin } from 'lucide-react';

const SUBJECTS = [
  'General Inquiry',
  'Technical Issue',
  'Content Request',
  'Report a Problem',
  'Feedback / Suggestion',
  'Partnership / Collaboration',
  'Other',
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: SUBJECTS[0], message: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    setErrorMsg('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong.');
      setStatus('success');
      setForm({ name: '', email: '', subject: SUBJECTS[0], message: '' });
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.message);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '13px 16px',
    borderRadius: 'var(--radius-lg)',
    border: '1.5px solid var(--color-border)',
    background: 'var(--color-surface)',
    color: 'var(--color-text-primary)',
    fontSize: '0.9375rem',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    fontFamily: 'inherit',
  };

  return (
    <div className="page pb-24">
      {/* Header */}
      <div style={{ marginBottom: 40, textAlign: 'center', maxWidth: 560, margin: '0 auto 40px' }}>
        <div style={{
          width: 60, height: 60, borderRadius: '50%',
          background: 'rgba(46,106,167,0.1)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', margin: '0 auto 16px',
        }}>
          <MessageSquare size={28} color="var(--color-brand)" />
        </div>
        <h1 style={{ marginBottom: 10 }}>Contact Us</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.0625rem', margin: 0 }}>
          Have a question, suggestion, or found an issue? We'd love to hear from you. Fill out the form and we'll get back to you via email.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0,2.5fr) minmax(0,1fr)',
        gap: 32,
        maxWidth: 860,
        margin: '0 auto',
        alignItems: 'start',
      }} className="contact-layout">

        {/* ── Form ── */}
        <div className="card" style={{ padding: 32 }}>
          {status === 'success' ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <CheckCircle size={52} color="#22c55e" style={{ marginBottom: 16 }} />
              <h2 style={{ marginBottom: 8, fontSize: '1.375rem' }}>Message Sent!</h2>
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: 24, fontSize: '0.9375rem' }}>
                Thanks for reaching out. We'll get back to you at <strong>{form.email || 'your email'}</strong> as soon as possible.
              </p>
              <button
                onClick={() => setStatus('idle')}
                className="btn btn-secondary"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Your Name *
                  </label>
                  <input
                    name="name"
                    type="text"
                    required
                    placeholder="John Smith"
                    value={form.name}
                    onChange={handleChange}
                    style={inputStyle}
                    onFocus={e => { e.currentTarget.style.borderColor = 'var(--color-brand)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(46,106,167,0.1)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Email Address *
                  </label>
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={handleChange}
                    style={inputStyle}
                    onFocus={e => { e.currentTarget.style.borderColor = 'var(--color-brand)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(46,106,167,0.1)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Subject *
                </label>
                <div style={{ position: 'relative' }}>
                  <select
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    style={{ ...inputStyle, appearance: 'none', WebkitAppearance: 'none', paddingRight: 40 }}
                    onFocus={e => { e.currentTarget.style.borderColor = 'var(--color-brand)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(46,106,167,0.1)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--color-text-muted)', fontSize: 12 }}>▼</span>
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', marginBottom: 6, fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Message *
                </label>
                <textarea
                  name="message"
                  required
                  placeholder="Tell us what's on your mind…"
                  value={form.message}
                  onChange={handleChange}
                  rows={6}
                  style={{ ...inputStyle, resize: 'vertical', minHeight: 140 }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'var(--color-brand)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(46,106,167,0.1)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.boxShadow = 'none'; }}
                />
                <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
                  {form.message.length} / 5000
                </div>
              </div>

              {status === 'error' && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '12px 16px', borderRadius: 'var(--radius-md)',
                  background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                  color: '#dc2626', marginBottom: 16, fontSize: '0.875rem',
                }}>
                  <AlertCircle size={18} />
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={status === 'sending'}
                className="btn"
                style={{
                  width: '100%',
                  padding: '14px 24px',
                  background: 'var(--color-brand)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--radius-lg)',
                  fontSize: '1rem',
                  fontWeight: 700,
                  cursor: status === 'sending' ? 'not-allowed' : 'pointer',
                  opacity: status === 'sending' ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  transition: 'all 0.2s',
                }}
              >
                {status === 'sending' ? (
                  <>
                    <span style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                    Sending…
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Send Message
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* ── Info Panel ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            {
              icon: Mail,
              title: 'Email',
              body: 'We respond to all messages and aim to reply within 1–2 business days.',
            },
            {
              icon: MessageSquare,
              title: 'Content Requests',
              body: 'Have a classic Christian audiobook you\'d love to see here? Let us know!',
            },
            {
              icon: CheckCircle,
              title: 'Bug Reports',
              body: 'Found a playback issue or broken link? Please describe it and we\'ll fix it fast.',
            },
          ].map(item => (
            <div key={item.title} className="card" style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: 'rgba(46,106,167,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <item.icon size={18} color="var(--color-brand)" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: 4, color: 'var(--color-text-primary)' }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                    {item.body}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .contact-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
