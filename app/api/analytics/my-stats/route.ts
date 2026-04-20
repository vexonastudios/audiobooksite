import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserListenStats, getUserTotalListenSecs, getUserListeningStreak } from '@/lib/db/analytics';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const [stats, totalSecs, streak] = await Promise.all([
      getUserListenStats(userId),
      getUserTotalListenSecs(userId),
      getUserListeningStreak(userId),
    ]);

    const booksStarted = stats.length;
    const booksCompleted = stats.filter(s => s.completionPct >= 90).length;

    // Derive favorite genre from most-listened categories
    const genreCounts: Record<string, number> = {};
    for (const s of stats) {
      for (const cat of s.categories) {
        genreCounts[cat] = (genreCounts[cat] || 0) + s.totalSecs;
      }
    }
    const favoriteGenre = Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    return NextResponse.json({
      totalSecs,
      streak,
      booksStarted,
      booksCompleted,
      favoriteGenre,
      books: stats,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
