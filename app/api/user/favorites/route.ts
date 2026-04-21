import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserFavorites, upsertUserFavorite, deleteUserFavorite } from '@/lib/db/quotes';
import type { Favorite } from '@/lib/types';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const favorites = await getUserFavorites(userId);
    return NextResponse.json({ favorites });
  } catch (e) {
    console.error('[GET /api/user/favorites]', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const fav: Favorite = await req.json();
    if (!fav?.id || !fav?.itemId || !fav?.title) {
      return NextResponse.json({ error: 'Invalid favorite data' }, { status: 400 });
    }
    await upsertUserFavorite(userId, fav);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[POST /api/user/favorites]', e);
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
    await deleteUserFavorite(userId, id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[DELETE /api/user/favorites]', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
