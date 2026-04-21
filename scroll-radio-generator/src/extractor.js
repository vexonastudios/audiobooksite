// src/extractor.js
// Uses ffmpeg to extract a chapter audio clip from a remote MP3 URL.
// ffmpeg supports HTTP input directly — it uses HTTP range requests to seek
// without downloading the entire file.

import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

/**
 * Extracts a clip from a remote (or local) MP3 using ffmpeg.
 *
 * @param {string} inputUrl  - Full HTTPS URL to the source MP3
 * @param {number} startTime - Start offset in seconds
 * @param {number} duration  - Duration in seconds
 * @param {string} outputPath - Local path to write the extracted clip
 */
export async function extractChapter(inputUrl, startTime, duration, outputPath) {
  // We MUST standardize all audio to identical sample rate and channels (44.1kHz, mono, 64kbps)
  // otherwise the browser's HTML5 audio player glitches and stops playback when chapters switch
  // from the ElevenLabs bumper format to the audiobook's format.
  const args = [
    '-y',                          // overwrite output without asking
    '-ss', String(startTime),      // seek BEFORE input (fast/efficient)
    '-i', inputUrl,                // remote MP3 source
    '-t', String(duration),        // how long to capture
    '-c:a', 'libmp3lame',          // re-encode audio to standard format
    '-b:a', '64k',                 // 64kbps (good for voice)
    '-ar', '44100',                // 44.1kHz sample rate
    '-ac', '1',                    // Mono
    '-avoid_negative_ts', 'make_zero',
    outputPath,
  ];

  try {
    await execFileAsync('ffmpeg', args, { timeout: 120_000 });
  } catch (err) {
    // ffmpeg writes to stderr even on success; only throw if exit code is bad
    if (err.code !== 0) {
      throw new Error(`ffmpeg extraction failed for "${inputUrl}" at ${startTime}s: ${err.stderr ?? err.message}`);
    }
  }
}

/**
 * Probes an audio file and returns its duration in seconds.
 * Uses ffprobe (bundled with ffmpeg).
 */
export async function probeDuration(filePath) {
  const args = [
    '-v', 'quiet',
    '-print_format', 'json',
    '-show_format',
    filePath,
  ];

  try {
    const { stdout } = await execFileAsync('ffprobe', args, { timeout: 30_000 });
    const info = JSON.parse(stdout);
    return Number(info.format.duration ?? 0);
  } catch {
    return 0; // best effort
  }
}
