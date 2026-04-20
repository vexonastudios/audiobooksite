'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import 'react-quill-new/dist/quill.snow.css';
import {
  Save, ArrowLeft, FileText, User, Calendar,
  Tag, Image as ImageIcon, Eye, EyeOff, Link as LinkIcon,
  Upload, Mic, Loader2, Play, CheckCircle, Volume2,
} from 'lucide-react';

// Dynamically import React Quill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill-new'), {
  ssr: false,
  loading: () => (
    <div style={{ height: 400, background: '#F8F9FA', border: '1px solid #E2E8F0', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#718096' }}>
      Loading editor…
    </div>
  ),
});

export interface ArticleData {
  id?: string;
  slug?: string;
  title?: string;
  excerpt?: string;
  content?: string;
  pub_date?: string;
  author_name?: string;
  cover_image?: string;
  categories?: string[];
  topics?: string[];
  published?: boolean;
  audio_url?: string;
  voice_id?: string;
  duration_secs?: number;
  length_str?: string;
  source_audiobook_slug?: string;
}

interface Metadata {
  categories: string[];
  topics: string[];
  authors: string[];
  audiobooks: { slug: string, title: string }[];
}

const QUILL_MODULES = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['blockquote', 'code-block'],
    ['link', 'image'],
    [{ align: [] }],
    ['clean'],
  ],
};

const QUILL_FORMATS = [
  'header', 'bold', 'italic', 'underline', 'strike',
  'list', 'bullet', 'blockquote', 'code-block',
  'link', 'image', 'align',
];

// Helper to upload image to R2 via admin presigned URL
async function uploadImageToR2(file: File, slug: string): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg';
  const tempKey = `articles/${slug || 'upload'}-${Date.now()}.${ext}`;
  const res = await fetch(`/api/admin/upload-url?filename=${encodeURIComponent(tempKey)}&type=${encodeURIComponent(file.type)}`);
  if (!res.ok) throw new Error('Could not get upload URL');
  const { uploadUrl, publicUrl } = await res.json();
  const up = await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
  if (!up.ok) throw new Error('Image upload failed');
  return publicUrl;
}

