'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { parseVTT, getActiveCues } from '@/lib/parseVTT';
import type { TranscriptCue } from '@/lib/parseVTT';
import { X, Quote, Copy, Check, Share2, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [shareMode, setShareMode] = useState(false);
  const activeCueRef = useRef<HTMLDivElement>(null);
  const panelBodyRef = useRef<HTMLDivElement>(null);
  const hasScrolledRef = useRef(false);

  // Load VTT on open
  useEffect(() => {
    if (!isOpen || cues.length > 0) return;
    setLoading(true);
    setError(false);
    // fallback to local path if no cloud URL available
    const url = vttUrl || `/transcripts/${slug}.vtt`;
    
    fetch(url)
      .then(r => {
        if (!r.ok) throw new Error('not found');
        return r.text();
      })
      .then(text => { setCues(parseVTT(text)); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [isOpen, slug, cues.length]);

  // Find active cue index
  const activeCues = getActiveCues(cues, currentTime);
  const activeCueId = activeCues[0]?.id ?? null;

  // Auto-scroll to active cue
  useEffect(() => {
    if (!activeCueRef.current || !panelBodyRef.current) return;
    // Smooth scroll only after initial mount scroll
    activeCueRef.current.scrollIntoView({
      behavior: hasScrolledRef.current ? 'smooth' : 'auto',
      block: 'center',
    });
    hasScrolledRef.current = true;
  }, [activeCueId]);

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
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
  if (quoteSettings.includeBook) {
    formattedText += ` — ${authorName}, ${bookTitle}`;
  } else {
    formattedText += ` — ${authorName}`;
  }
  if (quoteSettings.includeLink) {
    formattedText += ` Listen at: https://scrollreader.com/audiobook/${slug}`;
  }

  function copyQuote() {
    navigator.clipboard.writeText(formattedText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function shareQuote() {
    if (navigator.share) {
      await navigator.share({ title: bookTitle, text: formattedText }).catch(() => {});
    } else {
      copyQuote();
    }
  }

  function clearSelection() {
    setSelectedIds(new Set());
    setShareMode(false);
  }

  function expandBefore() {
    if (selectedIds.size === 0 || cues.length === 0) return;
    const selected = cues.filter(c => selectedIds.has(c.id)).sort((a, b) => a.start - b.start);
    const firstIdx = cues.findIndex(c => c.id === selected[0].id);
    if (firstIdx > 0) {
      setSelectedIds(prev => new Set([...Array.from(prev), cues[firstIdx - 1].id]));
    }
  }

  function expandAfter() {
    if (selectedIds.size === 0 || cues.length === 0) return;
    const selected = cues.filter(c => selectedIds.has(c.id)).sort((a, b) => a.start - b.start);
    const lastIdx = cues.findIndex(c => c.id === selected[selected.length - 1].id);
    if (lastIdx < cues.length - 1) {
      setSelectedIds(prev => new Set([...Array.from(prev), cues[lastIdx + 1].id]));
    }
  }

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }}
        onClick={onClose}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed',
        right: 0, top: 0, bottom: 0,
        zIndex: 201,
        width: '100%',
        maxWidth: 440,
        background: 'var(--color-surface)',
        borderLeft: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-xl)',
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideInRight 260ms cubic-bezier(0.4,0,0.2,1)',
      }}>
        <style>{`
          @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
        `}</style>

        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem' }}>Read Along</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
              {selectedIds.size > 0 ? `${selectedIds.size} line${selectedIds.size !== 1 ? 's' : ''} selected — tap to select a quote` : 'Tap any line to select for sharing'}
            </div>
          </div>
          <button className="btn btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Quote share bar */}
        {selectedIds.size > 0 && (
          <div style={{ padding: '12px 16px', background: 'var(--color-brand)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', flexShrink: 0 }}>
            <button
              onClick={expandBefore}
              style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 6, color: 'white', padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem' }}
            ><ChevronLeft size={14} /> Expand</button>
            <button
              onClick={expandAfter}
              style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 6, color: 'white', padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem' }}
            >Expand <ChevronRight size={14} /></button>
            <div style={{ flex: 1 }} />
            <button
              onClick={copyQuote}
              style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 6, color: 'white', padding: '4px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem' }}
            >{copied ? <Check size={14} /> : <Copy size={14} />}{copied ? 'Copied!' : 'Copy'}</button>
            <button
              onClick={shareQuote}
              style={{ background: 'white', border: 'none', borderRadius: 6, color: 'var(--color-brand)', padding: '4px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', fontWeight: 700 }}
            ><Share2 size={14} /> Share</button>
            <button
              onClick={clearSelection}
              style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 6, color: 'white', padding: '4px 8px', cursor: 'pointer', fontSize: '0.8rem' }}
            ><X size={14} /></button>
          </div>
        )}

        {/* Body */}
        <div ref={panelBodyRef} style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {loading && (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)' }}>
              <div className="skeleton" style={{ height: 12, borderRadius: 6, margin: '0 24px 10px' }} />
              <div className="skeleton" style={{ height: 12, borderRadius: 6, margin: '0 32px 10px' }} />
              <div className="skeleton" style={{ height: 12, borderRadius: 6, margin: '0 16px 10px' }} />
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
                onClick={() => isActive ? onSeek(cue.start) : toggleSelect(cue.id)}
                onDoubleClick={() => onSeek(cue.start)}
                style={{
                  padding: '10px 20px',
                  cursor: 'pointer',
                  transition: 'background 120ms ease',
                  background: isSelected
                    ? 'rgba(46,106,167,0.15)'
                    : isActive
                      ? 'rgba(46,106,167,0.08)'
                      : 'transparent',
                  borderLeft: isActive ? '3px solid var(--color-brand)' : '3px solid transparent',
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                }}
              >
                <span style={{
                  fontSize: '0.65rem',
                  color: 'var(--color-text-muted)',
                  marginTop: 2,
                  flexShrink: 0,
                  fontVariantNumeric: 'tabular-nums',
                  opacity: isActive ? 1 : 0.6
                }}>
                  {formatTimestamp(cue.start)}
                </span>
                <span style={{
                  fontSize: '0.9375rem',
                  lineHeight: 1.6,
                  color: isActive
                    ? 'var(--color-text-primary)'
                    : 'var(--color-text-secondary)',
                  fontWeight: isActive ? 600 : 400,
                }}>
                  {cue.text}
                </span>
                {isSelected && (
                  <Check size={14} style={{ flexShrink: 0, marginTop: 4, color: 'var(--color-brand)' }} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
