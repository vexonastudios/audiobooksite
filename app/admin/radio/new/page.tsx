'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RadioNewPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Fields
  const [id, setId] = useState('');
  const [mp3Url, setMp3Url] = useState('');
  const [manifestUrl, setManifestUrl] = useState('');
  const [totalDuration, setTotalDuration] = useState('');
  const [chapterCount, setChapterCount] = useState('');
  const [label, setLabel] = useState('');
  const [activateNow, setActivateNow] = useState(false);

  // Auto-fill ID from MP3 URL
  function handleMp3Change(url: string) {
    setMp3Url(url);
    if (!id) {
      // Try to extract block ID from URL e.g. .../radio-2025-06-09-1430.mp3
      const match = url.match(/(radio-[\d-]+)/);
      if (match) {
        const guessedId = match[1];
        setId(guessedId);
        // Auto-fill manifest URL
        if (!manifestUrl) {
          const base = url.replace(/\.mp3$/, '');
          setManifestUrl(`${base}.manifest.json`);
        }
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!id.trim() || !mp3Url.trim() || !manifestUrl.trim()) {
      setError('Block ID, MP3 URL, and Manifest URL are required.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      // 1. Register the block
      const res = await fetch('/api/admin/radio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: id.trim(),
          mp3Url: mp3Url.trim(),
          manifestUrl: manifestUrl.trim(),
          totalDuration: totalDuration ? Number(totalDuration) : 0,
          chapterCount: chapterCount ? Number(chapterCount) : 0,
          label: label.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Failed to register block.');
        return;
      }

      // 2. Optionally activate immediately
      if (activateNow) {
        await fetch(`/api/admin/radio/${id.trim()}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });
      }

      router.push('/admin/radio');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
        <Link href="/admin/radio" style={{ color: '#718096', textDecoration: 'none', fontSize: 13 }}>← Back</Link>
        <h1 style={{ margin: 0 }}>Register Radio Block</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24, alignItems: 'start' }}>
        {/* Main form */}
        <form onSubmit={handleSubmit}>
          <div className="card">
            <h2 style={{ margin: '0 0 20px' }}>Block Details</h2>

            {error && (
              <div style={{ background: '#FEE2E2', color: '#DC2626', padding: '12px 16px', borderRadius: 8, marginBottom: 20, fontSize: 14 }}>
                {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="mp3Url">MP3 URL *</label>
              <input
                id="mp3Url"
                type="url"
                value={mp3Url}
                onChange={e => handleMp3Change(e.target.value)}
                placeholder="https://audio.scrollreader.com/radio/radio-2025-06-09-1430.mp3"
                required
              />
              <small style={{ color: '#718096', fontSize: 12, marginTop: 4, display: 'block' }}>
                The full .mp3 URL from Cloudflare R2
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="manifestUrl">Manifest URL *</label>
              <input
                id="manifestUrl"
                type="url"
                value={manifestUrl}
                onChange={e => setManifestUrl(e.target.value)}
                placeholder="https://audio.scrollreader.com/radio/radio-2025-06-09-1430.manifest.json"
                required
              />
              <small style={{ color: '#718096', fontSize: 12, marginTop: 4, display: 'block' }}>
                The .manifest.json URL from R2 (auto-filled from MP3 URL)
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="blockId">Block ID *</label>
              <input
                id="blockId"
                type="text"
                value={id}
                onChange={e => setId(e.target.value)}
                placeholder="radio-2025-06-09-1430"
                required
              />
              <small style={{ color: '#718096', fontSize: 12, marginTop: 4, display: 'block' }}>
                Auto-filled from the MP3 URL. Must match the filename used by the generator.
              </small>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label htmlFor="totalDuration">Total Duration (seconds)</label>
                <input
                  id="totalDuration"
                  type="number"
                  value={totalDuration}
                  onChange={e => setTotalDuration(e.target.value)}
                  placeholder="7200"
                  min="0"
                />
              </div>
              <div className="form-group">
                <label htmlFor="chapterCount">Chapter Count</label>
                <input
                  id="chapterCount"
                  type="number"
                  value={chapterCount}
                  onChange={e => setChapterCount(e.target.value)}
                  placeholder="24"
                  min="0"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="label">Label (optional)</label>
              <input
                id="label"
                type="text"
                value={label}
                onChange={e => setLabel(e.target.value)}
                placeholder="Evening Block — June 9"
              />
              <small style={{ color: '#718096', fontSize: 12, marginTop: 4, display: 'block' }}>
                A friendly name shown in the admin UI
              </small>
            </div>

            <hr className="section-divider" />

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <input
                id="activateNow"
                type="checkbox"
                checked={activateNow}
                onChange={e => setActivateNow(e.target.checked)}
                style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#2e6aa7' }}
              />
              <label htmlFor="activateNow" style={{
                margin: 0, textTransform: 'none', fontSize: 14,
                fontWeight: 500, letterSpacing: 0, color: '#1A202C', cursor: 'pointer',
              }}>
                Go live immediately after registering
              </label>
            </div>

            {activateNow && (
              <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, padding: '12px 16px', marginBottom: 20 }}>
                <p style={{ margin: 0, fontSize: 13, color: '#1E40AF' }}>
                  <strong>Broadcast start time</strong> will be set to <strong>right now</strong>.
                  All listeners will sync to the current playback position.
                  Any previously active block will be deactivated.
                </p>
              </div>
            )}

            <div style={{ display: 'flex', gap: 12 }}>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving…' : activateNow ? 'Register & Go Live' : 'Register Block'}
              </button>
              <Link href="/admin/radio" className="btn-secondary">Cancel</Link>
            </div>
          </div>
        </form>

        {/* Sidebar help */}
        <div className="card" style={{ background: '#F8F9FA' }}>
          <h2 style={{ margin: '0 0 16px' }}>How to get the URLs</h2>
          <p style={{ fontSize: 13, color: '#4A5568', lineHeight: 1.7, margin: '0 0 16px' }}>
            Run the generator on your desktop:
          </p>
          <pre style={{
            background: '#1A202C', color: '#9AE6B4', padding: '12px 14px',
            borderRadius: 8, fontSize: 12, lineHeight: 1.7, whiteSpace: 'pre-wrap',
            wordBreak: 'break-all', margin: '0 0 16px',
          }}>
{`cd scroll-radio-generator
node generation.js`}
          </pre>
          <p style={{ fontSize: 13, color: '#4A5568', lineHeight: 1.7, margin: '0 0 8px' }}>
            At the end of a successful run, the terminal prints:
          </p>
          <pre style={{
            background: '#1A202C', color: '#FBD38D', padding: '12px 14px',
            borderRadius: 8, fontSize: 11, lineHeight: 1.7, whiteSpace: 'pre-wrap',
            wordBreak: 'break-all', margin: '0 0 16px',
          }}>
{`✅  Block generated!
ID:       radio-2025-06-09-1430
MP3:      https://audio.scrollreader.com/...
Manifest: https://audio.scrollreader.com/...`}
          </pre>
          <p style={{ fontSize: 13, color: '#4A5568', lineHeight: 1.7, margin: 0 }}>
            Paste those URLs here. The Block ID and Manifest URL are
            auto-filled when you paste the MP3 URL.
          </p>
        </div>
      </div>
    </div>
  );
}
