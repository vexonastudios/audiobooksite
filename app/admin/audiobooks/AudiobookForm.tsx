'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface Chapter {
  title: string;
  startTime: number;
  duration: number | null;
}

interface FormData {
  title: string; slug: string; authorName: string; originalYear: string;
  pubDate: string; published: boolean;
  excerpt: string; description: string;
  coverImage: string; thumbnailUrl: string;
  mp3Url: string; mp3UrlLow: string;
  totalDuration: string; lengthStr: string; durationSecs: number;
  youtubeLink: string; spotifyLink: string; buyLink: string;
  categories: string[]; topics: string[];
  generatedColors: string; plays: number;
  chapters: Chapter[];
}

interface Metadata {
  categories: string[];
  topics: string[];
  authors: string[];
}

const DEFAULT: FormData = {
  title: '', slug: '', authorName: '', originalYear: '',
  pubDate: new Date().toISOString().split('T')[0], published: true,
  excerpt: '', description: '',
  coverImage: '', thumbnailUrl: '',
  mp3Url: '', mp3UrlLow: '',
  totalDuration: '', lengthStr: '', durationSecs: 0,
  youtubeLink: '', spotifyLink: '', buyLink: '',
  categories: [], topics: [],
  generatedColors: '', plays: 0, chapters: [],
};

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

