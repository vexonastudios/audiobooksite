'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Copy, Check, Bookmark, Share2 } from 'lucide-react';
import type { TranscriptCue } from '@/lib/parseVTT';
import { useUserStore } from '@/lib/store/userStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  allCues: TranscriptCue[];
  currentTime: number;
  bookId: string;
  bookTitle: string;
  bookSlug: string;
  bookAuthor: string;
  bookCover?: string;
  chapterTitle?: string;
}

function fmt(s: number) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60);
  return h > 0 ? `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}` : `${m}:${String(sec).padStart(2,'0')}`;
}

function isSentenceEnd(text: string) {
  const t = text.trim();
  if (/(?:Mr|Mrs|Ms|Dr|St|Rev)\.$/i.test(t)) return false;
  return /[.!?]["']?$/.test(t);
}

export function QuoteModal({ isOpen, onClose, allCues, currentTime, bookId, bookTitle, bookSlug, bookAuthor, bookCover, chapterTitle }: Props) {
  const saveQuote = useUserStore(s => s.saveQuote);

  // Window indices into allCues
  const [startIdx, setStartIdx] = useState(0);
  const [endIdx, setEndIdx] = useState(0);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  // Replace getCuesInRange logic to snap to sentence boundaries enclosing currentTime
  useEffect(() => {
    if (!isOpen || allCues.length === 0) return;
    
    // 1. Find the cue corresponding to currentTime
    let currentIndex = allCues.findIndex(c => currentTime >= c.start && currentTime <= c.end);
    if (currentIndex === -1) {
      currentIndex = allCues.findIndex(c => c.start >= currentTime);
      if (currentIndex === -1) currentIndex = allCues.length - 1;
    }

    // 2. Expand outwards to form a full sentence
    let start = currentIndex;
    while (start > 0 && !isSentenceEnd(allCues[start - 1].text)) {
      start--;
    }
    
    let end = currentIndex;
    while (end < allCues.length - 1 && !isSentenceEnd(allCues[end].text)) {
      end++;
    }
    
    setStartIdx(start);
    setEndIdx(end);
    setCopied(false);
    setSaved(false);
  }, [isOpen, currentTime, allCues]);

  const selectedCues = allCues.slice(startIdx, endIdx + 1);
  const quoteText = selectedCues.map(c => c.text).join(' ').replace(/\s+/g, ' ').trim();

  const formattedQuote = `"${quoteText}"\n\n— ${bookAuthor}, ${bookTitle}${chapterTitle ? ` (${chapterTitle})` : ''}\n\nListen at scrollreader.com/audiobook/${bookSlug}?t=${Math.floor(currentTime)}`;

  function expandBefore() {
    setStartIdx(i => {
      if (i <= 0) return 0;
      let nextI = i - 1;
      while (nextI > 0 && !isSentenceEnd(allCues[nextI - 1].text)) nextI--;
      return nextI;
    });
  }
  
  function shrinkBefore() {
    setStartIdx(i => {
      let nextI = i;
      while (nextI < endIdx && !isSentenceEnd(allCues[nextI].text)) nextI++;
      return Math.min(nextI + 1, endIdx);
    });
  }

  function expandAfter() {
    setEndIdx(i => {
      let nextI = i + 1;
      while (nextI < allCues.length - 1 && !isSentenceEnd(allCues[nextI].text)) nextI++;
      return Math.min(nextI, allCues.length - 1);
    });
  }

  function shrinkAfter() {
    setEndIdx(i => {
      let nextI = i - 1;
      while (nextI > startIdx && !isSentenceEnd(allCues[nextI].text)) nextI--;
      return Math.max(nextI, startIdx);
    });
  }

  function handleCopy() {
    navigator.clipboard.writeText(formattedQuote).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  function handleShare() {
    if (navigator.share) {
      navigator.share({ title: `Quote from ${bookTitle}`, text: formattedQuote }).catch(() => {});
    } else {
      handleCopy();
    }
  }

  function handleSave() {
    if (!quoteText) return;
    saveQuote({ text: quoteText, bookId, bookTitle, bookSlug, bookAuthor, bookCover, chapterTitle, time: currentTime });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  if (!isOpen) return null;

  const hasNoCues = allCues.length === 0;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 301,
        width: '100%',
        maxWidth: 580,
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-xl)',
        overflow: 'hidden',
        animation: 'fadeIn 200ms ease both',
      }}>
        {/* Header */}
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, background: 'var(--color-surface-2)' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem' }}>Share a Quote</div>
            {chapterTitle && <div style={{ fontSize: '0.75rem', color: 'var(--color-brand)', marginTop: 2 }}>{chapterTitle} · {fmt(currentTime)}</div>}
          </div>
          <button className="btn btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        {hasNoCues ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <p style={{ fontSize: '0.875rem' }}>No transcript available for this audiobook yet.</p>
            <p style={{ fontSize: '0.8rem', marginTop: 8 }}>Export a VTT from YouTube and add it to unlock Quote Sharing.</p>
          </div>
        ) : (
          <>
            {/* Expand / Shrink controls */}
            <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginRight: 4 }}>Selection:</span>
              <button onClick={expandBefore} disabled={startIdx === 0} className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                <ChevronLeft size={13} /> More before
              </button>
              <button onClick={shrinkBefore} disabled={startIdx >= endIdx} className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                Less before <ChevronRight size={13} />
              </button>
              <div style={{ flex: 1 }} />
              <button onClick={shrinkAfter} disabled={endIdx <= startIdx} className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                <ChevronLeft size={13} /> Less after
              </button>
              <button onClick={expandAfter} disabled={endIdx >= allCues.length - 1} className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                More after <ChevronRight size={13} />
              </button>
            </div>

            {/* Quote preview */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px 24px 16px', minHeight: 0 }}>
              {/* Show individual selectable cues dimmed out for context */}
              <div style={{ marginBottom: 20 }}>
                {allCues.slice(Math.max(0, startIdx - 2), startIdx).map(c => (
                  <span key={c.id} style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', opacity: 0.4, lineHeight: 1.7, marginRight: 4 }}>{c.text}</span>
                ))}
                
                <div style={{
                  background: 'rgba(46,106,167,0.08)',
                  border: '2px solid var(--color-brand)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px 20px',
                  margin: '8px 0',
                  fontSize: '1.05rem', 
                  lineHeight: 1.7, 
                  color: 'var(--color-text-primary)', 
                  fontStyle: 'italic',
                }}>
                  {quoteText}
                </div>

                {allCues.slice(endIdx + 1, Math.min(allCues.length, endIdx + 3)).map(c => (
                  <span key={c.id} style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', opacity: 0.4, lineHeight: 1.7, marginRight: 4 }}>{c.text}</span>
                ))}
              </div>

              {/* Formatted attribution preview */}
              <div style={{ background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)', padding: '14px 18px', fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, fontFamily: 'monospace' }}>
                <div style={{ fontStyle: 'italic', marginBottom: 6 }}>"{quoteText}"</div>
                <div style={{ color: 'var(--color-brand)', fontWeight: 600 }}>
                  — {bookAuthor}, {bookTitle}{chapterTitle ? ` (${chapterTitle})` : ''}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ padding: '14px 20px', borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, flexWrap: 'wrap' }}>
              <button
                onClick={handleSave}
                className={`btn ${saved ? 'btn-secondary' : 'btn-secondary'}`}
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.875rem' }}
                disabled={saved || !quoteText}
              >
                <Bookmark size={15} />
                {saved ? 'Saved to Quotes!' : 'Save Quote'}
              </button>
              <div style={{ flex: 1 }} />
              <button
                onClick={handleCopy}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.875rem' }}
                disabled={!quoteText}
              >
                {copied ? <Check size={15} /> : <Copy size={15} />}
                {copied ? 'Copied!' : 'Copy Text'}
              </button>
              <button
                onClick={handleShare}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.875rem' }}
                disabled={!quoteText}
              >
                <Share2 size={15} />
                Share
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
