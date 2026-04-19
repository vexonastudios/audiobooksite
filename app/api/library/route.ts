import { NextResponse } from 'next/server';
import { getAllAudiobooks } from '@/lib/db/audiobooks';
import audiobooksJson from '@/public/data/audiobooks.json';
import articlesJson from '@/public/data/articles.json';

export const revalidate = 60; // ISR — refresh every 60 seconds

export async function GET() {
  try {
    // Try the database first
    const audiobooks = await getAllAudiobooks();
    
    // If DB has data, return it
    if (audiobooks.length > 0) {
      return NextResponse.json({
        audiobooks,
        articles: articlesJson, // articles still from JSON for now
      });
    }

    // Fallback to static JSON while migration is pending
    return NextResponse.json({
      audiobooks: audiobooksJson,
      articles: articlesJson,
    });
  } catch (err) {
    console.error('Library API error, falling back to JSON:', err);
    // Always fall back to static JSON if DB fails
    return NextResponse.json({
      audiobooks: audiobooksJson,
      articles: articlesJson,
    });
  }
}
