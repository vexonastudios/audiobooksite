'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import {
  Save, ArrowLeft, FileText, User, Calendar,
  Tag, Image as ImageIcon, Eye, EyeOff, Link as LinkIcon,
} from 'lucide-react';

import 'react-quill-new/dist/quill.snow.css';

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
}

interface Metadata {
  categories: string[];
  topics: string[];
  authors: string[];
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

function slugify(str: string) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
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
  const [pubDate, setPubDate] = useState(
    initialData?.pub_date ? new Date(initialData.pub_date).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16)
  );
  const [authorName, setAuthorName] = useState(initialData?.author_name ?? '');
  const [coverImage, setCoverImage] = useState(initialData?.cover_image ?? '');
  const [categories, setCategories] = useState<string[]>(initialData?.categories ?? []);
  const [topics, setTopics] = useState<string[]>(initialData?.topics ?? []);
  const [published, setPublished] = useState(initialData?.published ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [meta, setMeta] = useState<Metadata>({ categories: [], topics: [], authors: [] });

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
        setTimeout(() => router.push(`/admin/articles/${data.id}/edit`), 1000);
      }
    } catch (e: any) {
      setError(e.message || 'Something went wrong.');
    } finally {
      setSaving(false);
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

          {/* Author */}
          <div className="card">
            <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><User size={13} /> Author</h2>
            <div className="form-group">
              <label>Author Name</label>
              <AuthorInput value={authorName} onChange={setAuthorName} suggestions={meta.authors} />
            </div>
          </div>

          {/* Cover Image */}
          <div className="card">
            <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><ImageIcon size={13} /> Cover Image</h2>
            <div className="form-group">
              <label>Image URL</label>
              <input value={coverImage} onChange={e => setCoverImage(e.target.value)} placeholder="https://…" />
            </div>
            {coverImage && (
              <img
                src={coverImage}
                alt="Cover preview"
                style={{ width: '100%', borderRadius: 8, objectFit: 'cover', maxHeight: 160, display: 'block' }}
                onError={e => (e.currentTarget.style.display = 'none')}
              />
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
        .ql-toolbar { border-radius: 8px 8px 0 0 !important; border-color: #E2E8F0 !important; background: #F8F9FA; }
        .ql-container { border-radius: 0 0 8px 8px !important; border-color: #E2E8F0 !important; font-size: 15px !important; min-height: 380px; }
        .ql-editor { min-height: 360px; font-family: 'Lora', Georgia, serif !important; line-height: 1.8 !important; }
        .ql-editor p { margin-bottom: 1em; }
        .ql-editor blockquote { border-left: 4px solid #2e6aa7; padding-left: 16px; color: #4A5568; font-style: italic; }
      `}</style>
    </div>
  );
}
