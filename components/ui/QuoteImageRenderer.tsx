'use client';

import React, { forwardRef } from 'react';

interface Props {
  quoteText: string;
  bookAuthor: string;
  bookTitle: string;
  chapterTitle?: string;
  coverDataUrl: string; // pre-fetched base64 data URL — no async loading in renderer
}

export const QuoteImageRenderer = forwardRef<HTMLDivElement, Props>(({ quoteText, bookAuthor, bookTitle, chapterTitle, coverDataUrl }, ref) => {
  return (
    <div 
      ref={ref}
      style={{
        position: 'fixed',
        top: -9999,
        left: -9999,
        width: 1080,
        height: 1080,
        backgroundColor: '#1a1a1a',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '100px 120px',
        boxSizing: 'border-box',
        color: 'white',
        fontFamily: '"Georgia", "Times New Roman", serif',
      }}
    >
      {/* Blurred Background — using <img> instead of background-image so html-to-image can inline it */}
      <img
        src={coverDataUrl}
        alt=""
        style={{
          position: 'absolute',
          inset: '-100px',
          width: 'calc(100% + 200px)',
          height: 'calc(100% + 200px)',
          objectFit: 'cover',
          filter: 'blur(30px) brightness(0.4)',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />

      {/* Gradient overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.4))',
        zIndex: 1
      }} />

      {/* Main Content */}
      <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingBottom: 60 }}>
        {/* Quote Text */}
        <div style={{
          fontSize: quoteText.length > 200 ? '42px' : '52px',
          lineHeight: 1.4,
          marginBottom: '60px',
          textShadow: '0 4px 12px rgba(0,0,0,0.4)',
        }}>
          {quoteText}
        </div>

        {/* Author */}
        <div style={{
          fontSize: '32px',
          textTransform: 'uppercase',
          letterSpacing: '4px',
          marginBottom: '16px',
          textShadow: '2px 2px 8px rgba(0,0,0,0.3)',
        }}>
          {bookAuthor}
        </div>

        {/* Book Title */}
        <div style={{
          fontSize: '26px',
          fontStyle: 'italic',
          opacity: 0.85,
          textShadow: '1px 1px 6px rgba(0,0,0,0.3)',
        }}>
          {bookTitle}{chapterTitle ? `: ${chapterTitle}` : ''}
        </div>
      </div>

      {/* Footer */}
      <div style={{
        position: 'absolute',
        bottom: 60,
        left: 60,
        right: 60,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        zIndex: 2,
      }}>
        {/* Branding */}
        <div style={{ paddingBottom: 10 }}>
          <div style={{ 
            fontSize: '18px', 
            textTransform: 'uppercase', 
            letterSpacing: '6px', 
            opacity: 0.7, 
            marginBottom: '12px' 
          }}>
            Audiobooks &amp; Books
          </div>
          <div style={{ 
            fontSize: '28px', 
            textTransform: 'uppercase', 
            letterSpacing: '4px', 
            border: '2px solid rgba(255,255,255,0.4)',
            padding: '12px 24px',
            display: 'inline-block'
          }}>
            scrollreader.com
          </div>
        </div>

        {/* Book Cover thumbnail */}
        <img 
          src={coverDataUrl}
          alt="Cover" 
          style={{ 
            width: 220, 
            height: 330, 
            objectFit: 'cover', 
            borderRadius: 8, 
            boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
            border: '1px solid rgba(255,255,255,0.1)'
          }} 
        />
      </div>

    </div>
  );
});

QuoteImageRenderer.displayName = 'QuoteImageRenderer';
