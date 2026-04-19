import { NextResponse } from 'next/server';
import { getAllAudiobooks } from '@/lib/db/audiobooks';
import { getAllAuthors } from '@/lib/db/authors';
import { neon } from '@neondatabase/serverless';
import audiobooksJson from '@/public/data/audiobooks.json';
import articlesJson from '@/public/data/articles.json';

export const revalidate = 60; // ISR — refresh every 60 seconds

async function getAllArticles() {
  const sql = neon(process.env.DATABASE_URL!);
  const rows = await sql`
    SELECT id, slug, title, excerpt, content AS description, pub_date AS "pubDate",
           author_name AS "authorName", cover_image AS "coverImage",
           categories, topics, published
    FROM articles
    WHERE published = true
    ORDER BY pub_date DESC
  `;
  return rows;
}

export async function GET() {
  try {
    const [audiobooks, articles, authors] = await Promise.all([
      getAllAudiobooks(),
      getAllArticles(),
      getAllAuthors(),
    ]);

    if (audiobooks.length > 0) {
      return NextResponse.json({
        audiobooks,
        articles: articles.length > 0 ? articles : articlesJson,
        authors,
      });
    }

    return NextResponse.json({
      audiobooks: audiobooksJson,
      articles: articlesJson,
      authors: [],
    });
  } catch (err) {
    console.error('Library API error, falling back to JSON:', err);
    return NextResponse.json({
      audiobooks: audiobooksJson,
      articles: articlesJson,
      authors: [],
    });
  }
}
