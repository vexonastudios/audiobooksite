import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { activateRadioBlock, deleteRadioBlock, getRadioBlockById } from '@/lib/db/radio';

// PATCH /api/admin/radio/[id] — activate a block (optionally set broadcastStartTime)
// DELETE /api/admin/radio/[id] — remove a block

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const broadcastStartTime: string | undefined = body.broadcastStartTime;

  try {
    const block = await activateRadioBlock(id, broadcastStartTime);
    return NextResponse.json({ block });
  } catch (err) {
    console.error('PATCH /api/admin/radio/[id] error:', err);
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  try {
    await deleteRadioBlock(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/admin/radio/[id] error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  try {
    const block = await getRadioBlockById(id);
    if (!block) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ block });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
