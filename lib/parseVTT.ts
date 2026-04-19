/**
 * Lightweight VTT parser.
 * Converts a WebVTT string into an array of timestamped cues.
 */

export interface TranscriptCue {
  id: string;
  start: number; // seconds
  end: number;   // seconds
  text: string;
}

/** "HH:MM:SS.mmm" or "MM:SS.mmm" → seconds */
function parseTimestamp(ts: string): number {
  const parts = ts.trim().split(':').map(Number);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return parts[0] * 60 + parts[1];
}

export function parseVTT(vttText: string): TranscriptCue[] {
  const cues: TranscriptCue[] = [];
  // Normalize line endings
  const lines = vttText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

  let i = 0;
  // Skip WEBVTT header line
  while (i < lines.length && !lines[i].startsWith('WEBVTT')) i++;
  i++;

  while (i < lines.length) {
    // Skip blank lines
    if (!lines[i] || lines[i].trim() === '') { i++; continue; }

    // Optional cue identifier (e.g. "cue-1")
    let cueId = '';
    if (!lines[i].includes('-->')) {
      cueId = lines[i].trim();
      i++;
    }

    // Timing line
    if (i >= lines.length || !lines[i].includes('-->')) { i++; continue; }
    const timingLine = lines[i].trim();
    i++;

    const arrowIdx = timingLine.indexOf('-->');
    const startRaw = timingLine.slice(0, arrowIdx).trim();
    // After --> there may be positioning settings; take only the timestamp
    const endRaw = timingLine.slice(arrowIdx + 3).trim().split(' ')[0];

    const start = parseTimestamp(startRaw);
    const end = parseTimestamp(endRaw);

    // Gather text lines until blank line or EOF
    const textLines: string[] = [];
    while (i < lines.length && lines[i].trim() !== '') {
      textLines.push(lines[i]);
      i++;
    }

    const text = textLines
      .join(' ')
      .replace(/<[^>]+>/g, '') // strip inline tags like <c>, <i>
      .trim();

    if (text) {
      cues.push({ id: cueId || String(cues.length), start, end, text });
    }
  }

  return cues;
}

/** Get all cues active at a given time */
export function getActiveCues(cues: TranscriptCue[], time: number): TranscriptCue[] {
  return cues.filter(c => time >= c.start && time < c.end);
}

/** Get cues in a time window (for context extraction) */
export function getCuesInRange(cues: TranscriptCue[], from: number, to: number): TranscriptCue[] {
  return cues.filter(c => c.end >= from && c.start <= to);
}

/** Get ~20s of context around a given timestamp (for bookmarks) */
export function getContextText(cues: TranscriptCue[], time: number, secondsBefore = 5, secondsAfter = 20): string {
  return getCuesInRange(cues, time - secondsBefore, time + secondsAfter)
    .map(c => c.text)
    .join(' ')
    .trim();
}
