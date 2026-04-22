'use client';

import { useOfflineStore } from '@/lib/store/offlineStore';
import { useLibraryStore } from '@/lib/store/libraryStore';
import { usePlayerStore } from '@/lib/store/playerStore';
import { useUserStore } from '@/lib/store/userStore';
import Link from 'next/link';
import { DownloadCloud, Trash2, Play, WifiOff, ChevronRight, Headphones } from 'lucide-react';

function formatBytes(b: number): string {
  if (b >= 1e9) return `${(b / 1e9).toFixed(1)} GB`;
  if (b >= 1e6) return `${(b / 1e6).toFixed(0)} MB`;
  return `${(b / 1024).toFixed(0)} KB`;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function DownloadsPage() {
  const { offlineBooks, removeBookOffline, removeAllOffline, totalStorageBytes } = useOfflineStore();
  const getBySlug = useLibraryStore((s) => s.getBySlug);
  const loadBook = usePlayerStore((s) => s.loadBook);
  const history = useUserStore((s) => s.history);

  const books = Object.values(offlineBooks).sort((a, b) => b.downloadedAt - a.downloadedAt);
  const totalBytes = totalStorageBytes();

  // Helper: format seconds as h:mm:ss or m:ss
  function formatTime(secs: number): string {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  return (
    <div className="page" style={{ maxWidth: 680, margin: '0 auto', padding: '40px 20px 120px' }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'linear-gradient(135deg, var(--color-brand), var(--color-brand-dark, #1a4f8a))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <DownloadCloud size={22} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, lineHeight: 1.2 }}>My Downloads</h1>
            <p className="text-secondary text-sm" style={{ margin: '2px 0 0' }}>
              Audiobooks saved for offline listening
            </p>
          </div>
        </div>

        {books.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
              borderRadius: 20, padding: '4px 12px', fontSize: '0.8rem', color: 'var(--color-text-secondary)',
            }}>
              <WifiOff size={13} />
              {books.length} book{books.length !== 1 ? 's' : ''} · {formatBytes(totalBytes)} on device
            </div>
            {books.length > 1 && (
              <button
                onClick={() => { if (confirm(`Remove all ${books.length} downloaded books from this device?`)) removeAllOffline(); }}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: '0.78rem', color: 'var(--color-text-tertiary)',
                  textDecoration: 'underline', padding: '2px 0',
                }}
              >
                Remove all
              </button>
            )}
          </div>
        )}
      </div>

      {/* Empty state */}
      {books.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '64px 24px',
          background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--color-border)',
        }}>
          <WifiOff size={48} style={{ margin: '0 auto 20px', opacity: 0.2, display: 'block' }} />
          <h2 style={{ margin: '0 0 8px', fontSize: '1.25rem' }}>No downloads yet</h2>
          <p className="text-secondary" style={{ margin: '0 0 24px', maxWidth: 320, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>
            Open any audiobook and tap the <strong>Download</strong> tab to save it for offline listening.
          </p>
          <Link href="/audiobooks" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <Headphones size={16} /> Browse Audiobooks
          </Link>
        </div>
      )}

      {/* Book list */}
      {books.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {books.map((saved) => {
            const book = getBySlug(saved.slug);
            const cover = book?.coverImage || book?.thumbnailUrl || '';
            const historyEntry = history.find(h => h.bookId === saved.id);
            const resumeAt = historyEntry?.position ?? 0;

            // Calculate progress % if we have duration info from the book
            let progressPct: number | null = null;
            if (book && resumeAt > 0) {
              const parts = book.totalDuration?.split(':').map(Number) ?? [];
              const totalSecs = parts.length === 3
                ? parts[0] * 3600 + parts[1] * 60 + parts[2]
                : parts.length === 2 ? parts[0] * 60 + parts[1] : 0;
              if (totalSecs > 0) {
                progressPct = Math.min(100, Math.round((resumeAt / totalSecs) * 100));
              }
            }

            return (
              <div
                key={saved.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--color-border)',
                  padding: '14px 16px',
                  transition: 'box-shadow 0.15s ease',
                }}
              >
                {/* Cover */}
                <div style={{ flexShrink: 0, position: 'relative' }}>
                  {cover ? (
                    <img
                      src={cover}
                      alt={saved.title}
                      style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover', display: 'block' }}
                    />
                  ) : (
                    <div style={{
                      width: 56, height: 56, borderRadius: 8,
                      background: 'var(--color-surface-2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-tertiary)',
                    }}>
                      {saved.title.charAt(0)}
                    </div>
                  )}
                  {/* Offline indicator dot */}
                  <div style={{
                    position: 'absolute', bottom: -3, right: -3,
                    width: 16, height: 16, borderRadius: '50%',
                    background: 'var(--color-brand)', border: '2px solid var(--color-surface)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <WifiOff size={8} color="white" strokeWidth={2.5} />
                  </div>
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {saved.title}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                    <span style={{
                      fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em',
                      background: 'var(--color-surface-2)', borderRadius: 4, padding: '2px 6px',
                      color: 'var(--color-text-secondary)',
                    }}>
                      {saved.quality}
                    </span>
                    <span className="text-secondary" style={{ fontSize: '0.78rem' }}>
                      {formatBytes(saved.sizeBytes)}
                    </span>
                    {resumeAt > 0 && (
                      <span className="text-secondary" style={{ fontSize: '0.78rem' }}>
                        · {formatTime(resumeAt)}
                      </span>
                    )}
                  </div>
                  {/* Progress bar */}
                  {progressPct !== null && progressPct > 0 && (
                    <div style={{ marginTop: 6, width: '100%', height: 3, background: 'var(--color-surface-2)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ width: `${progressPct}%`, height: '100%', background: 'var(--color-brand)', borderRadius: 2 }} />
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  {/* Play / Resume button */}
                  {book && (
                    <button
                      onClick={() => loadBook(book, resumeAt)}
                      title={resumeAt > 0 ? `Resume from ${formatTime(resumeAt)}` : 'Play'}
                      style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: 'var(--color-brand)', color: 'white',
                        border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Play size={16} style={{ marginLeft: 2 }} fill="currentColor" />
                    </button>
                  )}

                  {/* View book */}
                  <Link
                    href={`/audiobook/${saved.slug}`}
                    title="View audiobook"
                    style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: 'var(--color-surface-2)', color: 'var(--color-text-secondary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, textDecoration: 'none',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <ChevronRight size={16} />
                  </Link>

                  {/* Remove */}
                  <button
                    onClick={() => removeBookOffline(saved.id)}
                    title="Remove from device"
                    style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: 'transparent', color: 'var(--color-text-tertiary)',
                      border: '1px solid var(--color-border)', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'color 0.15s ease, border-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-error)'; e.currentTarget.style.borderColor = 'var(--color-error)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-tertiary)'; e.currentTarget.style.borderColor = 'var(--color-border)'; }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer tip */}
      {books.length > 0 && (
        <div style={{
          marginTop: 32, padding: '16px 20px',
          background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          display: 'flex', alignItems: 'flex-start', gap: 12,
        }}>
          <WifiOff size={16} style={{ flexShrink: 0, marginTop: 1, color: 'var(--color-brand)' }} />
          <p className="text-secondary text-sm" style={{ margin: 0, lineHeight: 1.6 }}>
            These books play directly from your device — no internet required.
            {' '}On iOS, make sure Scroll Reader is <strong>added to your Home Screen</strong> for full offline support.
          </p>
        </div>
      )}
    </div>
  );
}
