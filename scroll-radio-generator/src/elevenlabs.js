// src/elevenlabs.js
// Generates spoken bumper announcements via ElevenLabs TTS API.
// Bumpers are the short voiced segments between chapters:
//   "You're listening to Scroll Reader Now Playing..."
//   "Coming up — Chapter 3 of The Path of Prayer by Samuel Chadwick..."

import fetch from 'node-fetch';
import fs from 'fs';

const API_BASE = 'https://api.elevenlabs.io/v1';

/** Build bumper text for different positions in the block. */
export function buildBumperText(type, opts = {}) {
  const { chapter, book, nextChapter, nextBook } = opts;

  switch (type) {
    case 'opening':
      return (
        `Welcome to Now Playing on Scroll Reader — free classic Christian audiobooks, ` +
        `curated for your listening. We begin today with "${nextChapter.title}" ` +
        `from "${nextBook.title}" by ${nextBook.authorName}.`
      );

    case 'between': {
      const justFinished =
        book.id === nextBook.id
          ? `That was "${chapter.title}" from "${book.title}".`
          : `That was "${chapter.title}" from "${book.title}" by ${book.authorName}.`;

      const comingUp =
        nextBook.id === book.id
          ? `Continuing now with "${nextChapter.title}".`
          : `Coming up next — "${nextChapter.title}" from "${nextBook.title}" ` +
            `by ${nextBook.authorName}.`;

      return `${justFinished} ${comingUp} You're listening to Now Playing on Scroll Reader.`;
    }

    case 'closing':
      return (
        `That was "${chapter.title}" from "${book.title}" by ${book.authorName}. ` +
        `Thank you for listening to Now Playing on Scroll Reader. ` +
        `Visit scrollreader.com to explore our full library of free Christian audiobooks. ` +
        `We'll be right back at the beginning. God bless you.`
      );

    default:
      return 'You are listening to Now Playing on Scroll Reader.';
  }
}

/** Call ElevenLabs TTS and save the result to outputPath. */
export async function generateBumper(text, outputPath) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID;
  const modelId = process.env.ELEVENLABS_MODEL ?? 'eleven_turbo_v2';

  if (!apiKey) throw new Error('ELEVENLABS_API_KEY is not set in .env');
  if (!voiceId) throw new Error('ELEVENLABS_VOICE_ID is not set in .env');

  const url = `${API_BASE}/text-to-speech/${voiceId}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: modelId,
      voice_settings: {
        stability: 0.55,
        similarity_boost: 0.8,
        style: 0.15,
        use_speaker_boost: true,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`ElevenLabs API error ${response.status}: ${err}`);
  }

  const buffer = await response.arrayBuffer();
  fs.writeFileSync(outputPath, Buffer.from(buffer));

  // Rough estimate: ElevenLabs produces ~150 words/min at normal speed
  const wordCount = text.split(/\s+/).length;
  const estimatedSecs = Math.ceil((wordCount / 150) * 60);

  return estimatedSecs;
}
