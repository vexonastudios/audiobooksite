import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  ensureRadioTable,
  getAllRadioBlocks,
  insertRadioBlock,
} from '@/lib/db/radio';

// GET /api/admin/radio — list all blocks
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await ensureRadioTable();
    const blocks = await getAllRadioBlocks();
    return NextResponse.json({ blocks });
  } catch (err) {
    console.error('GET /api/admin/radio error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST /api/admin/radio — register a new block
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await ensureRadioTable();

    const body = await req.json();
    const { id, mp3Url, manifestUrl, totalDuration, chapterCount, label, generatedAt } = body;

    if (!id || !mp3Url || !manifestUrl) {
      return NextResponse.json(
        { error: 'id, mp3Url, and manifestUrl are required' },
        { status: 400 },
      );
    }

    const block = await insertRadioBlock({
      id,
      mp3Url,
      manifestUrl,
      totalDuration: Number(totalDuration ?? 0),
      chapterCount: Number(chapterCount ?? 0),
      label: label || null,
      generatedAt: generatedAt || undefined,
    });

    return NextResponse.json({ block }, { status: 201 });
  } catch (err) {
    console.error('POST /api/admin/radio error:', err);
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
