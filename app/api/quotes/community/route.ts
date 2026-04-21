import { NextResponse } from 'next/server';
import { getCommunityQuotes } from '@/lib/db/quotes';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
    const limit = Math.min(48, Math.max(1, Number(searchParams.get('limit') ?? '24')));
    const search = searchParams.get('search') ?? undefined;
    const bookId = searchParams.get('bookId') ?? undefined;

    const result = await getCommunityQuotes(page, limit, search, bookId);
    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    });
  } catch (e) {
    console.error('[GET /api/quotes/community]', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