async function getPresignedUrl(filename: string, type: string) {
  const res = await fetch(`/api/admin/upload-url?filename=${encodeURIComponent(filename)}&type=${encodeURIComponent(type)}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<{ uploadUrl: string; publicUrl: string }>;
}

// ── Tag Input Component ────────────────────────────────────────────────────────
function TagInput({
  label, value, onChange, suggestions,
}: {
  label: string;
  value: string[];
  onChange: (v: string[]) => void;
  suggestions: string[];
}) {
  const [input, setInput] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = suggestions.filter(
    s => s.toLowerCase().includes(input.toLowerCase()) && !value.includes(s)
  );

  const add = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !value.includes(trimmed)) onChange([...value, trimmed]);
    setInput('');
    setOpen(false);
  };

  const remove = (tag: string) => onChange(value.filter(t => t !== tag));

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <label>{label}</label>
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 6,
        border: '1px solid #E2E8F0', borderRadius: 8,
        padding: '8px 10px', background: '#fff', cursor: 'text',
        minHeight: 42, alignItems: 'center',
      }}
        onClick={() => { setOpen(true); }}
      >
        {value.map(tag => (
          <span key={tag} style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            background: '#EFF6FF', color: '#1D4ED8',
            borderRadius: 6, padding: '3px 8px', fontSize: 13, fontWeight: 500,
          }}>
            {tag}
            <button
              type="button"
              onClick={e => { e.stopPropagation(); remove(tag); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#93C5FD', padding: 0, lineHeight: 1, fontSize: 14 }}
            >×</button>
          </span>
        ))}
        <input
          value={input}
          onChange={e => { setInput(e.target.value); setOpen(true); }}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); if (input.trim()) add(input); }
            if (e.key === 'Backspace' && !input && value.length) remove(value[value.length - 1]);
          }}
          onFocus={() => setOpen(true)}
          placeholder={value.length === 0 ? `Add ${label.toLowerCase()}…` : ''}
          style={{
            border: 'none', outline: 'none', background: 'transparent',
            fontSize: 14, padding: '2px 4px', minWidth: 120, flex: 1, width: 'auto',
          }}
        />
      </div>
      {open && filtered.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
          background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8,
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)', maxHeight: 200, overflowY: 'auto',
          marginTop: 4,
        }}>
          {filtered.map(s => (
            <div key={s}
              onMouseDown={e => { e.preventDefault(); add(s); }}
              style={{ padding: '9px 14px', cursor: 'pointer', fontSize: 14, color: '#1A202C' }}
              className="tag-suggestion"
            >
              {s}
            </div>
          ))}
        </div>
      )}
      <style>{`.tag-suggestion:hover { background: #F0F4F8; }`}</style>
    </div>
  );
}

// ── Author Combobox ────────────────────────────────────────────────────────────
function AuthorInput({ value, onChange, suggestions }: { value: string; onChange: (v: string) => void; suggestions: string[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const filtered = suggestions.filter(s => s.toLowerCase().includes(value.toLowerCase()));

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <label>Author Name *</label>
      <input
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="Author name…"
        required
      />
      {open && filtered.length > 0 && value.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
          background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8,
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)', maxHeight: 200, overflowY: 'auto',
          marginTop: 4,
        }}>
          {filtered.map(s => (
            <div key={s}
              onMouseDown={e => { e.preventDefault(); onChange(s); setOpen(false); }}
              style={{ padding: '9px 14px', cursor: 'pointer', fontSize: 14, color: '#1A202C' }}
              className="tag-suggestion"
            >
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Form ──────────────────────────────────────────────────────────────────
export interface AudiobookFormInitial extends Partial<FormData> { id?: string }

export function AudiobookForm({ initialData, mode }: { initialData?: AudiobookFormInitial; mode: 'new' | 'edit' }) {
  const router = useRouter();
  const [form, setForm] = useState<FormData>({ ...DEFAULT, ...initialData });
  const [meta, setMeta] = useState<Metadata>({ categories: [], topics: [], authors: [] });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [audioUploading, setAudioUploading] = useState(false);
  const [audioProgress, setAudioProgress] = useState('');
  const [coverUploading, setCoverUploading] = useState(false);
  const [timestampPaste, setTimestampPaste] = useState('');

  // Load metadata (existing categories, topics, authors)
  useEffect(() => {
    fetch('/api/admin/metadata').then(r => r.json()).then(setMeta).catch(() => {});
  }, []);

  const set = (field: keyof FormData, val: unknown) => setForm(f => ({ ...f, [field]: val }));

  const handleTitleChange = (v: string) => {
    set('title', v);
    if (mode === 'new') set('slug', slugify(v));
  };

  // ── Audio upload ──────────────────────────────────────────────────────────────
  const handleAudioUpload = async (file: File) => {
    try {
      setAudioUploading(true);
      setAudioProgress('Uploading to R2…');

      const slug = form.slug || slugify(form.title) || 'audiobook';
      const filename = `${slug}-original.mp3`;
      const { uploadUrl } = await getPresignedUrl(filename, 'audio/mpeg');

      const xhr = new XMLHttpRequest();
      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', 'audio/mpeg');
      xhr.upload.onprogress = e => {
        if (e.lengthComputable) setAudioProgress(`Uploading… ${Math.round((e.loaded / e.total) * 100)}%`);
      };
      await new Promise<void>((resolve, reject) => {
        xhr.onload = () => xhr.status < 400 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`));
        xhr.onerror = () => reject(new Error('Network error'));
        xhr.send(file);
      });

      setAudioProgress('Processing (transcoding 128k stereo + 64k mono)…');
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

  // ── Cover upload ──────────────────────────────────────────────────────────────
  const handleCoverUpload = async (file: File) => {
    try {
      setCoverUploading(true);
      const slug = form.slug || slugify(form.title) || `cover-${Date.now()}`;
      const ext = file.name.split('.').pop() || 'jpg';
      const tempKey = `covers/temp-${slug}-${Date.now()}.${ext}`;
      const { uploadUrl } = await getPresignedUrl(tempKey, file.type);

      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT', body: file,
        headers: { 'Content-Type': file.type },
      });
      if (!uploadRes.ok) throw new Error(`R2 upload failed: ${uploadRes.status}`);

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

  // ── Chapters ──────────────────────────────────────────────────────────────────
  const handleParseTimestamps = () => {
    const parsed = parseTimestampBlock(timestampPaste);
    if (!parsed.length) { alert('No timestamps found. Check the format.'); return; }
    set('chapters', parsed);
    setTimestampPaste('');
  };

  const addChapter = () => set('chapters', [...form.chapters, { title: '', startTime: 0, duration: null }]);
  const removeChapter = (i: number) => set('chapters', form.chapters.filter((_, idx) => idx !== i));
  const updateChapter = useCallback((i: number, field: keyof Chapter, val: unknown) => {
    setForm(f => {
      const ch = [...f.chapters];
      ch[i] = { ...ch[i], [field]: val };
      return { ...f, chapters: ch };
    });
  }, []);

  // ── Save ──────────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setMsg(null);
    try {
      const payload = {
        ...form,
        originalYear: form.originalYear ? Number(form.originalYear) : null,
        plays: Number(form.plays),
      };
      const url = mode === 'edit' && initialData?.id
        ? `/api/admin/audiobooks/${initialData.id}` : '/api/admin/audiobooks';
      const res = await fetch(url, {
        method: mode === 'edit' ? 'PUT' : 'POST',
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

  const Row2 = ({ children }: { children: React.ReactNode }) => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
      {children}
    </div>
  );

  const SectionTitle = ({ title }: { title: string }) => (
    <>
      <hr className="section-divider" />
      <p className="section-title">{title}</p>
    </>
  );

  return (
    <form onSubmit={handleSubmit}>
      {msg && (
        <div style={{
          padding: '12px 16px', borderRadius: 8, marginBottom: 20, fontSize: 14,
          background: msg.type === 'ok' ? '#D1FAE5' : '#FEE2E2',
          color: msg.type === 'ok' ? '#065F46' : '#991B1B',
          border: `1px solid ${msg.type === 'ok' ? '#A7F3D0' : '#FECACA'}`,
        }}>
          {msg.text}
        </div>
      )}

      {/* ── Basic Info ─────────────────────────────────────────────── */}
      <p className="section-title" style={{ marginTop: 0 }}>Basic Info</p>
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
          <AuthorInput value={form.authorName} onChange={v => set('authorName', v)} suggestions={meta.authors} />
        </div>
      </Row2>
      <Row2>
        <div className="form-group">
          <label>Original Publication Year</label>
          <input type="number" value={form.originalYear} onChange={e => set('originalYear', e.target.value)} placeholder="e.g. 1887" />
        </div>
        <div className="form-group">
          <label>Publish Date</label>
          <input type="date" value={form.pubDate?.split('T')[0] || ''} onChange={e => set('pubDate', e.target.value)} />
        </div>
      </Row2>
      <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <input type="checkbox" id="published" checked={form.published}
          onChange={e => set('published', e.target.checked)} style={{ width: 'auto', accentColor: '#2e6aa7' }} />
        <label htmlFor="published" style={{ margin: 0, cursor: 'pointer', textTransform: 'none', letterSpacing: 0, fontSize: 14, fontWeight: 500, color: '#1A202C' }}>
          Published (live on site)
        </label>
      </div>

      {/* ── Content ─────────────────────────────────────────────────── */}
      <SectionTitle title="Content" />
      <div className="form-group">
        <label>Excerpt (short teaser)</label>
        <textarea value={form.excerpt} onChange={e => set('excerpt', e.target.value)} rows={3} />
      </div>
      <div className="form-group">
        <label>Full Description (HTML allowed)</label>
        <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={8} />
      </div>

      {/* ── Cover Image ──────────────────────────────────────────────── */}
      <SectionTitle title="Cover Image" />
      <Row2>
        <div>
          <div className="form-group">
            <label>Upload Cover (auto-creates tall + square)</label>
            <input type="file" accept="image/*"
              onChange={e => e.target.files?.[0] && handleCoverUpload(e.target.files[0])}
              disabled={coverUploading} />
            {coverUploading && (
              <div style={{ marginTop: 6, color: '#2e6aa7', fontSize: 13 }}>
                Uploading and processing…
              </div>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label>Tall Cover (t-{'{slug}'}.webp)</label>
              <input value={form.coverImage} onChange={e => set('coverImage', e.target.value)} placeholder="Auto-filled after upload" />
            </div>
            <div className="form-group">
              <label>Square (1024-{'{slug}'}.webp)</label>
              <input value={form.thumbnailUrl} onChange={e => set('thumbnailUrl', e.target.value)} placeholder="Auto-filled after upload" />
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', paddingTop: 24 }}>
          {form.coverImage ? (
            <img src={form.coverImage} alt="Tall cover"
              style={{ maxHeight: 180, borderRadius: 8, objectFit: 'cover', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
          ) : (
            <div style={{ width: 110, height: 160, background: '#F0F4F8', border: '2px dashed #CBD5E0', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A0AEB0', fontSize: 12 }}>
              Tall cover
            </div>
          )}
          {form.thumbnailUrl && (
            <img src={form.thumbnailUrl} alt="Square thumbnail"
              style={{ width: 64, height: 64, borderRadius: 8, objectFit: 'cover', border: '1px solid #E2E8F0' }} />
          )}
        </div>
      </Row2>

      {/* ── Audio ────────────────────────────────────────────────────── */}
      <SectionTitle title="Audio" />
      <div className="form-group">
        <label>Upload MP3 → auto-transcodes to 128k stereo + 64k mono</label>
        <input type="file" accept="audio/mpeg,audio/*"
          onChange={e => e.target.files?.[0] && handleAudioUpload(e.target.files[0])}
          disabled={audioUploading} />
        {audioProgress && (
          <div style={{ marginTop: 6, fontSize: 13, color: audioProgress.startsWith('✅') ? '#059669' : audioProgress.startsWith('❌') ? '#DC2626' : '#2e6aa7' }}>
            {audioProgress}
          </div>
        )}
      </div>
      <Row2>
        <div className="form-group">
          <label>Standard MP3 (128kbps stereo)</label>
          <input value={form.mp3Url} onChange={e => set('mp3Url', e.target.value)} placeholder="https://audio.scrollreader.com/…-128.mp3" />
        </div>
        <div className="form-group">
          <label>Low Quality MP3 (64kbps mono)</label>
          <input value={form.mp3UrlLow} onChange={e => set('mp3UrlLow', e.target.value)} placeholder="Auto-filled after upload" />
        </div>
      </Row2>
      <Row2>
        <div className="form-group">
          <label>Total Duration (auto-filled)</label>
          <input value={form.totalDuration} onChange={e => set('totalDuration', e.target.value)} placeholder="H:MM:SS" />
        </div>
        <div className="form-group">
          <label>Length (auto-filled)</label>
          <input value={form.lengthStr} onChange={e => set('lengthStr', e.target.value)} placeholder="5h 47m" />
        </div>
      </Row2>

      {/* ── External Links ───────────────────────────────────────────── */}
      <SectionTitle title="External Links" />
      <Row2>
        <div className="form-group">
          <label>YouTube</label>
          <input value={form.youtubeLink} onChange={e => set('youtubeLink', e.target.value)} placeholder="https://youtu.be/…" />
        </div>
        <div className="form-group">
          <label>Spotify</label>
          <input value={form.spotifyLink} onChange={e => set('spotifyLink', e.target.value)} placeholder="https://podcasters.spotify.com/…" />
        </div>
      </Row2>
      <div className="form-group">
        <label>Buy / Physical Book Link</label>
        <input value={form.buyLink} onChange={e => set('buyLink', e.target.value)} placeholder="https://amazon.com/…" />
      </div>

      {/* ── Taxonomy ─────────────────────────────────────────────────── */}
      <SectionTitle title="Taxonomy" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <TagInput label="Categories" value={form.categories} onChange={v => set('categories', v)} suggestions={meta.categories} />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <TagInput label="Topics" value={form.topics} onChange={v => set('topics', v)} suggestions={meta.topics} />
        </div>
      </div>
      <p style={{ fontSize: 12, color: '#718096', margin: '4px 0 0' }}>
        Type to filter existing entries, or type a new one and press Enter to add it.
      </p>

      {/* ── Advanced ─────────────────────────────────────────────────── */}
      <SectionTitle title="Advanced" />
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
      <SectionTitle title="Chapters" />
      <div style={{ marginBottom: 16 }}>
        <label style={{ marginBottom: 6, display: 'block' }}>
          Paste Timestamp Block <span style={{ color: '#718096', fontWeight: 400 }}>(format: (0:00) Chapter Title - Duration: 12:34)</span>
        </label>
        <textarea value={timestampPaste} onChange={e => setTimestampPaste(e.target.value)} rows={5}
          placeholder={'(0:00) Chapter 1 - Introduction - Duration: 12:34\n(12:34) Chapter 2 - The Call - Duration: 8:22\n…'} />
        <button type="button" onClick={handleParseTimestamps} className="btn-secondary" style={{ marginTop: 8 }}>
          Parse Timestamps
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 13, color: '#718096' }}>{form.chapters.length} chapter{form.chapters.length !== 1 ? 's' : ''}</span>
        <button type="button" onClick={addChapter} className="btn-secondary">+ Add Chapter</button>
      </div>

      {form.chapters.length > 0 && (
        <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden', marginBottom: 24 }}>
          <table>
            <thead>
              <tr><th>#</th><th>Title</th><th>Start (s)</th><th>Duration (s)</th><th></th></tr>
            </thead>
            <tbody>
              {form.chapters.map((ch, i) => (
                <tr key={i}>
                  <td style={{ color: '#A0AEB0', width: 32 }}>{i + 1}</td>
                  <td><input value={ch.title} onChange={e => updateChapter(i, 'title', e.target.value)} style={{ padding: '6px 8px' }} /></td>
                  <td><input type="number" value={ch.startTime} onChange={e => updateChapter(i, 'startTime', Number(e.target.value))} style={{ width: 90, padding: '6px 8px' }} /></td>
                  <td><input type="number" value={ch.duration ?? ''} onChange={e => updateChapter(i, 'duration', e.target.value ? Number(e.target.value) : null)} style={{ width: 90, padding: '6px 8px' }} placeholder="—" /></td>
                  <td><button type="button" onClick={() => removeChapter(i)} style={{ color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, padding: '2px 8px' }}>×</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Submit ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 12, paddingTop: 16, borderTop: '1px solid #E2E8F0', marginTop: 8 }}>
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? 'Saving…' : mode === 'edit' ? 'Save Changes' : 'Create Audiobook'}
        </button>
        <a href="/admin/audiobooks" className="btn-secondary">Cancel</a>
      </div>
    </form>
  );
}
