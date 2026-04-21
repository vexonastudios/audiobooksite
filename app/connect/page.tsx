'use client';

import Link from 'next/link';

// ── Platform data ─────────────────────────────────────────────────────────────

const PODCAST_PLATFORMS = [
  {
    id: 'spotify',
    label: 'Spotify',
    href: 'https://podcasters.spotify.com/pod/show/scrollreader',
    color: '#1DB954',
    textColor: '#fff',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width={28} height={28}>
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.441 17.307a.75.75 0 01-1.033.25c-2.832-1.731-6.395-2.122-10.594-1.163a.75.75 0 01-.337-1.462c4.593-1.055 8.532-.6 11.714 1.343a.75.75 0 01.25 1.032zm1.452-3.23a.937.937 0 01-1.29.308c-3.24-1.99-8.182-2.566-12.018-1.404a.938.938 0 01-.543-1.794c4.38-1.33 9.83-.686 13.543 1.6a.938.938 0 01.308 1.29zm.125-3.362C15.53 8.41 9.77 8.21 6.147 9.316a1.125 1.125 0 01-.652-2.151c4.215-1.278 11.22-1.031 15.647 1.666a1.125 1.125 0 01-1.124 1.948v-.064z" />
      </svg>
    ),
  },
  {
    id: 'apple',
    label: 'Apple Podcasts',
    href: 'https://podcasts.apple.com/us/podcast/scroll-reader-free-christian-audiobooks/id1719315979',
    color: '#872EC4',
    textColor: '#fff',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width={28} height={28}>
        <path d="M12.003 0C5.374 0 0 5.374 0 12.003 0 18.629 5.374 24 12.003 24 18.629 24 24 18.63 24 12.003 24 5.374 18.63 0 12.003 0zm.495 4.078a7.46 7.46 0 017.46 7.46c0 2.075-.847 3.953-2.212 5.312a.435.435 0 01-.621-.003.436.436 0 01-.003-.621 6.581 6.581 0 001.957-4.688 6.58 6.58 0 00-6.581-6.58 6.58 6.58 0 00-6.58 6.58c0 1.84.754 3.506 1.969 4.704a.437.437 0 01-.617.618 7.448 7.448 0 01-2.232-5.322 7.46 7.46 0 017.46-7.46zm.004 2.744a4.716 4.716 0 014.716 4.716 4.71 4.71 0 01-1.587 3.504.437.437 0 01-.58-.651 3.836 3.836 0 001.29-2.853 3.84 3.84 0 00-3.839-3.839 3.84 3.84 0 00-3.839 3.839c0 1.08.445 2.056 1.16 2.757a.437.437 0 01-.614.621 4.704 4.704 0 01-1.423-3.378 4.716 4.716 0 014.716-4.716zm.015 2.99a1.71 1.71 0 011.71 1.71c0 .64-.351 1.196-.871 1.496v3.73a.84.84 0 01-1.679 0v-3.73a1.707 1.707 0 01-.87-1.496 1.71 1.71 0 011.71-1.71z" />
      </svg>
    ),
  },
  {
    id: 'youtube',
    label: 'YouTube',
    href: 'https://www.youtube.com/@scrollreaderaudio',
    color: '#FF0000',
    textColor: '#fff',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width={28} height={28}>
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
  {
    id: 'rss',
    label: 'RSS Feed',
    href: 'https://scrollreader.com/feed/',
    color: '#F26522',
    textColor: '#fff',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width={28} height={28}>
        <path d="M6.18 15.64a2.18 2.18 0 012.18 2.18C8.36 19.01 7.38 20 6.18 20C4.98 20 4 19.01 4 17.82a2.18 2.18 0 012.18-2.18M4 4.44A15.56 15.56 0 0119.56 20h-2.83A12.73 12.73 0 004 7.27V4.44m0 5.66a9.9 9.9 0 019.9 9.9h-2.83A7.07 7.07 0 004 12.93V10.1z" />
      </svg>
    ),
  },
];

