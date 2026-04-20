'use client';

import { useUserStore } from '@/lib/store/userStore';
import type { Favorite } from '@/lib/types';
import { useState } from 'react';

interface HeartButtonProps {
  item: Omit<Favorite, 'id' | 'createdAt'>;
  size?: number;
  /** absolute = overlaid on a card; inline = sits in a flex row */
  variant?: 'absolute' | 'inline';
  className?: string;
}

export function HeartButton({ item, size = 20, variant = 'absolute' }: HeartButtonProps) {
  const isFavorited = useUserStore((s) => s.isFavorited(item.itemId));
  const toggleFavorite = useUserStore((s) => s.toggleFavorite);
  const [popping, setPopping] = useState(false);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setPopping(true);
    setTimeout(() => setPopping(false), 350);
    toggleFavorite(item);
  }

  const baseStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: size + 16,
    height: size + 16,
    borderRadius: '50%',
    border: 'none',
    cursor: 'pointer',
    transition: 'transform 150ms cubic-bezier(0.4,0,0.2,1), background 150ms',
    transform: popping ? 'scale(1.35)' : 'scale(1)',
    background: isFavorited
      ? 'rgba(239,68,68,0.18)'
      : 'rgba(0,0,0,0.38)',
    backdropFilter: 'blur(6px)',
    WebkitBackdropFilter: 'blur(6px)',
    zIndex: 5,
  };

  const absoluteWrap: React.CSSProperties = {
    position: 'absolute',
    top: 8,
    right: 8,
  };

  return (
    <button
      onClick={handleClick}
      aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
      title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
      style={variant === 'absolute' ? { ...baseStyle, ...absoluteWrap } : baseStyle}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={isFavorited ? '#ef4444' : 'none'}
        stroke={isFavorited ? '#ef4444' : 'rgba(255,255,255,0.9)'}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ transition: 'fill 200ms, stroke 200ms' }}
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  );
}
