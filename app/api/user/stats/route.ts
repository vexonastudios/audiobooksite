import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { sql } from '@/lib/db/index';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const [histRow, quotesRow] = await Promise.all([
      sql`
        SELECT
          COALESCE(SUM(position_secs), 0)::int AS total_secs,
          COUNT(*)::int                          AS books_started
        FROM user_history
        WHERE user_id = ${userId}
      `,
      sql`
        SELECT COUNT(*)::int AS quotes_saved
        FROM user_quotes
        WHERE user_id = ${userId}
      `,
    ]);

    return NextResponse.json({
      totalListenSecs: Number(histRow[0]?.total_secs ?? 0),
      booksStarted:    Number(histRow[0]?.books_started ?? 0),
      quotesSaved:     Number(quotesRow[0]?.quotes_saved ?? 0),
    });
  } catch (e) {
    console.error('[GET /api/user/stats]', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
