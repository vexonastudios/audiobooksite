import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserBookmarks, upsertBookmark, deleteBookmark } from '@/lib/db/history';
import type { Bookmark } from '@/lib/types';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const bookmarks = await getUserBookmarks(userId);
    return NextResponse.json({ bookmarks });
  } catch (e) {
    console.error('[GET /api/user/bookmarks]', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const bookmark: Bookmark = await req.json();
    if (!bookmark?.id || !bookmark?.bookId) {
      return NextResponse.json({ error: 'Invalid bookmark data' }, { status: 400 });
    }
    await upsertBookmark(userId, bookmark);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[POST /api/user/bookmarks]', e);
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
    await deleteBookmark(userId, id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[DELETE /api/user/bookmarks]', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
