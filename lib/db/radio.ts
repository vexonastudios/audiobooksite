import { sql } from './index';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RadioBlock {
  id: string;
  mp3Url: string;
  manifestUrl: string;
  totalDuration: number;  // seconds
  chapterCount: number;
  label: string | null;
  broadcastStartTime: string | null; // ISO — used as playlist_start_time on play_order=1 block
  isActive: boolean;       // true = block is part of the active/running playlist
  playOrder: number | null; // null = not queued; 1 = first in playlist, 2 = second, etc.
  generatedAt: string;
  createdAt: string;
}

// The "playlist" is the set of all blocks with playOrder != null, ordered by playOrder.
// The block with playOrder=1 stores broadcastStartTime = when the whole playlist started.
// All blocks in the playlist have isActive=true while the playlist is running.

// ── DB init ────────────────────────────────────────────────────────────────────

export async function ensureRadioTable(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS radio_blocks (
      id                  TEXT PRIMARY KEY,
      mp3_url             TEXT  NOT NULL,
      manifest_url        TEXT  NOT NULL,
      total_duration      INTEGER NOT NULL DEFAULT 0,
      chapter_count       INTEGER NOT NULL DEFAULT 0,
      label               TEXT,
      broadcast_start_time TIMESTAMPTZ,
      is_active           BOOLEAN NOT NULL DEFAULT false,
      play_order          INTEGER,
      generated_at        TIMESTAMPTZ,
      created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  // Add play_order column if it doesn't exist (for existing tables)
  await sql`
    ALTER TABLE radio_blocks ADD COLUMN IF NOT EXISTS play_order INTEGER
  `.catch(() => {}); // ignore if already exists
}

// ── Queries ────────────────────────────────────────────────────────────────────

export async function getAllRadioBlocks(): Promise<RadioBlock[]> {
  const rows = await sql`
    SELECT * FROM radio_blocks ORDER BY
      CASE WHEN play_order IS NOT NULL THEN play_order ELSE 9999 END ASC,
      created_at DESC
  `;
  return rows.map(rowToBlock);
}

/** Returns all blocks in the active playlist, ordered by play_order */
export async function getPlaylistBlocks(): Promise<RadioBlock[]> {
  const rows = await sql`
    SELECT * FROM radio_blocks
    WHERE play_order IS NOT NULL
    ORDER BY play_order ASC
  `;
  return rows.map(rowToBlock);
}

/** Returns the block with play_order=1 (the one that holds broadcast_start_time) */
export async function getActiveRadioBlock(): Promise<RadioBlock | null> {
  const rows = await sql`
    SELECT * FROM radio_blocks
    WHERE is_active = true AND play_order = 1
    LIMIT 1
  `;
  return rows[0] ? rowToBlock(rows[0]) : null;
}

export async function getRadioBlockById(id: string): Promise<RadioBlock | null> {
  const rows = await sql`SELECT * FROM radio_blocks WHERE id = ${id}`;
  return rows[0] ? rowToBlock(rows[0]) : null;
}

export async function insertRadioBlock(data: {
  id: string;
  mp3Url: string;
  manifestUrl: string;
  totalDuration: number;
  chapterCount: number;
  label?: string;
  generatedAt?: string;
}): Promise<RadioBlock> {
  const rows = await sql`
    INSERT INTO radio_blocks (id, mp3_url, manifest_url, total_duration, chapter_count, label, generated_at)
    VALUES (
      ${data.id},
      ${data.mp3Url},
      ${data.manifestUrl},
      ${data.totalDuration},
      ${data.chapterCount},
      ${data.label ?? null},
      ${data.generatedAt ?? new Date().toISOString()}
    )
    RETURNING *
  `;
  return rowToBlock(rows[0]);
}

/**
 * Starts the playlist: assigns play_order to the given ordered list of IDs,
 * sets is_active=true on all of them, sets broadcast_start_time=now on the first one.
 * Any blocks NOT in the list are taken out of the queue (play_order=null, is_active=false).
 */
export async function startPlaylist(
  orderedIds: string[],
  broadcastStartTime?: string,
): Promise<void> {
  const startTime = broadcastStartTime ?? new Date().toISOString();

  // First: clear all blocks from active playlist
  await sql`UPDATE radio_blocks SET is_active = false, play_order = null, broadcast_start_time = null`;

  // Now assign order and activate
  for (let i = 0; i < orderedIds.length; i++) {
    const id = orderedIds[i];
    if (i === 0) {
      // First block stores the playlist start time
      await sql`
        UPDATE radio_blocks
        SET is_active = true, play_order = ${i + 1}, broadcast_start_time = ${startTime}
        WHERE id = ${id}
      `;
    } else {
      await sql`
        UPDATE radio_blocks
        SET is_active = true, play_order = ${i + 1}, broadcast_start_time = null
        WHERE id = ${id}
      `;
    }
  }
}

/** Just update the play_order for queued blocks without changing broadcast_start_time */
export async function updatePlaylistOrder(orderedIds: string[]): Promise<void> {
  // Remove all from queue first
  await sql`UPDATE radio_blocks SET play_order = null WHERE play_order IS NOT NULL`;
  for (let i = 0; i < orderedIds.length; i++) {
    await sql`UPDATE radio_blocks SET play_order = ${i + 1} WHERE id = ${orderedIds[i]}`;
  }
}

/** Stop the playlist completely */
export async function stopPlaylist(): Promise<void> {
  await sql`
    UPDATE radio_blocks
    SET is_active = false, play_order = null, broadcast_start_time = null
  `;
}

/**
 * Legacy: activate a single block and deactivate all others.
 * Kept for backward compat with existing PATCH endpoint.
 * Prefer startPlaylist() for the new queue model.
 */
export async function activateRadioBlock(id: string, broadcastStartTime?: string): Promise<RadioBlock> {
  const startTime = broadcastStartTime ?? new Date().toISOString();
  await sql`UPDATE radio_blocks SET is_active = false, play_order = null, broadcast_start_time = null`;
  const rows = await sql`
    UPDATE radio_blocks
    SET is_active = true, play_order = 1, broadcast_start_time = ${startTime}
    WHERE id = ${id}
    RETURNING *
  `;
  if (!rows[0]) throw new Error(`Radio block "${id}" not found`);
  return rowToBlock(rows[0]);
}

export async function deleteRadioBlock(id: string): Promise<void> {
  await sql`DELETE FROM radio_blocks WHERE id = ${id}`;
}

// ── Helper ─────────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToBlock(row: any): RadioBlock {
  return {
    id: row.id,
    mp3Url: row.mp3_url,
    manifestUrl: row.manifest_url,
    totalDuration: Number(row.total_duration),
    chapterCount: Number(row.chapter_count),
    label: row.label ?? null,
    broadcastStartTime: row.broadcast_start_time ?? null,
    isActive: Boolean(row.is_active),
    playOrder: row.play_order != null ? Number(row.play_order) : null,
    generatedAt: row.generated_at,
    createdAt: row.created_at,
  };
}
