import type { Metadata } from 'next';
import { Radio, Users, Globe, Headphones, Play, Clock } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'What is Scroll Radio? — Scroll Reader',
  description: 'Learn about Scroll Radio, our 24/7 live synchronized Christian audiobook broadcast where everyone listens together.',
};

export default function ScrollRadioInfoPage() {
  return (
    <div className="page pb-24">
      {/* ── Header ── */}
      <div style={{
        textAlign: 'center',
        padding: '60px 20px 40px',
        marginBottom: 40,
        background: 'linear-gradient(135deg, var(--color-surface) 0%, rgba(229,62,62,0.05) 100%)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--color-border)',
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'linear-gradient(135deg, #e53e3e, #c53030)',
          color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px',
          boxShadow: '0 8px 24px rgba(229,62,62,0.25)',
        }}>
          <Radio size={32} />
        </div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: 16, letterSpacing: '-0.02em', color: 'var(--color-text-primary)' }}>
          What is Scroll Radio?
        </h1>
        <p style={{ fontSize: '1.125rem', color: 'var(--color-text-secondary)', maxWidth: 600, margin: '0 auto', lineHeight: 1.6 }}>
          Experience audiobooks in a completely new way. Scroll Radio is a 24/7 global broadcast where listeners around the world tune into the exact same story at the exact same time.
        </p>
      </div>

      {/* ── Features Grid ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 24,
        marginBottom: 60,
      }}>
        <div className="card" style={{ padding: 32 }}>
          <Globe size={28} style={{ color: '#e53e3e', marginBottom: 20 }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 12 }}>Global Synchronization</h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9375rem', lineHeight: 1.6, margin: 0 }}>
            When you press play on Scroll Radio, you are joining a live stream. Whether you are in New York or London, you will hear the exact same sentence being read at that very second.
          </p>
        </div>
        <div className="card" style={{ padding: 32 }}>
          <Users size={28} style={{ color: '#e53e3e', marginBottom: 20 }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 12 }}>Shared Experience</h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9375rem', lineHeight: 1.6, margin: 0 }}>
            There is something profoundly unifying about knowing that other believers are listening to the exact same chapter of a missionary biography or Puritan devotion right alongside you.
          </p>
        </div>
        <div className="card" style={{ padding: 32 }}>
          <Clock size={28} style={{ color: '#e53e3e', marginBottom: 20 }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 12 }}>24/7 Curation</h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9375rem', lineHeight: 1.6, margin: 0 }}>
            We constantly curate the broadcast loop with classic Christian audiobooks. You do not have to choose what to listen to—just tune in and let the stream minister to you.
          </p>
        </div>
      </div>

      {/* ── How to go live ── */}
      <div className="card" style={{ padding: '40px', background: 'var(--color-surface)', borderLeft: '4px solid #e53e3e' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: 20 }}>How to Go Live</h2>
        <p style={{ fontSize: '1.0625rem', color: 'var(--color-text-secondary)', marginBottom: 24, lineHeight: 1.6, maxWidth: 800 }}>
          Whenever a broadcast is active, you will see the <strong>Now Playing</strong> button in the top menu bar. 
          Simply click it to instantly synchronize your player with the global stream. 
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <button
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 20px',
              borderRadius: 'var(--radius-full)',
              background: 'linear-gradient(135deg, #e53e3e, #c53030)',
              color: 'white',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.9375rem',
              boxShadow: '0 4px 12px rgba(229,62,62,0.3)',
              cursor: 'default',
            }}
          >
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: 'white',
              display: 'inline-block',
            }} />
            Now Playing
          </button>
          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', fontWeight: 500 }}>
            ← Look for this button at the top of the screen
          </span>
        </div>
        <p style={{ fontSize: '0.9375rem', color: 'var(--color-text-muted)', marginTop: 32, marginBottom: 0 }}>
          <strong>Note:</strong> You can pause the radio at any time, but because it is a live broadcast, clicking play again will jump you forward to the current live position, not where you paused.
        </p>
      </div>
      
      <div style={{ textAlign: 'center', marginTop: 60 }}>
        <Link href="/" className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', fontWeight: 600 }}>
          <Headphones size={18} />
          Back to Browse
        </Link>
      </div>
    </div>
  );
}
