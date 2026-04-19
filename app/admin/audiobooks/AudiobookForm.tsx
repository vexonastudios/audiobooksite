'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface Chapter {
  title: string;
  startTime: number;
  duration: number | null;
}

interface FormData {
  // Identity
  title: string;
  slug: string;
  authorName: string;
  originalYear: string;
  pubDate: string;
  published: boolean;
  // Content
  excerpt: string;
  description: string;
  // Media
  coverImage: string;
  thumbnailUrl: string;
  mp3Url: string;
  mp3UrlLow: string;
  totalDuration: string;
  lengthStr: string;
  durationSecs: number;
  // Links
  youtubeLink: string;
  spotifyLink: string;
  buyLink: string;
  // Taxonomy
  categories: string;
  topics: string;
  // Advanced
  generatedColors: string;
  plays: number;
  // Chapters
  chapters: Chapter[];
}

const DEFAULT: FormData = {
  title: '', slug: '', authorName: '', originalYear: '',
  pubDate: new Date().toISOString().split('T')[0],
  published: true,
  excerpt: '', description: '',
  coverImage: '', thumbnailUrl: '',
  mp3Url: '', mp3UrlLow: '',
  totalDuration: '', lengthStr: '', durationSecs: 0,
  youtubeLink: '', spotifyLink: '', buyLink: '',
  categories: '', topics: '',
  generatedColors: '',
  plays: 0,
  chapters: [],
};

