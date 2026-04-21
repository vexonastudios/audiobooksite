import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserHistory, upsertHistoryEntry, clearUserHistory } from '@/lib/db/history';
import type { HistoryEntry } from '@/lib/types';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const history = await getUserHistory(userId);
    return NextResponse.json({ history });
  } catch (e) {
    console.error('[GET /api/user/history]', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const entry: HistoryEntry = await req.json();
    if (!entry?.bookId) return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    await upsertHistoryEntry(userId, entry);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[POST /api/user/history]', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await clearUserHistory(userId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[DELETE /api/user/history]', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
