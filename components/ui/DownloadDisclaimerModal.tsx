'use client';

import { useState } from 'react';
import { X, AlertTriangle, DownloadCloud } from 'lucide-react';

interface DownloadDisclaimerModalProps {
  isOpen: boolean;
  downloadUrl: string;
  filename: string;
  quality: string;
  sizeLabel: string;
  onClose: () => void;
}

export function DownloadDisclaimerModal({
  isOpen, downloadUrl, filename, quality, sizeLabel, onClose
}: DownloadDisclaimerModalProps) {
  const [agreed, setAgreed] = useState(false);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (!agreed) return;
    // Trigger download by creating a temporary anchor
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    onClose();
    setAgreed(false);
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) { onClose(); setAgreed(false); } }}
    >
      <div style={{
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--color-border)',
        maxWidth: 480, width: '100%',
        boxShadow: 'var(--shadow-xl)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertTriangle size={20} color="var(--color-warning, #f59e0b)" />
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Personal Use Only</h3>
          </div>
          <button
            onClick={() => { onClose(); setAgreed(false); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-tertiary)', padding: 4 }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px' }}>
          <div style={{
            background: 'var(--color-surface-2)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            marginBottom: 20,
            display: 'flex', alignItems: 'center', gap: 12,
            border: '1px solid var(--color-border)',
          }}>
            <DownloadCloud size={20} style={{ flexShrink: 0, color: 'var(--color-brand)' }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{filename}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>
                {quality} · ~{sizeLabel}
              </div>
            </div>
          </div>

          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', lineHeight: 1.65, margin: '0 0 16px' }}>
            This audiobook is provided free of charge for <strong>personal, non-commercial listening only</strong>. 
            By downloading this file you agree that you will:
          </p>

          <ul style={{ 
            color: 'var(--color-text-secondary)', fontSize: '0.875rem', 
            lineHeight: 1.8, margin: '0 0 20px', paddingLeft: 20 
          }}>
            <li>Not re-upload or redistribute this file on any platform</li>
            <li>Not share download links or make the file publicly available</li>
            <li>Not use it for commercial purposes of any kind</li>
            <li>Keep it for personal offline listening only</li>
          </ul>

          {/* Agree checkbox */}
          <label style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            cursor: 'pointer', marginBottom: 24,
            padding: '12px 14px',
            background: agreed ? 'rgba(91,76,245,0.06)' : 'var(--color-surface-2)',
            borderRadius: 'var(--radius-md)',
            border: `1px solid ${agreed ? 'var(--color-brand)' : 'var(--color-border)'}`,
            transition: 'all 0.15s ease',
          }}>
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              style={{ marginTop: 2, accentColor: 'var(--color-brand)', flexShrink: 0 }}
            />
            <span style={{ fontSize: '0.875rem', fontWeight: 500, lineHeight: 1.5 }}>
              I agree to the terms above and will use this file for personal offline listening only.
            </span>
          </label>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="btn btn-secondary"
              onClick={() => { onClose(); setAgreed(false); }}
              style={{ flex: 1 }}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleDownload}
              disabled={!agreed}
              style={{ flex: 2, opacity: agreed ? 1 : 0.45, cursor: agreed ? 'pointer' : 'not-allowed' }}
            >
              <DownloadCloud size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: '-3px' }} />
              Download MP3
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
