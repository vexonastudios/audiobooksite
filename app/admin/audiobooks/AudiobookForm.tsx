'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Upload, Music, ImagePlus, Link2, Tag, User, Settings,
  ListOrdered, Save, X, Plus, Trash2, ChevronDown,
  Clock, BarChart2, ExternalLink, FileText, BookMarked,
  Sparkles, Palette,
} from 'lucide-react';

interface Chapter {
  title: string;
  startTime: number;
  duration: number | null;
}

interface FormData {
  title: string; slug: string; authorName: string; originalYear: string;
  pubDate: string; published: boolean;
  excerpt: string; description: string;
  metaDescription: string; focusKeyword: string;
  coverImage: string; thumbnailUrl: string;
  mp3Url: string; mp3UrlLow: string;
  totalDuration: string; lengthStr: string; durationSecs: number;
  youtubeLink: string; spotifyLink: string; buyLink: string;
  vttUrl: string;
  categories: string[]; topics: string[];
  generatedColors: string; plays: number;
  chapters: Chapter[];
}

interface Metadata {
  categories: string[];
  topics: string[];
  authors: string[];
}

function getLocalDateString() {
  const d = new Date();
  const offsetMs = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offsetMs).toISOString().split('T')[0];
}

const DEFAULT: FormData = {
  title: '', slug: '', authorName: '', originalYear: '',
  pubDate: getLocalDateString(), published: true,
  excerpt: '', description: '',
  metaDescription: '', focusKeyword: '',
  coverImage: '', thumbnailUrl: '',
  mp3Url: '', mp3UrlLow: '',
  totalDuration: '', lengthStr: '', durationSecs: 0,
  youtubeLink: '', spotifyLink: '', buyLink: '', vttUrl: '',
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

// ── Tag Input ──────────────────────────────────────────────────────────────────
function TagInput({ label, icon, value, onChange, suggestions }: {
  label: string; icon: React.ReactNode;
  value: string[]; onChange: (v: string[]) => void; suggestions: string[];
}) {
  const [input, setInput] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const filtered = suggestions.filter(s => s.toLowerCase().includes(input.toLowerCase()) && !value.includes(s));

  const add = (tag: string) => { const t = tag.trim(); if (t && !value.includes(t)) onChange([...value, t]); setInput(''); setOpen(false); };
  const remove = (tag: string) => onChange(value.filter(t => t !== tag));

  useEffect(() => {
    const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 5 }}>{icon}{label}</label>
      <div onClick={() => setOpen(true)} style={{
        display: 'flex', flexWrap: 'wrap', gap: 6,
        border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 10px',
        background: '#fff', cursor: 'text', minHeight: 42, alignItems: 'center',
      }}>
        {value.map(tag => (
          <span key={tag} style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            background: '#EFF6FF', color: '#1D4ED8',
            borderRadius: 6, padding: '3px 8px', fontSize: 13, fontWeight: 500,
          }}>
            {tag}
            <button type="button" onClick={e => { e.stopPropagation(); remove(tag); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#93C5FD', padding: 0, lineHeight: 1, fontSize: 14 }}>×</button>
          </span>
        ))}
        <input value={input}
          onChange={e => { setInput(e.target.value); setOpen(true); }}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); if (input.trim()) add(input); }
            if (e.key === 'Backspace' && !input && value.length) remove(value[value.length - 1]);
          }}
          onFocus={() => setOpen(true)}
          placeholder={value.length === 0 ? `Add ${label.toLowerCase()}…` : ''}
          style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 14, padding: '2px 4px', minWidth: 100, flex: 1, width: 'auto' }}
        />
      </div>
      {open && filtered.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
          background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8,
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)', maxHeight: 200, overflowY: 'auto', marginTop: 4,
        }}>
          {filtered.map(s => (
            <div key={s} onMouseDown={e => { e.preventDefault(); add(s); }}
              style={{ padding: '9px 14px', cursor: 'pointer', fontSize: 14, color: '#1A202C' }}
              className="tag-option">
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Author Combobox ────────────────────────────────────────────────────────────
function AuthorInput({ value, onChange, suggestions }: { value: string; onChange: (v: string) => void; suggestions: string[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const filtered = suggestions.filter(s => s.toLowerCase().includes(value.toLowerCase()));

  useEffect(() => {
    const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 5 }}><User size={12} />Author Name *</label>
      <input value={value} onChange={e => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)} placeholder="Author name…" required />
      {open && filtered.length > 0 && value.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
          background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8,
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)', maxHeight: 200, overflowY: 'auto', marginTop: 4,
        }}>
          {filtered.map(s => (
            <div key={s} onMouseDown={e => { e.preventDefault(); onChange(s); setOpen(false); }}
              style={{ padding: '9px 14px', cursor: 'pointer', fontSize: 14, color: '#1A202C' }}
              className="tag-option">
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Cover Uploader (single variant) ───────────────────────────────────────────
function CoverUploader({ label, hint, variant, slug, value, onChange }: {
  label: string; hint: string; variant: 'portrait' | 'square';
  slug: string; value: string; onChange: (url: string) => void;
}) {
  const [status, setStatus] = useState<'idle' | 'uploading'>('idle');

  const handle = async (file: File) => {
    setStatus('uploading');
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const tempKey = `covers/temp-${variant}-${slug || 'upload'}-${Date.now()}.${ext}`;
      const { uploadUrl } = await getPresignedUrl(tempKey, file.type);

      const up = await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
      if (!up.ok) throw new Error(`R2 upload failed: ${up.status}`);

      const res = await fetch('/api/admin/upload-cover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: tempKey, slug: slug || 'upload', variant }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      onChange(data.coverImage || data.thumbnailUrl);
    } catch (e) {
      alert(`Upload failed: ${String(e)}`);
    } finally {
      setStatus('idle');
    }
  };

  const isPortrait = variant === 'portrait';
  const previewW = isPortrait ? 90 : 80;
  const previewH = isPortrait ? 130 : 80;

  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
      {/* Preview */}
      <div style={{ flexShrink: 0 }}>
        {value ? (
          <img src={value} alt={label}
            style={{ width: previewW, height: previewH, objectFit: 'cover', borderRadius: 8, border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }} />
        ) : (
          <div style={{ width: previewW, height: previewH, background: '#F0F4F8', border: '2px dashed #CBD5E0', borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, color: '#A0AEB0' }}>
            <ImagePlus size={20} />
            <span style={{ fontSize: 10 }}>{isPortrait ? 'Tall' : 'Square'}</span>
          </div>
        )}
      </div>

      {/* Upload controls */}
      <div style={{ flex: 1 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <ImagePlus size={12} />{label} <span style={{ color: '#A0AEB0', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>— {hint}</span>
        </label>
        <label style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          background: status === 'uploading' ? '#F0F4F8' : '#EFF6FF',
          border: '1px solid #BFDBFE', borderRadius: 8,
          padding: '8px 16px', cursor: status === 'uploading' ? 'wait' : 'pointer',
          fontSize: 13, fontWeight: 500, color: '#2563EB',
          transition: 'background 0.15s',
        }}>
          <Upload size={14} />
          {status === 'uploading' ? 'Uploading…' : 'Choose image'}
          <input type="file" accept="image/*" style={{ display: 'none' }}
            disabled={status === 'uploading'}
            onChange={e => e.target.files?.[0] && handle(e.target.files[0])} />
        </label>
        <div style={{ marginTop: 8 }}>
          <input value={value} onChange={e => onChange(e.target.value)}
            placeholder="Or paste URL directly…"
            style={{ fontSize: 12, color: '#718096', padding: '6px 10px' }} />
        </div>
      </div>
    </div>
  );
}

// ── VTT Uploader ──────────────────────────────────────────────────────────────
function VttUploader({ slug, value, onChange }: { slug: string; value: string; onChange: (url: string) => void }) {
  const [status, setStatus] = useState<'idle' | 'uploading'>('idle');

  const handle = async (file: File) => {
    setStatus('uploading');
    try {
      if (!file.name.endsWith('.vtt')) throw new Error('File must be a .vtt transcript.');
      const tempKey = `transcripts/${slug || 'upload'}-${Date.now()}.vtt`;
      const { uploadUrl, publicUrl } = await getPresignedUrl(tempKey, file.type || 'text/vtt');

      const up = await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type || 'text/vtt' } });
      if (!up.ok) throw new Error(`R2 upload failed: ${up.status}`);

      onChange(publicUrl);
    } catch (e) {
      alert(`Upload failed: ${String(e)}`);
    } finally {
      setStatus('idle');
    }
  };

  return (
    <div className="form-group" style={{ marginBottom: 12 }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <FileText size={12} />Transcript File (.vtt)
      </label>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <label style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          background: status === 'uploading' ? '#F0F4F8' : '#EFF6FF',
          border: '1px solid #BFDBFE', borderRadius: 8,
          padding: '8px 16px', cursor: status === 'uploading' ? 'wait' : 'pointer',
          fontSize: 13, fontWeight: 500, color: '#2563EB',
          transition: 'background 0.15s', flexShrink: 0,
        }}>
          <Upload size={14} />
          {status === 'uploading' ? 'Uploading…' : 'Upload VTT'}
          <input type="file" accept=".vtt" style={{ display: 'none' }}
            disabled={status === 'uploading'}
            onChange={e => e.target.files?.[0] && handle(e.target.files[0])} />
        </label>
        <input value={value} onChange={e => onChange(e.target.value)}
          placeholder="Cloudflare R2 URL or local path (/transcripts/…)"
          style={{ flex: 1, fontSize: 13 }} />
      </div>
    </div>
  );
}

// ── Section Title ──────────────────────────────────────────────────────────────
function Section({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '28px 0 16px', paddingTop: 20, borderTop: '1px solid #E2E8F0' }}>
      <span style={{ color: '#2e6aa7', display: 'flex' }}>{icon}</span>
      <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#2e6aa7' }}>{title}</span>
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
  const [sendPushOnCreate, setSendPushOnCreate] = useState(true);
  const [audioUploading, setAudioUploading] = useState(false);
  const [audioProgress, setAudioProgress] = useState('');
  const [timestampPaste, setTimestampPaste] = useState('');
  const [aiSeoLoading, setAiSeoLoading] = useState(false);
  const [colorsLoading, setColorsLoading] = useState(false);

  useEffect(() => {
    fetch('/api/admin/metadata').then(r => r.json()).then(setMeta).catch(() => {});
  }, []);

  const set = (field: keyof FormData, val: unknown) => setForm(f => ({ ...f, [field]: val }));

  const handleTitleChange = (v: string) => {
    set('title', v);
    if (mode === 'new') set('slug', slugify(v));
  };

  // ── Audio upload ───────────────────────────────────────────────────────────
  const handleAudioUpload = async (file: File) => {
    try {
      setAudioUploading(true);
      setAudioProgress('Uploading to R2…');
      const slug = form.slug || slugify(form.title) || 'audiobook';
      const { uploadUrl } = await getPresignedUrl(`${slug}-original.mp3`, 'audio/mpeg');

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

      setAudioProgress('Transcoding (128k stereo + 64k mono)…');
      const res = await fetch('/api/admin/process-audio', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: `${slug}-original.mp3` }),
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

  // ── Chapters ──────────────────────────────────────────────────────────────
  const handleParseTimestamps = () => {
    const parsed = parseTimestampBlock(timestampPaste);
    if (!parsed.length) { alert('No timestamps found. Check the format.'); return; }
    set('chapters', parsed);
    setTimestampPaste('');
  };

  const addChapter = () => set('chapters', [...form.chapters, { title: '', startTime: 0, duration: null }]);
  const removeChapter = (i: number) => set('chapters', form.chapters.filter((_, idx) => idx !== i));
  const updateChapter = useCallback((i: number, field: keyof Chapter, val: unknown) => {
    setForm(f => { const ch = [...f.chapters]; ch[i] = { ...ch[i], [field]: val }; return { ...f, chapters: ch }; });
  }, []);

  // ── AI SEO (Gemini) ──────────────────────────────────────────────────────
  const handleAiSeo = async () => {
    if (!form.title) { alert('Please enter a title first.'); return; }
    setAiSeoLoading(true);
    try {
      const res = await fetch('/api/admin/ai-seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: form.title, description: form.description, authorName: form.authorName }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setForm(f => ({
        ...f,
        excerpt: data.excerpt || f.excerpt,
        metaDescription: data.metaDescription || f.metaDescription,
        focusKeyword: data.focusKeyword || f.focusKeyword,
      }));
    } catch (e) {
      alert(`AI SEO failed: ${String(e)}`);
    } finally {
      setAiSeoLoading(false);
    }
  };

  // ── Generate Colors ──────────────────────────────────────────────────────
  const handleGenerateColors = async () => {
    const imageUrl = form.coverImage || form.thumbnailUrl;
    if (!imageUrl) { alert('Upload a cover image first.'); return; }
    setColorsLoading(true);
    try {
      const res = await fetch('/api/admin/generate-colors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl }),
      });
      if (!res.ok) throw new Error(await res.text());
      const { generatedColors } = await res.json();
      set('generatedColors', generatedColors);
    } catch (e) {
      alert(`Color generation failed: ${String(e)}`);
    } finally {
      setColorsLoading(false);
    }
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setMsg(null);
    try {
      const payload = { ...form, originalYear: form.originalYear ? Number(form.originalYear) : null, plays: Number(form.plays) };
      const url = mode === 'edit' && initialData?.id ? `/api/admin/audiobooks/${initialData.id}` : '/api/admin/audiobooks';
      const res = await fetch(url, {
        method: mode === 'edit' ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      setMsg({ type: 'ok', text: mode === 'edit' ? '✓ Saved successfully!' : '✓ Audiobook created!' });
      if (mode === 'new') {
        const saved = await res.json();
        // Auto-send push notification to 'new-audiobooks' subscribers
        if (sendPushOnCreate) {
          fetch('/api/admin/push-send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: `📖 New: ${form.title}`,
              body: form.authorName
                ? `By ${form.authorName} — now available on Scroll Reader`
                : 'A new audiobook is now available on Scroll Reader',
              link: `/audiobook/${form.slug || saved.id}`,
              trigger: 'new_audiobook',
              topic: 'new-audiobooks',
            }),
          }).catch(() => {}); // Fire and forget — don't block the redirect
        }
        router.push(`/admin/audiobooks/${saved.id}/edit`);
      }
    } catch (e) {
      setMsg({ type: 'err', text: String(e) });
    } finally {
      setSaving(false);
    }
  };

  const Row2 = ({ children }: { children: React.ReactNode }) => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>{children}</div>
  );

  return (
    <form onSubmit={handleSubmit}>
      <style>{`.tag-option:hover { background: #F0F4F8; }`}</style>

      {msg && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 16px', borderRadius: 8, marginBottom: 20, fontSize: 14,
          background: msg.type === 'ok' ? '#D1FAE5' : '#FEE2E2',
          color: msg.type === 'ok' ? '#065F46' : '#991B1B',
          border: `1px solid ${msg.type === 'ok' ? '#A7F3D0' : '#FECACA'}`,
        }}>
          {msg.text}
        </div>
      )}

      {/* ── Basic Info ──────────────────────────────────────────────── */}
      <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#2e6aa7', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <BookMarked size={14} /> Basic Info
      </p>

      <div className="form-group">
        <label style={{ display: 'flex', alignItems: 'center', gap: 5 }}><FileText size={12} />Title *</label>
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
          <label style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Clock size={12} />Original Publication Year</label>
          <input type="number" value={form.originalYear} onChange={e => set('originalYear', e.target.value)} placeholder="e.g. 1887" />
        </div>
        <div className="form-group">
          <label>Publish Date</label>
          <input type="date" key={form.pubDate?.split('T')[0] || 'empty'} defaultValue={form.pubDate?.split('T')[0] || ''}
            onBlur={e => set('pubDate', e.target.value)}
            onChange={e => set('pubDate', e.target.value)} />
        </div>
      </Row2>

      <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <input type="checkbox" id="published" checked={form.published}
          onChange={e => set('published', e.target.checked)}
          style={{ accentColor: '#2e6aa7', width: 16, height: 16 }} />
        <label htmlFor="published" style={{ margin: 0, cursor: 'pointer', textTransform: 'none', letterSpacing: 0, fontSize: 14, fontWeight: 500, color: '#1A202C' }}>
          Published (live on site)
        </label>
      </div>

      {/* ── Content ─────────────────────────────────────────────────── */}
      <Section icon={<FileText size={14} />} title="Content" />
      <div className="form-group">
        <label>Full Description (HTML allowed)</label>
        <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={8} />
      </div>

      {/* AI SEO Button */}
      <div style={{ marginBottom: 18 }}>
        <button type="button" onClick={handleAiSeo} disabled={aiSeoLoading}
          className="btn-secondary" style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            background: aiSeoLoading ? '#F0F4F8' : 'linear-gradient(135deg, #EFF6FF, #F0FDF4)',
            border: '1px solid #93C5FD',
            color: '#1D4ED8', fontWeight: 600,
          }}>
          <Sparkles size={15} />
          {aiSeoLoading ? 'Generating SEO…' : '✨ AI Generate SEO (Gemini)'}
        </button>
        <span style={{ fontSize: 12, color: '#718096', marginLeft: 10 }}>
          Reads title + description → fills excerpt, meta description & focus keyword
        </span>
      </div>

      <div className="form-group">
        <label>Excerpt (short teaser)</label>
        <textarea value={form.excerpt} onChange={e => set('excerpt', e.target.value)} rows={3} />
      </div>
      <Row2>
        <div className="form-group">
          <label>Meta Description (SEO)</label>
          <input value={form.metaDescription} onChange={e => set('metaDescription', e.target.value)}
            placeholder="Under 155 characters for search results…" maxLength={160} />
          <span style={{ fontSize: 11, color: form.metaDescription.length > 155 ? '#DC2626' : '#A0AEB0' }}>
            {form.metaDescription.length}/155
          </span>
        </div>
        <div className="form-group">
          <label>Focus Keyword</label>
          <input value={form.focusKeyword} onChange={e => set('focusKeyword', e.target.value)}
            placeholder="e.g. free christian audiobook" />
        </div>
      </Row2>

      {/* ── Cover Images ─────────────────────────────────────────────── */}
      <Section icon={<ImagePlus size={14} />} title="Cover Images" />
      <p style={{ fontSize: 12, color: '#718096', margin: '-8px 0 16px' }}>
        Upload each image separately for best quality. Files are optimized to WebP on the server.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 4 }}>
        <div className="card" style={{ padding: 16 }}>
          <CoverUploader
            label="Tall Cover"
            hint="max 600×800 px — t-{slug}.webp"
            variant="portrait"
            slug={form.slug}
            value={form.coverImage}
            onChange={url => set('coverImage', url)}
          />
        </div>
        <div className="card" style={{ padding: 16 }}>
          <CoverUploader
            label="Square Thumbnail"
            hint="400 × 400 px — 1024-{slug}.webp"
            variant="square"
            slug={form.slug}
            value={form.thumbnailUrl}
            onChange={url => set('thumbnailUrl', url)}
          />
        </div>
      </div>

      {/* ── Audio ────────────────────────────────────────────────────── */}
      <Section icon={<Music size={14} />} title="Audio" />
      <div className="form-group">
        <label style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Upload size={12} />Upload MP3 — auto-transcodes to 128k stereo + 64k mono</label>
        <label style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          background: audioUploading ? '#F0F4F8' : '#EFF6FF',
          border: '1px solid #BFDBFE', borderRadius: 8,
          padding: '8px 16px', cursor: audioUploading ? 'wait' : 'pointer',
          fontSize: 13, fontWeight: 500, color: '#2563EB',
        }}>
          <Music size={14} />
          {audioUploading ? audioProgress || 'Uploading…' : 'Choose MP3'}
          <input type="file" accept="audio/mpeg,audio/*" style={{ display: 'none' }}
            disabled={audioUploading}
            onChange={e => e.target.files?.[0] && handleAudioUpload(e.target.files[0])} />
        </label>
        {audioProgress && !audioUploading && (
          <div style={{ marginTop: 6, fontSize: 13, color: audioProgress.startsWith('✅') ? '#059669' : '#DC2626' }}>
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
          <label style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Clock size={12} />Total Duration</label>
          <input value={form.totalDuration} onChange={e => set('totalDuration', e.target.value)} placeholder="H:MM:SS" />
        </div>
        <div className="form-group">
          <label>Length Display</label>
          <input key={`len-${form.lengthStr}`} defaultValue={form.lengthStr}
            onBlur={e => set('lengthStr', e.target.value)} placeholder="5h 47m" />
        </div>
      </Row2>

      {/* ── Transcripts ──────────────────────────────────────────────── */}
      <Section icon={<FileText size={14} />} title="Transcripts" />
      <VttUploader
        slug={form.slug}
        value={form.vttUrl}
        onChange={url => set('vttUrl', url)}
      />

      {/* ── External Links ───────────────────────────────────────────── */}
      <Section icon={<Link2 size={14} />} title="External Links" />
      <Row2>
        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: 5 }}><ExternalLink size={12} />YouTube</label>
          <input value={form.youtubeLink} onChange={e => set('youtubeLink', e.target.value)} placeholder="https://youtu.be/…" />
        </div>
        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: 5 }}><ExternalLink size={12} />Spotify</label>
          <input value={form.spotifyLink} onChange={e => set('spotifyLink', e.target.value)} placeholder="https://podcasters.spotify.com/…" />
        </div>
      </Row2>
      <div className="form-group">
        <label>Buy / Physical Book Link</label>
        <input value={form.buyLink} onChange={e => set('buyLink', e.target.value)} placeholder="https://amazon.com/…" />
      </div>

      {/* ── Taxonomy ─────────────────────────────────────────────────── */}
      <Section icon={<Tag size={14} />} title="Taxonomy" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 6 }}>
        <TagInput icon={<Tag size={12} />} label="Categories" value={form.categories} onChange={v => set('categories', v)} suggestions={meta.categories} />
        <TagInput icon={<Tag size={12} />} label="Topics" value={form.topics} onChange={v => set('topics', v)} suggestions={meta.topics} />
      </div>
      <p style={{ fontSize: 12, color: '#718096', margin: '4px 0 0' }}>
        Type to filter existing entries, or type a new value and press <kbd style={{ background: '#F0F4F8', border: '1px solid #CBD5E0', borderRadius: 4, padding: '1px 5px', fontSize: 11 }}>Enter</kbd> to add.
      </p>

      {/* ── Advanced ─────────────────────────────────────────────────── */}
      <Section icon={<Settings size={14} />} title="Advanced" />
      <Row2>
        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: 5 }}><BarChart2 size={12} />Play Count</label>
          <input type="number" value={form.plays} onChange={e => set('plays', Number(e.target.value))} />
        </div>
        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: 5 }}>Generated Colors (CSS gradient)
            {form.generatedColors && (
              <span style={{
                display: 'inline-block', width: 60, height: 16, borderRadius: 4, marginLeft: 8,
                background: form.generatedColors, border: '1px solid #E2E8F0',
              }} />
            )}
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={form.generatedColors} onChange={e => set('generatedColors', e.target.value)}
              placeholder="linear-gradient(to bottom, …)" style={{ flex: 1 }} />
            <button type="button" onClick={handleGenerateColors} disabled={colorsLoading}
              className="btn-secondary" style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0,
                background: colorsLoading ? '#F0F4F8' : '#FFF7ED',
                border: '1px solid #FED7AA', color: '#C2410C',
              }}>
              <Palette size={14} />
              {colorsLoading ? 'Extracting…' : 'Generate'}
            </button>
          </div>
        </div>
      </Row2>

      {/* ── Chapters ─────────────────────────────────────────────────── */}
      <Section icon={<ListOrdered size={14} />} title="Chapters" />
      <div style={{ marginBottom: 16 }}>
        <label>Paste Timestamp Block <span style={{ color: '#A0AEB0', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(format: (0:00) Chapter Title - Duration: 12:34)</span></label>
        <textarea value={timestampPaste} onChange={e => setTimestampPaste(e.target.value)} rows={4}
          placeholder={'(0:00) Chapter 1 - Introduction - Duration: 12:34\n(12:34) Chapter 2 - The Call - Duration: 8:22'} />
        <button type="button" onClick={handleParseTimestamps} className="btn-secondary" style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <ListOrdered size={14} /> Parse Timestamps
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 13, color: '#718096', fontWeight: 500 }}>
          {form.chapters.length} chapter{form.chapters.length !== 1 ? 's' : ''}
        </span>
        <button type="button" onClick={addChapter} className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Plus size={14} /> Add Chapter
        </button>
      </div>

      {form.chapters.length > 0 && (
        <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden', marginBottom: 24 }}>
          <table>
            <thead>
              <tr><th style={{ width: 36 }}>#</th><th>Title</th><th style={{ width: 100 }}>Start (s)</th><th style={{ width: 100 }}>Dur (s)</th><th style={{ width: 40 }}></th></tr>
            </thead>
            <tbody>
              {form.chapters.map((ch, i) => (
                <tr key={i}>
                  <td style={{ color: '#A0AEB0', textAlign: 'center', fontSize: 12 }}>{i + 1}</td>
                  <td><input value={ch.title} onChange={e => updateChapter(i, 'title', e.target.value)} style={{ padding: '6px 8px' }} /></td>
                  <td><input type="number" value={ch.startTime} onChange={e => updateChapter(i, 'startTime', Number(e.target.value))} style={{ padding: '6px 8px' }} /></td>
                  <td><input type="number" value={ch.duration ?? ''} onChange={e => updateChapter(i, 'duration', e.target.value ? Number(e.target.value) : null)} style={{ padding: '6px 8px' }} placeholder="—" /></td>
                  <td>
                    <button type="button" onClick={() => removeChapter(i)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#F87171', padding: '4px', display: 'flex', alignItems: 'center' }}>
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Submit ─────────────────────────────────────────────────────── */}
      <div style={{ paddingTop: 20, marginTop: 8, borderTop: '1px solid #E2E8F0' }}>
        {/* Push notification opt-in — only shown when creating a new book */}
        {mode === 'new' && (
          <label style={{
            display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16,
            padding: '12px 14px', borderRadius: 8,
            background: sendPushOnCreate ? 'rgba(91,76,245,0.06)' : '#F8F9FA',
            border: `1.5px solid ${sendPushOnCreate ? '#5B4CF5' : '#E2E8F0'}`,
            cursor: 'pointer', transition: 'all 0.15s',
          }}>
            <input
              type="checkbox"
              checked={sendPushOnCreate}
              onChange={e => setSendPushOnCreate(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: '#5B4CF5', flexShrink: 0 }}
            />
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, color: '#1A202C' }}>
                🔔 Send push notification to subscribers
              </div>
              <div style={{ fontSize: 12, color: '#718096', marginTop: 2 }}>
                Automatically alerts users who opted in to &quot;New Audiobook Alerts&quot;
              </div>
            </div>
          </label>
        )}

        <div style={{ display: 'flex', gap: 12 }}>
          <button type="submit" disabled={saving} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <Save size={15} />
            {saving ? 'Saving…' : mode === 'edit' ? 'Save Changes' : 'Create Audiobook'}
          </button>
          <a href="/admin/audiobooks" className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <X size={14} /> Cancel
          </a>
        </div>
      </div>
    </form>
  );
}
