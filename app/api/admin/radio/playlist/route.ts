import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { updatePlaylistOrder, startPlaylist, stopPlaylist, ensureRadioTable } from '@/lib/db/radio';

// POST /api/admin/radio/playlist — start the playlist with an ordered list of IDs
// PATCH /api/admin/radio/playlist — update order without restarting
// DELETE /api/admin/radio/playlist — stop the playlist

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await ensureRadioTable();
    const body = await req.json();
    const { orderedIds, broadcastStartTime } = body as { orderedIds: string[]; broadcastStartTime?: string };
    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return NextResponse.json({ error: 'orderedIds must be a non-empty array' }, { status: 400 });
    }
    await startPlaylist(orderedIds, broadcastStartTime);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('POST /api/admin/radio/playlist error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { orderedIds } = body as { orderedIds: string[] };
    if (!Array.isArray(orderedIds)) {
      return NextResponse.json({ error: 'orderedIds required' }, { status: 400 });
    }
    await updatePlaylistOrder(orderedIds);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('PATCH /api/admin/radio/playlist error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await stopPlaylist();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/admin/radio/playlist error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
