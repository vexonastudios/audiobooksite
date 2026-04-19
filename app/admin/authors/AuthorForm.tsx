'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, FileText, Link2, ImagePlus, Save, X, Upload, Calendar } from 'lucide-react';

async function getPresignedUrl(filename: string, type: string) {
  const res = await fetch(`/api/admin/upload-url?filename=${encodeURIComponent(filename)}&type=${encodeURIComponent(type)}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<{ uploadUrl: string; publicUrl: string }>;
}

interface FormData {
  name: string;
  slug: string;
  birthYear: string;
  deathYear: string;
  description: string;
  imageUrl: string;
}

const DEFAULT: FormData = {
  name: '', slug: '', birthYear: '', deathYear: '', description: '', imageUrl: '',
};

function slugify(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

export interface AuthorFormInitial extends Partial<FormData> { id?: string }

export function AuthorForm({ initialData, mode }: { initialData?: AuthorFormInitial; mode: 'new' | 'edit' }) {
  const router = useRouter();
  const [form, setForm] = useState<FormData>({ ...DEFAULT, ...initialData });
  const [saving, setSaving] = useState(false);
  const [imgUploading, setImgUploading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const set = (field: keyof FormData, val: string) => setForm((f) => ({ ...f, [field]: val }));

  const handleNameChange = (v: string) => {
    set('name', v);
    if (mode === 'new') set('slug', slugify(v));
  };

  const handleImageUpload = async (file: File) => {
    setImgUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const key = `authors/${form.slug || 'author'}-${Date.now()}.${ext}`;
      const { uploadUrl, publicUrl } = await getPresignedUrl(key, file.type);
      const up = await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
      if (!up.ok) throw new Error(`Upload failed: ${up.status}`);
      set('imageUrl', publicUrl);
    } catch (e) {
      alert(`Upload failed: ${String(e)}`);
    } finally {
      setImgUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setMsg(null);
    try {
      const payload = {
        slug: form.slug,
        name: form.name,
        birthYear: form.birthYear ? Number(form.birthYear) : null,
        deathYear: form.deathYear ? Number(form.deathYear) : null,
        description: form.description || null,
        imageUrl: form.imageUrl || null,
      };
      const url = mode === 'edit' && initialData?.id
        ? `/api/admin/authors/${initialData.id}`
        : '/api/admin/authors';
      const res = await fetch(url, {
        method: mode === 'edit' ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      setMsg({ type: 'ok', text: mode === 'edit' ? '✓ Saved!' : '✓ Author created!' });
      if (mode === 'new') {
        const { id } = await res.json();
        router.push(`/admin/authors/${id}/edit`);
      }
    } catch (e) {
      setMsg({ type: 'err', text: String(e) });
    } finally {
      setSaving(false);
    }
  };

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

      {/* Name + Slug */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: 5 }}><User size={12} />Full Name *</label>
          <input value={form.name} onChange={(e) => handleNameChange(e.target.value)} required placeholder="e.g. Andrew Murray" />
        </div>
        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Link2 size={12} />URL Slug (auto-generated)</label>
          <input value={form.slug} onChange={(e) => set('slug', e.target.value)} required placeholder="andrewmurray" />
          <p style={{ fontSize: 11, color: '#718096', marginTop: 4 }}>
            Public URL: <code style={{ background: '#F0F4F8', padding: '1px 4px', borderRadius: 3 }}>/author/{form.slug || '…'}/</code>
          </p>
        </div>
      </div>

      {/* Birth / Death year */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Calendar size={12} />Birth Year</label>
          <input type="number" value={form.birthYear} onChange={(e) => set('birthYear', e.target.value)} placeholder="e.g. 1828" />
        </div>
        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Calendar size={12} />Death Year</label>
          <input type="number" value={form.deathYear} onChange={(e) => set('deathYear', e.target.value)} placeholder="e.g. 1917" />
        </div>
      </div>

      {/* Biography */}
      <div className="form-group" style={{ marginBottom: 18 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 5 }}><FileText size={12} />Biography</label>
        <textarea
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          rows={7}
          placeholder="Write a short biography about this author, their life, ministry, and notable works…"
        />
      </div>

      {/* Portrait image */}
      <div className="form-group" style={{ marginBottom: 24 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 5 }}><ImagePlus size={12} />Author Portrait</label>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          {/* Preview */}
          <div style={{ flexShrink: 0 }}>
            {form.imageUrl ? (
              <img
                src={form.imageUrl} alt={form.name}
                style={{ width: 90, height: 110, objectFit: 'cover', borderRadius: 8, border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
              />
            ) : (
              <div style={{ width: 90, height: 110, background: '#F0F4F8', border: '2px dashed #CBD5E0', borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, color: '#A0AEB0' }}>
                <User size={24} />
                <span style={{ fontSize: 10 }}>Portrait</span>
              </div>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <label style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              background: imgUploading ? '#F0F4F8' : '#EFF6FF',
              border: '1px solid #BFDBFE', borderRadius: 8,
              padding: '8px 16px', cursor: imgUploading ? 'wait' : 'pointer',
              fontSize: 13, fontWeight: 500, color: '#2563EB',
            }}>
              <Upload size={14} />
              {imgUploading ? 'Uploading…' : 'Upload Image'}
              <input type="file" accept="image/*" style={{ display: 'none' }}
                disabled={imgUploading}
                onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])} />
            </label>
            <div style={{ marginTop: 8 }}>
              <input value={form.imageUrl} onChange={(e) => set('imageUrl', e.target.value)}
                placeholder="Or paste image URL directly…"
                style={{ fontSize: 12, color: '#718096', padding: '6px 10px' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12, paddingTop: 20, borderTop: '1px solid #E2E8F0' }}>
        <button type="submit" disabled={saving} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <Save size={15} />
          {saving ? 'Saving…' : mode === 'edit' ? 'Save Changes' : 'Create Author'}
        </button>
        <a href="/admin/authors" className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <X size={14} /> Cancel
        </a>
      </div>
    </form>
  );
}
