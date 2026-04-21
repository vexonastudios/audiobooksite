// src/manifest.js
// Builds the JSON manifest that describes every track in a radio block.
// This file is uploaded alongside the MP3 and lets the frontend display
// "Now Playing: Chapter 3 — The Path of Prayer" in real time.

/**
 * @typedef {Object} Track
 * @property {number}  offset      - Start offset in seconds within the block MP3
 * @property {number}  duration    - Duration in seconds
 * @property {'bumper'|'chapter'} type
 * @property {string}  [title]     - Chapter title (chapter tracks only)
 * @property {string}  [bookTitle] - Book title (chapter tracks only)
 * @property {string}  [bookSlug]  - URL slug for the book
 * @property {string}  [authorName]
 */

/**
 * Builds from a flat ordered list of:
 *   { type: 'bumper'|'chapter', duration, book?, chapter? }
 * and computes running offsets.
 *
 * @param {Object[]} tracks
 * @param {string}   blockId
 * @returns {Object} manifest
 */
export function buildManifest(tracks, blockId) {
  let offset = 0;
  const entries = [];

  for (const t of tracks) {
    const entry = {
      offset: Math.round(offset),
      duration: Math.round(t.duration),
      type: t.type,
    };

    if (t.type === 'chapter') {
      entry.title = t.chapter.title;
      entry.bookTitle = t.book.title;
      entry.bookSlug = t.book.slug;
      entry.authorName = t.book.authorName;
    }

    entries.push(entry);
    offset += t.duration;
  }

  const totalDuration = Math.round(offset);

  const manifest = {
    blockId,
    version: 1,
    generatedAt: new Date().toISOString(),
    totalDuration,
    // broadcastStartTime is filled in by the admin when scheduling this block
    broadcastStartTime: null,
    tracks: entries,
  };

  return manifest;
}

/**
 * Given a manifest and a wall-clock timestamp (ms),
 * returns the track that should currently be playing.
 * Accounts for looping.
 *
 * Useful for testing the manifest before deploying.
 */
export function findCurrentTrack(manifest, nowMs = Date.now()) {
  if (!manifest.broadcastStartTime) return null;

  const startMs = new Date(manifest.broadcastStartTime).getTime();
  const elapsedSecs = (nowMs - startMs) / 1000;
  const positionInBlock = elapsedSecs % manifest.totalDuration;

  // Find which track covers this position
  for (let i = manifest.tracks.length - 1; i >= 0; i--) {
    const track = manifest.tracks[i];
    if (track.offset <= positionInBlock) {
      return {
        track,
        positionInTrack: positionInBlock - track.offset,
        positionInBlock,
      };
    }
  }

  return null;
}
