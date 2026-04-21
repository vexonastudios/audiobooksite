import { NextResponse } from 'next/server';
import { getActiveRadioBlock } from '@/lib/db/radio';

// Public endpoint — no auth required
// Returns the active radio block + derived "now playing" position
// GET /api/now-playing

export const revalidate = 30; // ISR — rehydrate every 30 seconds

export async function GET() {
  try {
    const block = await getActiveRadioBlock();

    if (!block) {
      return NextResponse.json({ active: false });
    }

    if (!block.broadcastStartTime) {
      // Block registered but not yet started
      return NextResponse.json({ active: false, scheduled: false });
    }

    const startMs = new Date(block.broadcastStartTime).getTime();
    const nowMs = Date.now();
    const elapsedSecs = (nowMs - startMs) / 1000;
    const positionSecs =
      block.totalDuration > 0
        ? elapsedSecs % block.totalDuration
        : 0;

    return NextResponse.json({
      active: true,
      blockId: block.id,
      mp3Url: block.mp3Url,
      manifestUrl: block.manifestUrl,
      broadcastStartTime: block.broadcastStartTime,
      totalDuration: block.totalDuration,
      // Current seek offset in seconds — client uses this to sync
      positionSecs: Math.round(positionSecs),
    });
  } catch (err) {
    console.error('GET /api/now-playing error:', err);
    // Fail gracefully — radio is optional, don't break the site
    return NextResponse.json({ active: false });
  }
}