interface Props {
  initialData?: Partial<FormData> & { id?: string };
  mode: 'new' | 'edit';
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function parseTimestampBlock(raw: string): Chapter[] {
  const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  return lines.map(line => {
    const m = line.match(/^\((\d+:\d{2}(?::\d{2})?)\)\s+(.+?)(?:\s+-\s+Duration:\s*(\d+:\d{2}(?::\d{2})?))?$/);
    if (!m) return null;
    const toSecs = (s: string) => {
      const parts = s.split(':').map(Number);
      return parts.length === 3 ? parts[0]*3600+parts[1]*60+parts[2] : parts[0]*60+parts[1];
    };
    return { title: m[2].trim(), startTime: toSecs(m[1]), duration: m[3] ? toSecs(m[3]) : null };
  }).filter(Boolean) as Chapter[];
}

// ── Upload helpers (browser → R2 via presigned URL) ───────────────────────────
async function uploadFileToR2(file: File, filename: string): Promise<{ uploadUrl: string; publicUrl: string }> {
  const res = await fetch(`/api/admin/upload-url?filename=${encodeURIComponent(filename)}&type=${encodeURIComponent(file.type)}`);
  if (!res.ok) throw new Error('Failed to get upload URL');
  return res.json();
}

// ── Component ──────────────────────────────────────────────────────────────────
export function AudiobookForm({ initialData, mode }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<FormData>({ ...DEFAULT, ...initialData });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Upload states
  const [audioUploading, setAudioUploading] = useState(false);
  const [audioProgress, setAudioProgress] = useState('');
  const [coverUploading, setCoverUploading] = useState(false);
  const [timestampPaste, setTimestampPaste] = useState('');

  const set = (field: keyof FormData, val: unknown) =>
    setForm(f => ({ ...f, [field]: val }));

  // Auto-slug from title (only in new mode)
  const handleTitleChange = (v: string) => {
    set('title', v);
    if (mode === 'new') set('slug', slugify(v));
  };

  // ── Audio upload ──────────────────────────────────────────────────────────
  const handleAudioUpload = async (file: File) => {
    try {
      setAudioUploading(true);
      setAudioProgress('Uploading to R2…');

      // 1. Get presigned URL
      const filename = `${form.slug || slugify(form.title) || 'audiobook'}-original.mp3`;
      const { uploadUrl, publicUrl: _ } = await uploadFileToR2(file, filename);

      // 2. Upload directly to R2
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', 'audio/mpeg');
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setAudioProgress(`Uploading… ${Math.round((e.loaded / e.total) * 100)}%`);
        }
      };
      await new Promise<void>((resolve, reject) => {
        xhr.onload = () => xhr.status < 400 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`));
        xhr.onerror = () => reject(new Error('Upload error'));
        xhr.send(file);
      });

      setAudioProgress('Processing (transcoding to 128k + 64k)…');

      // 3. Trigger server-side transcoding
      const res = await fetch('/api/admin/process-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: filename }),
      });
      if (!res.ok) throw new Error(await res.text());
      const { mp3Url, mp3UrlLow, totalDuration, lengthStr, durationSecs } = await res.json();

      setForm(f => ({ ...f, mp3Url, mp3UrlLow, totalDuration, lengthStr, durationSecs }));
      setAudioProgress('✅ Done!');
    } catch (e) {
      setAudioProgress(`❌ ${String(e)}`);
    } finally {
      setAudioUploading(false);
    }
  };

  // ── Cover upload (browser → R2 directly → server-side resize) ────────────
  const handleCoverUpload = async (file: File) => {
    try {
      setCoverUploading(true);
      const slug = form.slug || slugify(form.title) || `cover-${Date.now()}`;

      // 1. Get presigned upload URL for the original
      const ext = file.name.split('.').pop() || 'jpg';
      const tempKey = `covers/temp-${slug}-${Date.now()}.${ext}`;
      const { uploadUrl } = await uploadFileToR2(file, tempKey);

      // 2. Upload original directly to R2 from browser
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });
      if (!uploadRes.ok) throw new Error(`R2 upload failed: ${uploadRes.status}`);

      // 3. Call server to resize + produce portrait + thumbnail
      const res = await fetch('/api/admin/upload-cover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: tempKey, slug }),
      });
      if (!res.ok) throw new Error(await res.text());
      const { coverImage, thumbnailUrl } = await res.json();
      setForm(f => ({ ...f, coverImage, thumbnailUrl }));
    } catch (e) {
      alert(`Cover upload failed: ${String(e)}`);
    } finally {
      setCoverUploading(false);
    }
  };

  // ── Parse timestamps ──────────────────────────────────────────────────────
  const handleParseTimestamps = () => {
    const parsed = parseTimestampBlock(timestampPaste);
    if (parsed.length === 0) { alert('No timestamps found. Check the format.'); return; }
    set('chapters', parsed);
    setTimestampPaste('');
  };

  const addChapter = () =>
    set('chapters', [...form.chapters, { title: '', startTime: 0, duration: null }]);

  const updateChapter = useCallback((i: number, field: keyof Chapter, val: unknown) => {
    setForm(f => {
      const ch = [...f.chapters];
      ch[i] = { ...ch[i], [field]: val };
      return { ...f, chapters: ch };
    });
  }, []);

  const removeChapter = (i: number) =>
    set('chapters', form.chapters.filter((_, idx) => idx !== i));

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const payload = {
        ...form,
        categories: typeof form.categories === 'string'
          ? form.categories.split(',').map(s => s.trim()).filter(Boolean)
          : form.categories,
        topics: typeof form.topics === 'string'
          ? form.topics.split(',').map(s => s.trim()).filter(Boolean)
          : form.topics,
        originalYear: form.originalYear ? Number(form.originalYear) : null,
        plays: Number(form.plays),
      };

      const url = mode === 'edit' && initialData?.id
        ? `/api/admin/audiobooks/${initialData.id}`
        : '/api/admin/audiobooks';
      const method = mode === 'edit' ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(await res.text());
      setMsg({ type: 'ok', text: mode === 'edit' ? 'Saved!' : 'Audiobook created!' });
      if (mode === 'new') {
        const { id } = await res.json();
        router.push(`/admin/audiobooks/${id}/edit`);
      }
    } catch (e) {
      setMsg({ type: 'err', text: String(e) });
    } finally {
      setSaving(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  const SectionHeader = ({ title }: { title: string }) => (
    <div style={{ borderBottom: '1px solid #2a2a2a', paddingBottom: 8, marginBottom: 20, marginTop: 32 }}>
      <h2 style={{ margin: 0, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#555' }}>{title}</h2>
    </div>
  );

  const Row2 = ({ children }: { children: React.ReactNode }) => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
      {children}
    </div>
  );

  return (
    <form onSubmit={handleSubmit}>
      {msg && (
        <div style={{
          padding: '12px 16px', borderRadius: 8, marginBottom: 20,
          background: msg.type === 'ok' ? '#052e16' : '#3b0a0a',
          color: msg.type === 'ok' ? '#4ade80' : '#f87171',
          fontSize: 14,
        }}>
          {msg.text}
        </div>
      )}

      {/* ── Basic Info ─────────────────────────────────────────────── */}
      <SectionHeader title="Basic Info" />
      <div className="form-group">
        <label>Title *</label>
        <input value={form.title} onChange={e => handleTitleChange(e.target.value)} required />
      </div>
      <Row2>
        <div className="form-group">
          <label>Slug (URL path) *</label>
          <input value={form.slug} onChange={e => set('slug', slugify(e.target.value))} required />
        </div>
        <div className="form-group">
          <label>Author Name *</label>
          <input value={form.authorName} onChange={e => set('authorName', e.target.value)} required />
        </div>
      </Row2>
      <Row2>
        <div className="form-group">
          <label>Original Publication Year</label>
          <input type="number" value={form.originalYear} onChange={e => set('originalYear', e.target.value)} placeholder="e.g. 1914" />
        </div>
        <div className="form-group">
          <label>Publish Date</label>
          <input type="date" value={form.pubDate?.split('T')[0] || ''} onChange={e => set('pubDate', e.target.value)} />
        </div>
      </Row2>
      <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <input
          type="checkbox"
          id="published"
          checked={form.published}
          onChange={e => set('published', e.target.checked)}
          style={{ width: 'auto' }}
        />
        <label htmlFor="published" style={{ margin: 0, cursor: 'pointer' }}>Published (live on site)</label>
      </div>

      {/* ── Content ─────────────────────────────────────────────────── */}
      <SectionHeader title="Content" />
      <div className="form-group">
        <label>Excerpt (short teaser)</label>
        <textarea value={form.excerpt} onChange={e => set('excerpt', e.target.value)} rows={3} />
      </div>
      <div className="form-group">
        <label>Full Description (HTML allowed)</label>
        <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={8} />
      </div>

      {/* ── Cover Image ──────────────────────────────────────────────── */}
      <SectionHeader title="Cover Image" />
      <Row2>
        <div>
          <div className="form-group">
            <label>Upload new cover</label>
            <input
              type="file"
              accept="image/*"
              onChange={e => e.target.files?.[0] && handleCoverUpload(e.target.files[0])}
              disabled={coverUploading}
            />
            {coverUploading && <div style={{ marginTop: 6, color: '#888', fontSize: 13 }}>Uploading…</div>}
          </div>
          <div className="form-group">
            <label>Cover Image URL (auto-filled after upload)</label>
            <input value={form.coverImage} onChange={e => set('coverImage', e.target.value)} placeholder="https://…" />
          </div>
          <div className="form-group">
            <label>Thumbnail URL (auto-filled after upload)</label>
            <input value={form.thumbnailUrl} onChange={e => set('thumbnailUrl', e.target.value)} placeholder="https://…" />
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: 24 }}>
          {form.coverImage ? (
            <img src={form.coverImage} alt="Cover preview" style={{ maxHeight: 200, borderRadius: 8, objectFit: 'cover', border: '1px solid #333' }} />
          ) : (
            <div style={{ width: 130, height: 195, background: '#1e1e1e', border: '2px dashed #333', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: 13 }}>
              No cover
            </div>
          )}
        </div>
      </Row2>

      {/* ── Audio ────────────────────────────────────────────────────── */}
      <SectionHeader title="Audio" />
      <div className="form-group">
        <label>Upload MP3 (auto-transcodes to 128k stereo + 64k mono)</label>
        <input
          type="file"
          accept="audio/mpeg,audio/*"
          onChange={e => e.target.files?.[0] && handleAudioUpload(e.target.files[0])}
          disabled={audioUploading}
        />
        {audioProgress && (
          <div style={{ marginTop: 6, color: audioProgress.startsWith('✅') ? '#4ade80' : audioProgress.startsWith('❌') ? '#f87171' : '#888', fontSize: 13 }}>
            {audioProgress}
          </div>
        )}
      </div>
      <Row2>
        <div className="form-group">
          <label>Standard MP3 URL (128kbps stereo — auto-filled)</label>
          <input value={form.mp3Url} onChange={e => set('mp3Url', e.target.value)} placeholder="https://audio.scrollreader.com/…-128.mp3" />
        </div>
        <div className="form-group">
          <label>Low Quality MP3 URL (64kbps mono — auto-filled)</label>
          <input value={form.mp3UrlLow} onChange={e => set('mp3UrlLow', e.target.value)} placeholder="https://audio.scrollreader.com/…-64.mp3" />
        </div>
      </Row2>
      <Row2>
        <div className="form-group">
          <label>Total Duration (auto-filled, e.g. "5:47:04")</label>
          <input value={form.totalDuration} onChange={e => set('totalDuration', e.target.value)} placeholder="H:MM:SS" />
        </div>
        <div className="form-group">
          <label>Length (auto-filled, e.g. "5h 47m")</label>
          <input value={form.lengthStr} onChange={e => set('lengthStr', e.target.value)} placeholder="Xh Ym" />
        </div>
      </Row2>

      {/* ── External Links ───────────────────────────────────────────── */}
      <SectionHeader title="External Links" />
      <Row2>
        <div className="form-group">
          <label>YouTube Link</label>
          <input value={form.youtubeLink} onChange={e => set('youtubeLink', e.target.value)} placeholder="https://youtu.be/…" />
        </div>
        <div className="form-group">
          <label>Spotify Link</label>
          <input value={form.spotifyLink} onChange={e => set('spotifyLink', e.target.value)} placeholder="https://podcasters.spotify.com/…" />
        </div>
      </Row2>
      <div className="form-group">
        <label>Buy / Physical Book Link</label>
        <input value={form.buyLink} onChange={e => set('buyLink', e.target.value)} placeholder="https://amazon.com/…" />
      </div>

      {/* ── Taxonomy ─────────────────────────────────────────────────── */}
      <SectionHeader title="Taxonomy" />
      <Row2>
        <div className="form-group">
          <label>Categories (comma-separated)</label>
          <input value={typeof form.categories === 'string' ? form.categories : (form.categories as string[]).join(', ')} onChange={e => set('categories', e.target.value)} placeholder="Church History, Biographies" />
        </div>
        <div className="form-group">
          <label>Topics (comma-separated)</label>
          <input value={typeof form.topics === 'string' ? form.topics : (form.topics as string[]).join(', ')} onChange={e => set('topics', e.target.value)} placeholder="Faith, Prayer, Revival" />
        </div>
      </Row2>

      {/* ── Advanced ─────────────────────────────────────────────────── */}
      <SectionHeader title="Advanced" />
      <Row2>
        <div className="form-group">
          <label>Play Count</label>
          <input type="number" value={form.plays} onChange={e => set('plays', Number(e.target.value))} />
        </div>
        <div className="form-group">
          <label>Generated Colors (CSS gradient)</label>
          <input value={form.generatedColors} onChange={e => set('generatedColors', e.target.value)} placeholder="linear-gradient(to bottom, …)" />
        </div>
      </Row2>

      {/* ── Chapters ─────────────────────────────────────────────────── */}
      <SectionHeader title="Chapters" />

      <div style={{ marginBottom: 16 }}>
        <label style={{ marginBottom: 6, display: 'block' }}>Paste Timestamp Block (format: <code style={{ color: '#888' }}>(0:00) Chapter 1 - Title - Duration: 12:34</code>)</label>
        <textarea
          value={timestampPaste}
          onChange={e => setTimestampPaste(e.target.value)}
          rows={5}
          placeholder={'(0:00) Chapter 1 - Introduction - Duration: 12:34\n(12:34) Chapter 2 - The Call - Duration: 8:22\n…'}
        />
        <button type="button" onClick={handleParseTimestamps} className="btn-secondary" style={{ marginTop: 8 }}>
          Parse Timestamps
        </button>
      </div>

      <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: '#888', fontSize: 13 }}>{form.chapters.length} chapter{form.chapters.length !== 1 ? 's' : ''}</span>
        <button type="button" onClick={addChapter} className="btn-secondary">+ Add Chapter</button>
      </div>

      {form.chapters.length > 0 && (
        <div style={{ border: '1px solid #2a2a2a', borderRadius: 8, overflow: 'hidden', marginBottom: 24 }}>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Title</th>
                <th>Start (secs)</th>
                <th>Duration (secs)</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {form.chapters.map((ch, i) => (
                <tr key={i}>
                  <td style={{ color: '#666', width: 32 }}>{i + 1}</td>
                  <td>
                    <input value={ch.title} onChange={e => updateChapter(i, 'title', e.target.value)} style={{ padding: '6px 8px' }} />
                  </td>
                  <td>
                    <input type="number" value={ch.startTime} onChange={e => updateChapter(i, 'startTime', Number(e.target.value))} style={{ width: 90, padding: '6px 8px' }} />
                  </td>
                  <td>
                    <input type="number" value={ch.duration ?? ''} onChange={e => updateChapter(i, 'duration', e.target.value ? Number(e.target.value) : null)} style={{ width: 90, padding: '6px 8px' }} placeholder="—" />
                  </td>
                  <td>
                    <button type="button" onClick={() => removeChapter(i)} style={{ color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}>×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Submit ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 12, paddingTop: 8, borderTop: '1px solid #2a2a2a', marginTop: 8 }}>
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? 'Saving…' : mode === 'edit' ? 'Save Changes' : 'Create Audiobook'}
        </button>
        <a href="/admin/audiobooks" className="btn-secondary">Cancel</a>
      </div>
    </form>
  );
}
