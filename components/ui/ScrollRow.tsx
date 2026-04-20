'use client';

import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { BookCard } from '@/components/ui/BookCard';
import type { Audiobook } from '@/lib/types';

interface ScrollRowProps {
  books: Audiobook[];
  cardWidth?: number;
  compact?: boolean;
}

export function ScrollRow({ books, cardWidth = 168, compact = false }: ScrollRowProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (ref.current) {
      const { scrollLeft, scrollWidth, clientWidth } = ref.current;
      setCanScrollLeft(scrollLeft > 5);
      setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth - 5);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [books]);

  const scrollLeft = () => {
    if (ref.current) ref.current.scrollBy({ left: -((cardWidth + 16) * 3), behavior: 'smooth' });
  };
  const scrollRight = () => {
    if (ref.current) ref.current.scrollBy({ left: (cardWidth + 16) * 3, behavior: 'smooth' });
  };

  return (
    <div className="scroll-row-wrapper" onMouseEnter={checkScroll}>
      <div className="scroll-row" ref={ref} onScroll={checkScroll}>
        {books.map((book) => (
          <BookCard key={book.id} book={book} width={cardWidth} compact={compact} />
        ))}
      </div>
      
      {canScrollLeft && (
        <>
          <div className="scroll-fade left" />
          <button className="scroll-arrow left" onClick={scrollLeft} aria-label="Scroll left">
            <ChevronLeft size={18} />
          </button>
        </>
      )}
      
      {canScrollRight && (
        <>
          <div className="scroll-fade right" />
          <button className="scroll-arrow right" onClick={scrollRight} aria-label="Scroll right">
            <ChevronRight size={18} />
          </button>
        </>
      )}
    </div>
  );
}