// ── Cover Image Uploader ────────────────────────────────────────────────────
function CoverUploader({ slug, value, onChange }: { slug: string; value: string; onChange: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);

  const handle = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadImageToR2(file, slug || 'article');
      onChange(url);
    } catch (e) {
      alert(`Upload failed: ${String(e)}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      {value && (
        <img src={value} alt="Cover preview" style={{ width: '100%', borderRadius: 8, objectFit: 'cover', maxHeight: 180, display: 'block', marginBottom: 12 }}
          onError={e => (e.currentTarget.style.display = 'none')} />
      )}
      <label style={{
        display: 'inline-flex', alignItems: 'center', gap: 7,
        background: uploading ? '#F0F4F8' : '#EFF6FF',
        border: '1px solid #BFDBFE', borderRadius: 8,
        padding: '8px 16px', cursor: uploading ? 'wait' : 'pointer',
        fontSize: 13, fontWeight: 500, color: '#2563EB', marginBottom: 8,
      }}>
        <Upload size={14} />
        {uploading ? 'Uploading…' : 'Upload image'}
        <input type="file" accept="image/*" style={{ display: 'none' }}
          disabled={uploading}
          onChange={e => e.target.files?.[0] && handle(e.target.files[0])} />
      </label>
      <input value={value} onChange={e => onChange(e.target.value)}
        placeholder="Or paste image URL directly…"
        style={{ fontSize: 12, color: '#718096', padding: '6px 10px', display: 'block', width: '100%', boxSizing: 'border-box' }} />
    </div>
  );
}

function slugify(str: string) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function getLocalDatetime(dateObj?: string | Date) {
  const d = dateObj ? new Date(dateObj) : new Date();
  const offsetMs = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offsetMs).toISOString().slice(0, 16);
}

// ── Tag Input ──────────────────────────────────────────────────────────────────
function TagInput({ label, value, onChange, suggestions }: {
  label: string; value: string[]; onChange: (v: string[]) => void; suggestions: string[];
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
  const filtered = suggestions.filter(s => s.toLowerCase().includes(value.toLowerCase()) && s.toLowerCase() !== value.toLowerCase());

  useEffect(() => {
    const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
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

export default function ArticleForm({ initialData, isNew = false }: { initialData?: ArticleData; isNew?: boolean }) {
  const router = useRouter();

  const [title, setTitle] = useState(initialData?.title ?? '');
  const [slug, setSlug] = useState(initialData?.slug ?? '');
  const [excerpt, setExcerpt] = useState(initialData?.excerpt ?? '');
  const [content, setContent] = useState(initialData?.content ?? '');
  const [pubDate, setPubDate] = useState(getLocalDatetime(initialData?.pub_date));
  const [authorName, setAuthorName] = useState(initialData?.author_name ?? '');
  const [coverImage, setCoverImage] = useState(initialData?.cover_image ?? '');
  const [categories, setCategories] = useState<string[]>(initialData?.categories ?? []);
  const [topics, setTopics] = useState<string[]>(initialData?.topics ?? []);
  const [published, setPublished] = useState(initialData?.published ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [meta, setMeta] = useState<Metadata>({ categories: [], topics: [], authors: [], audiobooks: [] });

  // Audio TTS state
  const [audioUrl, setAudioUrl] = useState(initialData?.audio_url ?? '');
  const [voiceId, setVoiceId] = useState(initialData?.voice_id ?? 'fnYMz3F5gMEDGMWcH1ex');
  const [audioGenerating, setAudioGenerating] = useState(false);
  const [audioMsg, setAudioMsg] = useState('');
  const [audioLengthStr, setAudioLengthStr] = useState(initialData?.length_str ?? '');
  const [sourceAudiobookSlug, setSourceAudiobookSlug] = useState(initialData?.source_audiobook_slug ?? '');
  const savedId = useRef(initialData?.id ?? '');

  useEffect(() => {
    fetch('/api/admin/metadata').then(r => r.json()).then(setMeta).catch(() => {});
  }, []);

  // Auto-slug from title when creating new
  useEffect(() => {
    if (isNew && !slugEdited && title) {
      setSlug(slugify(title));
    }
  }, [title, isNew, slugEdited]);

  const handleSave = async () => {
    if (!title.trim() || !slug.trim()) {
      setError('Title and slug are required.');
      return;
    }
    setSaving(true);
    setError('');
    setSuccess('');

    const payload = {
      slug: slug.trim(),
      title: title.trim(),
      excerpt: excerpt.trim(),
      content,
      pub_date: new Date(pubDate).toISOString(),
      author_name: authorName.trim() || 'admin',
      cover_image: coverImage.trim(),
      source_audiobook_slug: sourceAudiobookSlug.trim(),
      categories,
      topics,
      published,
    };

    try {
      let res: Response;
      if (isNew) {
        res = await fetch('/api/admin/articles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`/api/admin/articles/${initialData!.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const { error: msg } = await res.json().catch(() => ({ error: 'Save failed' }));
        throw new Error(msg);
      }

      setSuccess(isNew ? 'Article created!' : 'Article saved!');
      if (isNew) {
        const data = await res.json();
        savedId.current = data.id;
        setTimeout(() => router.push(`/admin/articles/${data.id}/edit`), 1000);
      }
    } catch (e: any) {
      setError(e.message || 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateAudio = async () => {
    const id = savedId.current || initialData?.id;
    if (!id) { setAudioMsg('Save the article first before generating audio.'); return; }
    if (!content || content.replace(/<[^>]*>/g,'').trim().length < 10) {
      setAudioMsg('The article content is too short to generate audio.'); return;
    }
    setAudioGenerating(true);
    setAudioMsg('');
    try {
      const res = await fetch('/api/admin/articles/generate-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId: id, voiceId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      setAudioUrl(data.audio_url);
      setAudioLengthStr(data.length_str);
      setAudioMsg(`✅ Audio generated! (${data.length_str})`);
    } catch (e: any) {
      setAudioMsg(`❌ ${e.message}`);
    } finally {
      setAudioGenerating(false);
    }
  };


  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => router.push('/admin/articles')} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <ArrowLeft size={14} /> Back
          </button>
          <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileText size={20} style={{ color: '#2e6aa7' }} />
            {isNew ? 'New Article' : 'Edit Article'}
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {success && <span style={{ color: '#065F46', background: '#D1FAE5', padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>✓ {success}</span>}
          {error && <span style={{ color: '#991B1B', background: '#FEE2E2', padding: '6px 14px', borderRadius: 8, fontSize: 13 }}>{error}</span>}
          <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Save size={14} /> {saving ? 'Saving…' : 'Save Article'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>
        {/* Left column — main content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Title */}
          <div className="card">
            <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FileText size={13} /> Article Details</h2>
            <div className="form-group">
              <label>Title *</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Article title…" />
            </div>
            <div className="form-group">
              <label>Slug *</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={slug} onChange={e => { setSlug(e.target.value); setSlugEdited(true); }} placeholder="url-friendly-slug" />
                <button type="button" onClick={() => setSlug(slugify(title))} className="btn-secondary" style={{ flexShrink: 0, fontSize: 12 }}>Auto</button>
              </div>
            </div>
            <div className="form-group">
              <label>Excerpt (short summary)</label>
              <textarea value={excerpt} onChange={e => setExcerpt(e.target.value)} placeholder="Optional short teaser shown in the article list…" rows={3} />
            </div>
          </div>

          {/* Rich Text Editor */}
          <div className="card">
            <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FileText size={13} /> Content</h2>
            <div style={{ minHeight: 460 }}>
              <ReactQuill
                theme="snow"
                value={content}
                onChange={setContent}
                modules={QUILL_MODULES}
                formats={QUILL_FORMATS}
                placeholder="Write your article content here…"
                style={{ background: '#fff', borderRadius: 8, minHeight: 400 }}
              />
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Publish */}
          <div className="card">
            <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {published ? <Eye size={13} /> : <EyeOff size={13} />} Publish
            </h2>
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label>Status</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setPublished(true)} className={published ? 'btn-primary' : 'btn-secondary'} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Eye size={13} /> Published
                </button>
                <button onClick={() => setPublished(false)} className={!published ? 'btn-primary' : 'btn-secondary'} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <EyeOff size={13} /> Draft
                </button>
              </div>
            </div>
            <div className="form-group">
              <label><Calendar size={11} style={{ display: 'inline', marginRight: 4 }} />Publish Date</label>
              <input type="datetime-local" value={pubDate} onChange={e => setPubDate(e.target.value)} />
            </div>
          </div>

          {/* Author & Source */}
          <div className="card">
            <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><User size={13} /> Details</h2>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label>Author Name</label>
              <AuthorInput value={authorName} onChange={setAuthorName} suggestions={meta.authors} />
            </div>
            
            <div className="form-group">
              <label>Source Audiobook (Optional)</label>
              <select 
                value={sourceAudiobookSlug} 
                onChange={e => setSourceAudiobookSlug(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #E2E8F0', outline: 'none', background: '#fff' }}
              >
                <option value="">-- None --</option>
                {meta.audiobooks?.map(book => (
                  <option key={book.slug} value={book.slug}>{book.title}</option>
                ))}
              </select>
              <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 6, lineHeight: 1.4 }}>
                If this article is derived from an audiobook, selecting it here will link readers to the full listen.
              </p>
            </div>
          </div>

          {/* Cover Image */}
          <div className="card">
            <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><ImageIcon size={13} /> Cover Image</h2>
            <CoverUploader slug={slug} value={coverImage} onChange={setCoverImage} />
          </div>

          {/* Audio Generation */}
          <div className="card">
            <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Mic size={13} /> Audio (TTS)</h2>
            {audioUrl ? (
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#059669', fontWeight: 600, fontSize: 13, marginBottom: 8 }}>
                  <CheckCircle size={14} /> Audio ready {audioLengthStr && `(${audioLengthStr})`}
                </div>
                <audio controls src={audioUrl} style={{ width: '100%', borderRadius: 8 }} />
              </div>
            ) : (
              <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 12, lineHeight: 1.5 }}>
                Generate a spoken audio version of this article via ElevenLabs. Save the article first, then click Generate.
              </p>
            )}
            <div className="form-group">
              <label>Voice ID</label>
              <input value={voiceId} onChange={e => setVoiceId(e.target.value)} placeholder="ElevenLabs voice ID" style={{ fontFamily: 'monospace', fontSize: 12 }} />
            </div>
            <button
              onClick={handleGenerateAudio}
              disabled={audioGenerating}
              className="btn-primary"
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px' }}
            >
              {audioGenerating ? <><Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> Generating…</> : <><Mic size={14} /> {audioUrl ? 'Regenerate Audio' : 'Generate Audio'}</>}
            </button>
            {audioMsg && (
              <p style={{ fontSize: 12, marginTop: 8, color: audioMsg.startsWith('✅') ? '#059669' : '#DC2626' }}>{audioMsg}</p>
            )}
          </div>

          {/* Taxonomy */}
          <div className="card">
            <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Tag size={13} /> Taxonomy</h2>
            <div className="form-group">
              <label>Categories</label>
              <TagInput label="Categories" value={categories} onChange={setCategories} suggestions={meta.categories} />
            </div>
            <div className="form-group">
              <label>Topics</label>
              <TagInput label="Topics" value={topics} onChange={setTopics} suggestions={meta.topics} />
            </div>
          </div>

          {/* Preview link */}
          {!isNew && initialData?.slug && (
            <div className="card" style={{ padding: '14px 20px' }}>
              <a
                href={`/articles/${initialData.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#2e6aa7', fontSize: 13, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <LinkIcon size={13} /> Preview on site ↗
              </a>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .tag-option:hover { background: #F8FAFC; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .ql-toolbar { border-radius: 8px 8px 0 0 !important; border-color: #E2E8F0 !important; background: #F8F9FA; }
        .ql-container { border-radius: 0 0 8px 8px !important; border-color: #E2E8F0 !important; font-size: 15px !important; min-height: 380px; }
        .ql-editor { min-height: 360px; font-family: 'Lora', Georgia, serif !important; line-height: 1.8 !important; }
        .ql-editor p { margin-bottom: 1em; }
        .ql-editor blockquote { border-left: 4px solid #2e6aa7; padding-left: 16px; color: #4A5568; font-style: italic; }
      `}</style>
    </div>
  );
}
