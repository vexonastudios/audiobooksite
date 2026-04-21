import { NextResponse } from 'next/server';
import { getTopBooksThisWeek } from '@/lib/db/analytics';

// Public endpoint — no auth required.
// Returns top audiobooks by unique listener sessions in the last 7 days.
export async function GET() {
  try {
    const books = await getTopBooksThisWeek(20);
    return NextResponse.json({ books }, {
      headers: {
        // Cache for 30 minutes on CDN — fresh enough, avoids hammering DB
        'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
      },
    });
  } catch (e) {
    console.error('[GET /api/analytics/trending]', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