const SOCIAL_LINKS = [
  {
    id: 'instagram',
    label: 'Instagram',
    handle: '@scrollreader',
    href: 'https://www.instagram.com/scrollreader/',
    color: '#E1306C',
    bgGradient: 'linear-gradient(135deg, #405DE6, #5851DB, #833AB4, #C13584, #E1306C, #FD1D1D)',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width={24} height={24}>
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
  },
  {
    id: 'facebook',
    label: 'Facebook',
    handle: 'scrollreaderaudio',
    href: 'https://www.facebook.com/scrollreaderaudio/',
    color: '#fff',
    bgGradient: 'linear-gradient(135deg, #1877F2, #0b5ed7)',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width={24} height={24}>
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    id: 'youtube-social',
    label: 'YouTube',
    handle: '@scrollreaderaudio',
    href: 'https://www.youtube.com/@scrollreaderaudio',
    color: '#fff',
    bgGradient: 'linear-gradient(135deg, #FF0000, #cc0000)',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width={24} height={24}>
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    handle: 'WhatsApp Channel',
    href: 'https://whatsapp.com/channel/0029Va9WhVUA89Mo0MN2Kh0c',
    color: '#fff',
    bgGradient: 'linear-gradient(135deg, #25D366, #128C7E)',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width={24} height={24}>
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    ),
  },
  {
    id: 'twitter',
    label: 'Twitter / X',
    handle: '@scroll_reader',
    href: 'https://twitter.com/scroll_reader',
    color: '#fff',
    bgGradient: 'linear-gradient(135deg, #14171A, #333)',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width={24} height={24}>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.733-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
];

