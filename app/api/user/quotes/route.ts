import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserQuotes, upsertUserQuote, deleteUserQuote } from '@/lib/db/quotes';
import type { SavedQuote } from '@/lib/types';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const quotes = await getUserQuotes(userId);
    return NextResponse.json({ quotes });
  } catch (e) {
    console.error('[GET /api/user/quotes]', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const quote: SavedQuote = await req.json();
    if (!quote?.id || !quote?.text || !quote?.bookId) {
      return NextResponse.json({ error: 'Invalid quote data' }, { status: 400 });
    }
    await upsertUserQuote(userId, quote);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[POST /api/user/quotes]', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    await deleteUserQuote(userId, id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[DELETE /api/user/quotes]', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
