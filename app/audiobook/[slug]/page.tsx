'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useLibraryStore } from '@/lib/store/libraryStore';
import { usePlayerStore } from '@/lib/store/playerStore';
import { useUserStore } from '@/lib/store/userStore';
import { Play, Pause, SkipBack, SkipForward, Headphones, Share2, BookmarkPlus, Clock, List, AlertCircle } from 'lucide-react';
import { BookCard } from '@/components/ui/BookCard';

function formatTime(s: number) {
  if (isNaN(s) || !isFinite(s)) return '0:00';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  const mm = String(m).padStart(h > 0 ? 2 : 1, '0');
  const ss = String(sec).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export default function AudiobookPage() {
  const { slug } = useParams();
  const book = useLibraryStore((s) => s.getBySlug(slug as string));
  const isLoaded = useLibraryStore((s) => s.isLoaded);
  
  // Stores
  const { currentBook, isPlaying, currentTime, duration, playbackSpeed, 
          loadBook, setPlaying, setPlaybackSpeed, skipForward, skipBackward, jumpToChapter } = usePlayerStore();
  const { addBookmark, getBookmarksByBook, removeBookmark } = useUserStore();

  // Local state
  const [activeTab, setActiveTab] = useState<'chapters' | 'bookmarks' | 'share'>('chapters');
  const [bookmarkNote, setBookmarkNote] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const isCurrent = currentBook?.id === book?.id;
  const displayProgress = isCurrent && duration > 0 ? (currentTime / duration) * 100 : 0;
  
  // Find active chapter index for display
  const activeChapterIndex = usePlayerStore(s => s.activeChapterIndex);
  const currentChapterIdx = isCurrent ? activeChapterIndex : 0;
  const bookmarks = book ? getBookmarksByBook(book.id) : [];

  if (!isLoaded) {
    return (
      <div className="page" style={{ display: 'flex', gap: 32, padding: '40px 24px' }}>
        <div className="skeleton" style={{ width: 320, height: 320, borderRadius: 'var(--radius-xl)' }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
           <div className="skeleton" style={{ width: '100%', height: 200, borderRadius: 'var(--radius-xl)' }} />
           <div className="skeleton" style={{ width: '100%', height: 400, borderRadius: 'var(--radius-xl)' }} />
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="page" style={{ textAlign: 'center', padding: '100px 0' }}>
        <AlertCircle size={48} style={{ margin: '0 auto 16px', color: 'var(--color-warning)' }} />
        <h2>Audiobook not found</h2>
        <p className="text-secondary" style={{ marginTop: 8, marginBottom: 24 }}>The book you are looking for does not exist or was removed.</p>
        <Link href="/" className="btn btn-primary">Return Home</Link>
      </div>
    );
  }

  // Related books (same first category)
  const related = useLibraryStore.getState().getByCategory(book.categories[0] || '')
    .filter(b => b.id !== book.id).slice(0, 8);

  const handlePlayPause = () => {
    if (isCurrent) {
      setPlaying(!isPlaying);
    } else {
      loadBook(book);
    }
  };

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isCurrent) return;
    const { getAudioElement } = require('@/lib/store/playerStore');
    const audio = getAudioElement();
    const time = (parseFloat(e.target.value) / 100) * duration;
    audio.currentTime = time;
  };

  const handleAddBookmark = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCurrent) return;
    addBookmark(book.id, currentTime, bookmarkNote.trim() || 'Saved position');
    setBookmarkNote('');
  };

  const handleShare = () => {
    const url = new URL(window.location.href);
    if (isCurrent) {
      url.searchParams.set('t', Math.floor(currentTime).toString());
    }
    navigator.clipboard.writeText(url.toString());
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Set background color globally based on book
  const bgStyle = book.generatedColors 
    ? { background: book.generatedColors, opacity: 0.1, position: 'absolute' as const, inset: 0, zIndex: -1 } 
    : {};

  return (
    <div style={{ position: 'relative', minHeight: '100%' }}>
      {bgStyle.background && <div style={bgStyle} />}
      
      <div className="page pb-24">
        
        {/* Layout: Cover Left | Info & Player Right */}
        <div style={{ display: 'flex', flexDirection: 'row', gap: 32, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          
          {/* Left Column: Cover */}
          <div style={{ width: 340, maxWidth: '100%', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
             <img 
               src={book.coverImage || '/placeholder.png'} 
               alt={book.title} 
               style={{ width: '100%', aspectRatio: 1, objectFit: 'cover', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-lg)' }}
             />
             <div style={{ display: 'flex', justifyContent: 'center', gap: 24, padding: '8px 0' }}>
               <div style={{ textAlign: 'center' }}>
                 <div style={{ fontWeight: 700, fontSize: '1.25rem' }}>{(book.plays / 1000).toFixed(1)}k</div>
                 <div className="text-muted text-xs">Total Plays</div>
               </div>
               <div style={{ textAlign: 'center' }}>
                 <div style={{ fontWeight: 700, fontSize: '1.25rem' }}>{book.length.split(' ')[0]}</div>
                 <div className="text-muted text-xs">Hours</div>
               </div>
             </div>

             {/* External Links */}
             {(book.youtubeLink || book.spotifyLink || book.buyLink) && (
               <div className="card" style={{ padding: 16 }}>
                 <h4 style={{ marginBottom: 12, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)' }}>Read / Watch</h4>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                   {book.youtubeLink && <a href={book.youtubeLink} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>YouTube</a>}
                   {book.spotifyLink && <a href={book.spotifyLink} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>Spotify</a>}
                   {book.buyLink && <a href={book.buyLink} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>Buy Physical Book</a>}
                 </div>
               </div>
             )}
          </div>

          {/* Right Column: Stacked Cards */}
          <div style={{ flex: 1, minWidth: 300, display: 'flex', flexDirection: 'column', gap: 20 }}>
            
            {/* Header info (Mobile mostly, but useful here too) */}
            <div>
              <h1 style={{ marginBottom: 4 }}>{book.title}</h1>
              <p style={{ fontSize: '1.125rem', color: 'var(--color-brand)' }}>
                By <Link href={`/authors/${encodeURIComponent(book.authorName)}`} style={{ textDecoration: 'underline' }}>{book.authorName}</Link>
              </p>
            </div>

            {/* CARD 1: Player Controls */}
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <button className="btn-play-large" onClick={handlePlayPause} style={{ width: 64, height: 64 }}>
                    {isCurrent && isPlaying ? <Pause size={28} /> : <Play size={28} style={{ marginLeft: 3 }} />}
                  </button>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '1.125rem' }}>
                      {isCurrent ? (isPlaying ? 'Playing Audio' : 'Paused') : 'Ready to Play'}
                    </div>
                    {isCurrent && book.chapters[currentChapterIdx] && (
                       <div className="text-muted text-sm">{book.chapters[currentChapterIdx].title}</div>
                    )}
                  </div>
                </div>

                {/* Playback Settings */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <select 
                    value={playbackSpeed}
                    onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                    className="btn btn-secondary" 
                    style={{ padding: '8px 12px', fontSize: '0.875rem' }}
                  >
                    <option value="0.75">0.75x</option>
                    <option value="1">1.0x</option>
                    <option value="1.25">1.25x</option>
                    <option value="1.5">1.5x</option>
                    <option value="2">2.0x</option>
                  </select>
                </div>
              </div>

              {/* Scrubber Area */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
                <button className="btn btn-icon" onClick={skipBackward} disabled={!isCurrent}><SkipBack size={18} /></button>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
                   <span className="text-secondary text-sm" style={{ width: 45, textAlign: 'right' }}>
                     {isCurrent ? formatTime(currentTime) : '0:00'}
                   </span>
                   <input
                     type="range" min={0} max={100} step={0.1}
                     value={displayProgress}
                     onChange={handleScrub}
                     disabled={!isCurrent || duration === 0}
                     className="scrubber"
                   />
                   <span className="text-secondary text-sm" style={{ width: 45 }}>
                     {isCurrent ? formatTime(duration) : book.length.replace(/[a-zA-Z]+/g, '').trim() + ':00' /* fallback */}
                   </span>
                </div>
                <button className="btn btn-icon" onClick={skipForward} disabled={!isCurrent}><SkipForward size={18} /></button>
              </div>
            </div>

            {/* CARD 2: Interactive Tabs (Chapters / Bookmarks / Share) */}
            <div className="card" style={{ padding: '16px 24px 24px', flex: 1 }}>
              <div className="tabs">
                <button className={`tab ${activeTab === 'chapters' ? 'active' : ''}`} onClick={() => setActiveTab('chapters')}>
                  <List size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: '-3px' }}/> Chapters
                </button>
                <button className={`tab ${activeTab === 'bookmarks' ? 'active' : ''}`} onClick={() => setActiveTab('bookmarks')}>
                  <BookmarkPlus size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: '-3px' }}/> Bookmarks
                </button>
                <button className={`tab ${activeTab === 'share' ? 'active' : ''}`} onClick={() => setActiveTab('share')}>
                  <Share2 size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: '-3px' }}/> Share
                </button>
              </div>

              <div style={{ maxHeight: 400, overflowY: 'auto', paddingRight: 8 }}>
                {/* CHAPTERS TAB */}
                {activeTab === 'chapters' && (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {book.chapters.map((ch, idx) => {
                      const isActive = isCurrent && currentChapterIdx === idx;
                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            if (!isCurrent) loadBook(book, ch.startTime);
                            else jumpToChapter(idx);
                          }}
                          style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '12px 16px', borderRadius: 'var(--radius-md)',
                            background: isActive ? 'var(--color-surface-2)' : 'transparent',
                            textAlign: 'left', transition: 'background var(--transition-fast)'
                          }}
                          onMouseEnter={e => !isActive && (e.currentTarget.style.background = 'var(--color-border)')}
                          onMouseLeave={e => !isActive && (e.currentTarget.style.background = 'transparent')}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            {isActive ? <Headphones size={18} color="var(--color-brand)" /> : <span className="text-muted" style={{ width: 18, fontSize: '0.875rem' }}>{idx+1}</span>}
                            <span style={{ fontWeight: isActive ? 600 : 400, color: isActive ? 'var(--color-brand)' : 'inherit' }}>{ch.title}</span>
                          </div>
                          <div className="text-muted text-sm">{formatTime(ch.startTime)}</div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* BOOKMARKS TAB */}
                {activeTab === 'bookmarks' && (
                  <div>
                    {isCurrent ? (
                      <form onSubmit={handleAddBookmark} style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                        <input 
                          type="text" 
                          placeholder={`Add a note at ${formatTime(currentTime)}...`}
                          value={bookmarkNote}
                          onChange={e => setBookmarkNote(e.target.value)}
                          className="search-input"
                          style={{ flex: 1, paddingLeft: 16 }}
                        />
                        <button type="submit" className="btn btn-primary" disabled={!bookmarkNote.trim()}>Save</button>
                      </form>
                    ) : (
                      <div className="text-muted text-sm" style={{ marginBottom: 20, fontStyle: 'italic' }}>
                        Start playing this book to add new bookmarks.
                      </div>
                    )}

                    {bookmarks.length === 0 ? (
                      <div className="text-muted text-center" style={{ padding: '32px 0' }}>No bookmarks saved for this book.</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {bookmarks.sort((a,b) => a.time - b.time).map(bm => (
                          <div key={bm.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '16px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                            <div>
                               <div style={{ fontWeight: 600, color: 'var(--color-brand)', marginBottom: 4, cursor: 'pointer' }}
                                    onClick={() => { if(!isCurrent) loadBook(book, bm.time); else { const {getAudioElement} = require('@/lib/store/playerStore'); getAudioElement().currentTime = bm.time; } }}>
                                 {formatTime(bm.time)}
                               </div>
                               <div className="text-secondary">{bm.note}</div>
                               <div className="text-xs text-muted" style={{ marginTop: 8 }}>Added {new Date(bm.createdAt).toLocaleDateString()}</div>
                            </div>
                            <button className="btn btn-icon text-error" onClick={() => removeBookmark(bm.id)}>
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* SHARE TAB */}
                {activeTab === 'share' && (
                  <div style={{ padding: '24px 0', textAlign: 'center' }}>
                    <div style={{ marginBottom: 24 }}>
                       <Share2 size={48} style={{ margin: '0 auto', color: 'var(--color-brand)', opacity: 0.2 }} />
                    </div>
                    <h3 style={{ marginBottom: 8 }}>Share this audiobook</h3>
                    <p className="text-secondary" style={{ marginBottom: 24 }}>
                      {isCurrent ? `We'll generate a link that starts playing exactly at ${formatTime(currentTime)}.` : 'Share a link to this audiobook.'}
                    </p>
                    <button className="btn btn-primary" onClick={handleShare} style={{ minWidth: 200 }}>
                       {copiedLink ? 'Link Copied!' : 'Copy Link'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* CARD 3: Meta & Description */}
            <div className="card">
              <h3 style={{ marginBottom: 16 }}>About the Book</h3>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                {book.categories.map(c => <Link key={c} href={`/categories/${encodeURIComponent(c)}`} className="pill">{c}</Link>)}
                {book.topics.map(t => <Link key={t} href={`/topics/${encodeURIComponent(t)}`} className="pill">#{t}</Link>)}
                {book.originalYear && <span className="pill" style={{ background: 'transparent', border: 'none' }}>Published {book.originalYear}</span>}
              </div>
              
              <div 
                className="prose"
                style={{ 
                  color: 'var(--color-text-secondary)', 
                  lineHeight: 1.7, 
                  fontSize: '0.9375rem',
                  maxWidth: '100%',
                  overflow: 'hidden'
                }}
                dangerouslySetInnerHTML={{ __html: book.description || book.excerpt }}
              />
            </div>
          </div>
        </div>

        {/* More Like This */}
        {related.length > 0 && (
          <div style={{ marginTop: 64 }}>
            <div className="section-header">
              <h2 className="section-title">More Like This</h2>
            </div>
            <div className="scroll-row">
              {related.map(rBook => (
                 <BookCard key={rBook.id} book={rBook} />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// Need to import X icon since it was missed in the initial lucide-react import
import { X } from 'lucide-react';
