import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserQuotes } from '@/lib/db/quotes';
import { getUserFavorites } from '@/lib/db/quotes';
import { getUserUpvotes } from '@/lib/db/quotes';
import { getUserHistory, getUserBookmarks } from '@/lib/db/history';

/**
 * GET /api/user/sync
 *
 * Vercel cost optimization (2026-04-25):
 * Combines 5 separate API calls (quotes, favorites, history, bookmarks, upvotes)
 * into a single endpoint. This reduces serverless function invocations by 80%
 * for the SyncUserData component (5 invocations → 1).
 *
 * Returns: { quotes, favorites, history, bookmarks, upvotes }
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const [quotes, favorites, history, bookmarks, upvotes] = await Promise.all([
      getUserQuotes(userId),
      getUserFavorites(userId),
      getUserHistory(userId),
      getUserBookmarks(userId),
      getUserUpvotes(userId),
    ]);

    return NextResponse.json({ quotes, favorites, history, bookmarks, upvotes });
  } catch (e) {
    console.error('[GET /api/user/sync]', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
