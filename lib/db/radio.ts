import { sql } from './index';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RadioBlock {
  id: string;           // e.g. "radio-2025-06-09-1430"
  mp3Url: string;
  manifestUrl: string;
  totalDuration: number;  // seconds
  chapterCount: number;
  label: string | null;   // optional human label
  broadcastStartTime: string | null; // ISO string — null = not yet scheduled
  isActive: boolean;       // only one block should be active at a time
  generatedAt: string;     // ISO string
  createdAt: string;
}

// ── DB init (run once via API) ────────────────────────────────────────────────

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
      generated_at        TIMESTAMPTZ,
      created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

// ── Queries ────────────────────────────────────────────────────────────────────

export async function getAllRadioBlocks(): Promise<RadioBlock[]> {
  const rows = await sql`
    SELECT * FROM radio_blocks ORDER BY created_at DESC
  `;
  return rows.map(rowToBlock);
}

export async function getActiveRadioBlock(): Promise<RadioBlock | null> {
  const rows = await sql`
    SELECT * FROM radio_blocks WHERE is_active = true LIMIT 1
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
 * Sets a block as active: updates its broadcastStartTime to NOW and
 * deactivates all other blocks.
 */
export async function activateRadioBlock(id: string, broadcastStartTime?: string): Promise<RadioBlock> {
  const startTime = broadcastStartTime ?? new Date().toISOString();

  // Deactivate all
  await sql`UPDATE radio_blocks SET is_active = false`;

  // Activate the chosen block and set its start time
  const rows = await sql`
    UPDATE radio_blocks
    SET is_active = true, broadcast_start_time = ${startTime}
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
    generatedAt: row.generated_at,
    createdAt: row.created_at,
  };
}
