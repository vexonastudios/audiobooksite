import { NextResponse } from 'next/server';
import { getPlaylistBlocks } from '@/lib/db/radio';

// Public endpoint — no auth required
// Returns the currently-playing block derived from the ordered playlist + elapsed time.
// GET /api/now-playing

export const revalidate = 60; // Vercel cost opt: 60s (was 20s) — client interpolates position

export async function GET() {
  try {
    const blocks = await getPlaylistBlocks();

    if (blocks.length === 0) {
      return NextResponse.json({ active: false });
    }

    // Find the anchor block (play_order=1) — it holds broadcast_start_time
    const anchorBlock = blocks.find((b) => b.playOrder === 1);
    if (!anchorBlock?.broadcastStartTime) {
      // Playlist is queued but not started yet
      return NextResponse.json({ active: false, queued: true, queueLength: blocks.length });
    }

    const startMs = new Date(anchorBlock.broadcastStartTime).getTime();
    const nowMs = Date.now();
    let elapsed = (nowMs - startMs) / 1000; // seconds since playlist started

    // Total playlist duration
    const totalPlaylistDuration = blocks.reduce((sum, b) => sum + b.totalDuration, 0);

    // Loop the playlist if we've gone past all blocks
    if (totalPlaylistDuration > 0 && elapsed > totalPlaylistDuration) {
      elapsed = elapsed % totalPlaylistDuration;
    }

    // Walk through blocks to find which one is currently playing
    let cursor = 0;
    let currentBlock = blocks[blocks.length - 1]; // fallback to last
    let positionSecs = 0;
    let blockIndex = 0;
    let blockStartSecs = 0; // seconds into playlist when this block starts

    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i];
      if (elapsed < cursor + b.totalDuration) {
        currentBlock = b;
        positionSecs = elapsed - cursor;
        blockIndex = i;
        blockStartSecs = cursor;
        break;
      }
      cursor += b.totalDuration;
    }

    // Build ahead/behind info for each block (for admin UI via this endpoint)
    const blockSchedule = blocks.map((b, i) => {
      let blockStart = 0;
      for (let j = 0; j < i; j++) blockStart += blocks[j].totalDuration;
      return {
        id: b.id,
        label: b.label,
        totalDuration: b.totalDuration,
        chapterCount: b.chapterCount,
        mp3Url: b.mp3Url,
        manifestUrl: b.manifestUrl,
        playOrder: b.playOrder,
        // Estimated real-world start time
        estimatedStartTime: new Date(startMs + blockStart * 1000).toISOString(),
        isCurrent: i === blockIndex,
      };
    });

    return NextResponse.json({
      active: true,
      // Current block
      blockId: currentBlock.id,
      mp3Url: currentBlock.mp3Url,
      manifestUrl: currentBlock.manifestUrl,
      totalDuration: currentBlock.totalDuration,
      positionSecs: Math.round(positionSecs),
      label: currentBlock.label,
      // Playlist-level info
      playlistStartTime: anchorBlock.broadcastStartTime,
      totalPlaylistDuration,
      elapsedPlaylistSecs: Math.round(elapsed),
      blockIndex,
      blockCount: blocks.length,
      blockStartSecs: Math.round(blockStartSecs),
      // Full schedule for admin/UI use
      schedule: blockSchedule,
    });
  } catch (err) {
    console.error('GET /api/now-playing error:', err);
    return NextResponse.json({ active: false });
  }
}
