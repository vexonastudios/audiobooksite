'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Mic, Play, Upload, Eye, EyeOff,
  Save, Calendar, Volume2, CheckCircle, Loader2,
} from 'lucide-react';

export interface NotifData {
  id?: string;
  title?: string;
  body_text?: string;
  audio_url?: string;
  voice_id?: string;
  published?: boolean;
  expires_at?: string;
}
const VOICE_ID = 'fnYMz3F5gMEDGMWcH1ex';

function getLocalDatetime(dateObj?: string | Date) {
  const d = dateObj ? new Date(dateObj) : new Date();
  const offsetMs = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offsetMs).toISOString().slice(0, 16);
}

export default function NotificationForm({
  initialData,
  isNew = false,
}: {
  initialData?: NotifData;
  isNew?: boolean;
}) {
  const router = useRouter();

  const [title, setTitle] = useState(initialData?.title ?? '');
  const [bodyText, setBodyText] = useState(initialData?.body_text ?? '');
  const [expiresAt, setExpiresAt] = useState(
    initialData?.expires_at ? getLocalDatetime(initialData.expires_at) : ''
  );
  const [published, setPublished] = useState(initialData?.published ?? false);
  const [audioUrl, setAudioUrl] = useState(initialData?.audio_url ?? '');

  // Preview state
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);

  // Publish state
  const [publishing, setPublishing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  // Save draft id once created
  const [savedId, setSavedId] = useState(initialData?.id ?? '');

  useEffect(() => {
    // cleanup blob URL on unmount
    return () => {
      if (previewBlobUrl) URL.revokeObjectURL(previewBlobUrl);
    };
  }, [previewBlobUrl]);

  // ── Save draft ──────────────────────────────────────────────────────────────
  const handleSaveDraft = async () => {
    if (!title.trim() || !bodyText.trim()) {
      setErrorMsg('Title and script text are required.');
      return;
    }

    setSaveStatus('saving');
    setErrorMsg('');

    try {
      let res: Response;
      const payload = {
        title: title.trim(),
        body_text: bodyText.trim(),
        voice_id: VOICE_ID,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        published,
      };

      if (isNew && !savedId) {
        res = await fetch('/api/admin/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Save failed');
        setSavedId(data.id);
      } else {
        const id = savedId || initialData?.id;
        res = await fetch(`/api/admin/notifications/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Update failed');
      }

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : 'Save failed');
      setSaveStatus('error');
    }
  };

  // ── Generate preview ────────────────────────────────────────────────────────
  const handleGeneratePreview = async () => {
    if (!bodyText.trim()) {
      setErrorMsg('Write the script text first.');
      return;
    }
    setPreviewLoading(true);
    setErrorMsg('');
    if (previewBlobUrl) {
      URL.revokeObjectURL(previewBlobUrl);
      setPreviewBlobUrl(null);
    }

    try {
      const res = await fetch('/api/admin/notifications/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: bodyText }),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: 'TTS failed' }));
        throw new Error(error);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setPreviewBlobUrl(url);

      // Auto-play the preview
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play().catch(() => {});
        setIsPlayingPreview(true);
      }
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : 'Preview failed');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleTogglePreview = () => {
    if (!audioRef.current || !previewBlobUrl) return;
    if (isPlayingPreview) {
      audioRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlayingPreview(true);
    }
  };

  // ── Publish ──────────────────────────────────────────────────────────────────
  const handlePublish = async () => {
    const id = savedId || initialData?.id;
    if (!id) {
      setErrorMsg('Save the draft first before publishing.');
      return;
    }
    if (!bodyText.trim()) {
      setErrorMsg('Script text is required.');
      return;
    }

    setPublishing(true);
    setErrorMsg('');

    try {
      // Ensure latest text/title/expiry is saved first
      await fetch(`/api/admin/notifications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          body_text: bodyText.trim(),
          expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        }),
      });

      const res = await fetch('/api/admin/notifications/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Publish failed');

      setAudioUrl(data.audio_url);
      setPublished(true);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : 'Publish failed');
    } finally {
      setPublishing(false);
    }
  };

  // ── Unpublish ─────────────────────────────────────────────────────────────
  const handleUnpublish = async () => {
    const id = savedId || initialData?.id;
    if (!id) return;
    await fetch(`/api/admin/notifications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: false }),
    });
    setPublished(false);
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => router.push('/admin/notifications')} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <ArrowLeft size={14} /> Back
          </button>
          <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Mic size={20} style={{ color: '#2e6aa7' }} />
            {isNew ? 'New Announcement' : 'Edit Announcement'}
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {saveStatus === 'saved' && (
            <span style={{ color: '#065F46', background: '#D1FAE5', padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle size={14} /> Saved!
            </span>
          )}
          {errorMsg && (
            <span style={{ color: '#991B1B', background: '#FEE2E2', padding: '6px 14px', borderRadius: 8, fontSize: 13, maxWidth: 280 }}>{errorMsg}</span>
          )}
          <button onClick={handleSaveDraft} disabled={saveStatus === 'saving'} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {saveStatus === 'saving' ? <Loader2 size={14} className="spin" /> : <Save size={14} />}
            Save Draft
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>

        {/* Left: Script editor */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Title */}
          <div className="card">
            <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Volume2 size={13} /> Announcement Details
            </h2>
            <div className="form-group">
              <label>Title / Headline *</label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. New Audiobook Added, Site Update…"
              />
            </div>
          </div>

          {/* TTS Script */}
          <div className="card">
            <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Mic size={13} /> Audio Script
            </h2>
            <p style={{ fontSize: 13, color: '#718096', marginBottom: 14, lineHeight: 1.6 }}>
              Write the text that will be converted to speech by ElevenLabs. Keep it natural — aim for 1–3 sentences.
            </p>
            <div className="form-group">
              <label>Script Text *</label>
              <textarea
                value={bodyText}
                onChange={e => setBodyText(e.target.value)}
                placeholder="Hey everyone! We just added a new audiobook by Charles Spurgeon — Morning and Evening — now available to stream for free on ScrollReader."
                rows={5}
                style={{ fontFamily: 'inherit', lineHeight: 1.65 }}
              />
              <div style={{ textAlign: 'right', fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>
                {bodyText.length} characters
              </div>
            </div>

            {/* Preview Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
              <button
                onClick={handleGeneratePreview}
                disabled={previewLoading || !bodyText.trim()}
                className="btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
              >
                {previewLoading ? <Loader2 size={14} className="spin" /> : <Mic size={14} />}
                Generate Preview
              </button>

              {previewBlobUrl && (
                <button
                  onClick={handleTogglePreview}
                  className="btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  {isPlayingPreview ? '⏸ Pause Preview' : <><Play size={14} /> Play Preview</>}
                </button>
              )}

              {previewBlobUrl && (
                <span style={{ fontSize: 12, color: '#10B981', fontWeight: 600 }}>
                  ✓ Preview ready — listen before publishing
                </span>
              )}
            </div>

            {/* Hidden audio for preview */}
            <audio
              ref={audioRef}
              onEnded={() => setIsPlayingPreview(false)}
              style={{ display: 'none' }}
            />
          </div>

          {/* Published audio URL display */}
          {audioUrl && (
            <div className="card" style={{ borderColor: '#10B981' }}>
              <h2 className="section-title" style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle size={13} /> Published Audio
              </h2>
              <p style={{ fontSize: 13, color: '#065F46', marginBottom: 12 }}>
                Audio successfully uploaded to R2 and is live.
              </p>
              <audio controls src={audioUrl} style={{ width: '100%', borderRadius: 8 }} />
              <div style={{ marginTop: 10, fontSize: 12, color: '#9CA3AF', wordBreak: 'break-all' }}>{audioUrl}</div>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Publish panel */}
          <div className="card">
            <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {published ? <Eye size={13} /> : <EyeOff size={13} />} Status
            </h2>

            <div style={{
              padding: '14px 16px',
              borderRadius: 10,
              marginBottom: 16,
              background: published ? '#D1FAE5' : '#FEF3C7',
              color: published ? '#065F46' : '#92400E',
              fontWeight: 600,
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              {published ? <CheckCircle size={16} /> : <EyeOff size={16} />}
              {published ? 'Live — showing to users' : 'Draft — not visible to users'}
            </div>

            {!published ? (
              <div>
                <p style={{ fontSize: 12, color: '#718096', marginBottom: 14, lineHeight: 1.6 }}>
                  Clicking "Publish" will generate the final audio via ElevenLabs, upload it to R2, and make this announcement visible on the home page.
                </p>
                <button
                  onClick={handlePublish}
                  disabled={publishing}
                  className="btn-primary"
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px' }}
                >
                  {publishing ? <Loader2 size={16} className="spin" /> : <Upload size={16} />}
                  {publishing ? 'Publishing…' : '🚀 Publish Announcement'}
                </button>
              </div>
            ) : (
              <button
                onClick={handleUnpublish}
                className="btn-secondary"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                <EyeOff size={14} /> Unpublish
              </button>
            )}
          </div>

          {/* Expiry */}
          <div className="card">
            <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Calendar size={13} /> Expiry
            </h2>
            <div className="form-group">
              <label>Expires At (optional)</label>
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={e => setExpiresAt(e.target.value)}
              />
              <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 6, lineHeight: 1.5 }}>
                After this date/time the banner will stop showing automatically. Leave blank for no expiry.
              </p>
            </div>
          </div>

          {/* Voice info */}
          <div className="card">
            <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Mic size={13} /> Voice
            </h2>
            <div style={{ fontSize: 13, color: '#4A5568', lineHeight: 1.6 }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>ScrollReader Voice</div>
              <div style={{ color: '#9CA3AF', fontSize: 12, fontFamily: 'monospace' }}>{VOICE_ID}</div>
              <div style={{ marginTop: 8, color: '#718096', fontSize: 12 }}>Powered by ElevenLabs</div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .spin { animation: spin-anim 0.8s linear infinite; }
        @keyframes spin-anim { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