// ── Section subcomponents ─────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28,
    }}>
      <div style={{
        height: 3, flex: 1, background: 'linear-gradient(to right, var(--color-brand), transparent)',
        borderRadius: 2,
      }} />
      <h2 style={{
        fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.12em',
        textTransform: 'uppercase', color: 'var(--color-brand)', whiteSpace: 'nowrap',
      }}>{children}</h2>
      <div style={{
        height: 3, flex: 1, background: 'linear-gradient(to left, var(--color-brand), transparent)',
        borderRadius: 2,
      }} />
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ConnectPage() {
  return (
    <div className="page" style={{ maxWidth: 740, margin: '0 auto' }}>

      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: 56, paddingTop: 8 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 72, height: 72, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--color-brand), #0e4f8a)',
          marginBottom: 20, boxShadow: '0 8px 32px rgba(31, 106, 176, 0.35)',
        }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={32} height={32}>
            <path d="M18 8h1a4 4 0 010 8h-1" /><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" />
            <line x1="6" y1="1" x2="6" y2="4" /><line x1="10" y1="1" x2="10" y2="4" /><line x1="14" y1="1" x2="14" y2="4" />
          </svg>
        </div>
        <h1 style={{
          fontSize: 'clamp(1.75rem, 5vw, 2.5rem)', fontWeight: 800,
          margin: '0 0 12px', letterSpacing: '-0.02em', lineHeight: 1.15,
          color: 'var(--color-text-primary)',
        }}>
          Stay Connected
        </h1>
        <p style={{
          fontSize: '1.0625rem', color: 'var(--color-text-muted)',
          maxWidth: 520, margin: '0 auto', lineHeight: 1.7,
        }}>
          Subscribe for monthly email updates, follow us on social media,
          or listen on your favourite podcast app.
        </p>
      </div>

      {/* ── Email Subscribe ───────────────────────────────────────── */}
      <section style={{ marginBottom: 56 }}>
        <SectionLabel>Monthly Email Updates</SectionLabel>
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          padding: '32px 28px',
          boxShadow: 'var(--shadow-md)',
        }}>
          <p style={{
            textAlign: 'center', fontSize: '0.9375rem',
            color: 'var(--color-text-muted)', marginBottom: 24, lineHeight: 1.65,
          }}>
            Emails go out roughly <strong style={{ color: 'var(--color-text-primary)' }}>once a month</strong> when there are new audiobooks.
            No spam — we promise.
          </p>
          <form
            id="mc-embedded-subscribe-form"
            action="https://illbehonest.us1.list-manage.com/subscribe/post?u=9c494abdff33325a866cb7097&id=c7a95d58a7&f_id=00dcc2e1f0"
            method="post"
            name="mc-embedded-subscribe-form"
            target="_blank"
            style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}
          >
            <div style={{ flex: '1 1 260px', minWidth: 0 }}>
              <label htmlFor="mce-EMAIL" style={{
                display: 'block', fontSize: '0.8rem', fontWeight: 600,
                marginBottom: 6, color: 'var(--color-text-secondary)',
              }}>
                Email Address
              </label>
              <input
                type="email"
                name="EMAIL"
                id="mce-EMAIL"
                required
                placeholder="you@example.com"
                style={{
                  width: '100%', padding: '11px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1.5px solid var(--color-border)',
                  background: 'var(--color-surface-2)',
                  color: 'var(--color-text-primary)',
                  fontSize: '0.9375rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                type="submit"
                id="mc-embedded-subscribe"
                name="subscribe"
                style={{
                  padding: '11px 28px',
                  background: 'linear-gradient(135deg, var(--color-brand), #0e4f8a)',
                  color: '#fff', border: 'none', borderRadius: 'var(--radius-md)',
                  fontWeight: 700, fontSize: '0.9375rem', cursor: 'pointer',
                  transition: 'opacity 0.2s ease', whiteSpace: 'nowrap',
                }}
                onMouseOver={e => (e.currentTarget.style.opacity = '0.88')}
                onMouseOut={e => (e.currentTarget.style.opacity = '1')}
              >
                Subscribe →
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* ── Podcast Apps ─────────────────────────────────────────── */}
      <section style={{ marginBottom: 56 }}>
        <SectionLabel>Listen on Podcast Apps</SectionLabel>
        <p style={{
          fontSize: '0.9rem', color: 'var(--color-text-muted)',
          marginBottom: 20, lineHeight: 1.7,
        }}>
          Find us on all major podcast platforms. <strong style={{ color: 'var(--color-text-primary)' }}>Tip for Spotify:</strong> find the
          book you want on this site first, then tap the Spotify link on that audiobook&apos;s page — it takes you straight to the right episode.
          You can also{' '}
          <Link href="https://scrollreader.com/feed/" target="_blank" rel="noopener" style={{ color: 'var(--color-brand)', fontWeight: 600 }}>
            pull our RSS feed
          </Link>{' '}
          into any podcast app directly.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {PODCAST_PLATFORMS.map(p => (
            <a
              key={p.id}
              href={p.href}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', gap: 16,
                padding: '16px 20px',
                background: p.color,
                borderRadius: 'var(--radius-lg)',
                textDecoration: 'none',
                transition: 'transform 0.18s ease, box-shadow 0.18s ease',
                boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
                color: p.textColor,
              }}
              onMouseOver={e => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)';
              }}
              onMouseOut={e => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.12)';
              }}
            >
              <div style={{ flexShrink: 0, color: p.textColor }}>{p.icon}</div>
              <span style={{ fontWeight: 700, fontSize: '1rem' }}>Listen on {p.label}</span>
              <div style={{ marginLeft: 'auto', opacity: 0.7 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" width={18} height={18}>
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* ── Social Media ─────────────────────────────────────────── */}
      <section style={{ marginBottom: 40 }}>
        <SectionLabel>Follow on Social Media</SectionLabel>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 14,
        }}>
          {SOCIAL_LINKS.map(s => (
            <a
              key={s.id}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: 10,
                padding: '24px 16px',
                background: s.bgGradient,
                borderRadius: 'var(--radius-lg)',
                textDecoration: 'none',
                color: s.color,
                transition: 'transform 0.18s ease, box-shadow 0.18s ease',
                boxShadow: '0 2px 12px rgba(0,0,0,0.14)',
                textAlign: 'center',
              }}
              onMouseOver={e => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px) scale(1.02)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 10px 28px rgba(0,0,0,0.22)';
              }}
              onMouseOut={e => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0) scale(1)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.14)';
              }}
            >
              <div style={{ color: s.color }}>{s.icon}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{s.label}</div>
                <div style={{ fontSize: '0.78rem', opacity: 0.85, marginTop: 2 }}>{s.handle}</div>
              </div>
            </a>
          ))}
        </div>
      </section>

    </div>
  );
}
