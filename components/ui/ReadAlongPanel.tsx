'use client';

import { useEffect, useRef, useState } from 'react';
import { parseVTT, getActiveCues } from '@/lib/parseVTT';
import type { TranscriptCue } from '@/lib/parseVTT';
import { X, Quote, Copy, Check, Share2, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { useUserStore } from '@/lib/store/userStore';

interface Props {
  slug: string;
  currentTime: number;
  isOpen: boolean;
  onClose: () => void;
  onSeek: (time: number) => void;
  bookTitle: string;
  authorName: string;
  vttUrl?: string | null;
}

function formatTimestamp(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export function ReadAlongPanel({ slug, currentTime, isOpen, onClose, onSeek, bookTitle, authorName, vttUrl }: Props) {
  const [cues, setCues] = useState<TranscriptCue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);
  const activeCueRef = useRef<HTMLDivElement>(null);
  const panelBodyRef = useRef<HTMLDivElement>(null);
  const hasScrolledRef = useRef(false);

  // Load VTT on open
  useEffect(() => {
    if (!isOpen || cues.length > 0) return;
    setLoading(true);
    setError(false);
    const url = vttUrl || `/transcripts/${slug}.vtt`;
    fetch(url)
      .then(r => { if (!r.ok) throw new Error('not found'); return r.text(); })
      .then(text => { setCues(parseVTT(text)); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [isOpen, slug, cues.length, vttUrl]);

  // Reset scroll flag when re-opened
  useEffect(() => {
    if (isOpen) hasScrolledRef.current = false;
  }, [isOpen]);

  const activeCues = getActiveCues(cues, currentTime);
  const activeCueId = activeCues[0]?.id ?? null;

  // Auto-scroll to active cue
  useEffect(() => {
    if (!activeCueRef.current || !panelBodyRef.current) return;
    activeCueRef.current.scrollIntoView({
      behavior: hasScrolledRef.current ? 'smooth' : 'auto',
      block: 'center',
    });
    hasScrolledRef.current = true;
  }, [activeCueId]);

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const selectedText = cues
    .filter(c => selectedIds.has(c.id))
    .sort((a, b) => a.start - b.start)
    .map(c => c.text)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  const quoteSettings = useUserStore(s => s.quoteSettings);
  let formattedText = quoteSettings.useQuotes ? `"${selectedText}"` : selectedText;
  if (quoteSettings.includeBook) formattedText += ` — ${authorName}, ${bookTitle}`;
  else formattedText += ` — ${authorName}`;
  if (quoteSettings.includeLink) formattedText += ` Listen at: https://scrollreader.com/audiobook/${slug}`;

  function copyQuote() {
    navigator.clipboard.writeText(formattedText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function shareQuote() {
    if (navigator.share) await navigator.share({ title: bookTitle, text: formattedText }).catch(() => {});
    else copyQuote();
  }

  function clearSelection() { setSelectedIds(new Set()); }

  function expandBefore() {
    if (selectedIds.size === 0 || cues.length === 0) return;
    const selected = cues.filter(c => selectedIds.has(c.id)).sort((a, b) => a.start - b.start);
    const firstIdx = cues.findIndex(c => c.id === selected[0].id);
    if (firstIdx > 0) setSelectedIds(prev => new Set([...Array.from(prev), cues[firstIdx - 1].id]));
  }

  function expandAfter() {
    if (selectedIds.size === 0 || cues.length === 0) return;
    const selected = cues.filter(c => selectedIds.has(c.id)).sort((a, b) => a.start - b.start);
    const lastIdx = cues.findIndex(c => c.id === selected[selected.length - 1].id);
    if (lastIdx < cues.length - 1) setSelectedIds(prev => new Set([...Array.from(prev), cues[lastIdx + 1].id]));
  }

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes slideInUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        /* Mobile: fullscreen slide-up overlay */
        @media (max-width: 768px) {
          .read-along-panel {
            left: 0 !important;
            right: 0 !important;
            top: 0 !important;
            bottom: 0 !important;
            max-width: 100% !important;
            border-left: none !important;
            border-radius: 0 !important;
            animation: slideInUp 280ms cubic-bezier(0.4,0,0.2,1) !important;
          }
          /* On mobile, timecodes are hidden — flowing text mode */
          .read-along-timestamp { display: none !important; }
          .read-along-cue {
            padding: 6px 20px !important;
            display: inline !important;
          }
          .read-along-body {
            padding: 20px !important;
            font-size: 1.0625rem !important;
            line-height: 1.85 !important;
            /* flowing paragraph rather than line-by-line */
          }
        }
      `}</style>

      {/* Backdrop */}
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)' }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="read-along-panel"
        style={{
          position: 'fixed',
          right: 0, top: 0, bottom: 0,
          zIndex: 201,
          width: '100%',
          maxWidth: 460,
          background: 'var(--color-surface)',
          borderLeft: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-xl)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideInRight 260ms cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '14px 16px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex', alignItems: 'center', gap: 10,
          flexShrink: 0,
          background: 'var(--color-surface)',
        }}>
          <BookOpen size={18} color="var(--color-brand)" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '1rem' }}>Read Along</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: 1 }}>
              {selectedIds.size > 0
                ? `${selectedIds.size} line${selectedIds.size !== 1 ? 's' : ''} selected — tap to build a quote`
                : 'Tap any line to select for sharing'}
            </div>
          </div>
          <button className="btn btn-icon" onClick={onClose} style={{ flexShrink: 0 }}>
            <X size={18} />
          </button>
        </div>

        {/* Quote action bar (appears when text selected) */}
        {selectedIds.size > 0 && (
          <div style={{
            padding: '10px 14px',
            background: 'var(--color-brand)',
            display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
            flexShrink: 0,
          }}>
            <button
              onClick={expandBefore}
              style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 6, color: 'white', padding: '5px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem' }}
            >
              <ChevronLeft size={14} /> Expand
            </button>
            <button
              onClick={expandAfter}
              style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 6, color: 'white', padding: '5px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem' }}
            >
              Expand <ChevronRight size={14} />
            </button>
            <div style={{ flex: 1 }} />
            <button
              onClick={copyQuote}
              style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 6, color: 'white', padding: '5px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem' }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button
              onClick={shareQuote}
              style={{ background: 'white', border: 'none', borderRadius: 6, color: 'var(--color-brand)', padding: '5px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', fontWeight: 700 }}
            >
              <Share2 size={14} /> Share
            </button>
            <button
              onClick={clearSelection}
              style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 6, color: 'white', padding: '5px 8px', cursor: 'pointer' }}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Body */}
        <div
          ref={panelBodyRef}
          className="read-along-body"
          style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}
        >
          {loading && (
            <div style={{ padding: 40 }}>
              {[80, 65, 90, 55, 75].map((w, i) => (
                <div key={i} className="skeleton" style={{ height: 14, width: `${w}%`, borderRadius: 6, marginBottom: 14 }} />
              ))}
            </div>
          )}

          {error && (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)' }}>
              <Quote size={32} style={{ margin: '0 auto 12px', opacity: 0.2 }} />
              <p style={{ fontSize: '0.875rem' }}>No transcript available for this audiobook yet.</p>
            </div>
          )}

          {!loading && !error && cues.map(cue => {
            const isActive = cue.id === activeCueId;
            const isSelected = selectedIds.has(cue.id);
            return (
              <div
                key={cue.id}
                ref={isActive ? activeCueRef : undefined}
                className="read-along-cue"
                onClick={() => isActive ? onSeek(cue.start) : toggleSelect(cue.id)}
                onDoubleClick={() => onSeek(cue.start)}
                style={{
                  padding: '9px 20px',
                  cursor: 'pointer',
                  transition: 'background 120ms ease',
                  background: isSelected
                    ? 'rgba(46,106,167,0.12)'
                    : isActive ? 'rgba(46,106,167,0.06)' : 'transparent',
                  borderLeft: isActive ? '3px solid var(--color-brand)' : '3px solid transparent',
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                  userSelect: 'none' as const,
                }}
              >
                {/* Timecode — hidden on mobile via CSS */}
                <span
                  className="read-along-timestamp"
                  style={{
                    fontSize: '0.65rem',
                    color: 'var(--color-text-muted)',
                    marginTop: 3,
                    flexShrink: 0,
                    fontVariantNumeric: 'tabular-nums',
                    opacity: isActive ? 1 : 0.5,
                    minWidth: 36,
                  }}
                >
                  {formatTimestamp(cue.start)}
                </span>

                {/* Text */}
                <span style={{
                  fontSize: '0.9375rem',
                  lineHeight: 1.65,
                  color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                  fontWeight: isActive ? 600 : 400,
                  flex: 1,
                }}>
                  {cue.text}
                </span>

                {/* Selection checkmark */}
                {isSelected && (
                  <Check size={13} style={{ flexShrink: 0, marginTop: 4, color: 'var(--color-brand)' }} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
