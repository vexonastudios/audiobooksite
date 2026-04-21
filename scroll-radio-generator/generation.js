// generate.js
// ─────────────────────────────────────────────────────────────────────────────
// Scroll Radio — Block Generator
// Run with:   node generate.js
// Dry run:    node generate.js --dry-run
//
// What this does:
//   1. Fetches all books + chapters from your Neon DB
//   2. Randomly selects chapters to fill ~TARGET_DURATION_SECS
//   3. For each chapter:
//      a. Generates a spoken bumper via ElevenLabs
//      b. Extracts the chapter clip from the remote MP3 via ffmpeg
//   4. Stitches everything into one block MP3
//   5. Builds a JSON manifest (track listing with timed offsets)
//   6. Uploads both to Cloudflare R2
//   7. Saves a summary to output/
// ─────────────────────────────────────────────────────────────────────────────

import dotenv from 'dotenv';
dotenv.config({ override: true });
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { fetchLibrary } from './src/db.js';
import { selectChapters } from './src/selector.js';
import { buildBumperText, generateBumper } from './src/elevenlabs.js';
import { extractChapter, probeDuration } from './src/extractor.js';
import { stitchClips } from './src/stitcher.js';
import { buildManifest } from './src/manifest.js';
import { uploadBlock } from './src/uploader.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMP_DIR = path.join(__dirname, 'temp');
const OUTPUT_DIR = path.join(__dirname, 'output');
const DRY_RUN = process.argv.includes('--dry-run');

// ── Utilities ─────────────────────────────────────────────────────────────────

function blockId() {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `radio-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
}

function cleanTemp() {
  const files = fs.readdirSync(TEMP_DIR);
  for (const f of files) {
    if (f.endsWith('.mp3') || f.endsWith('.txt')) {
      fs.unlinkSync(path.join(TEMP_DIR, f));
    }
  }
}

function formatDuration(secs) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  return h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n');
  console.log('═══════════════════════════════════════════════════════');
  console.log('  📻  Scroll Radio — Block Generator');
  if (DRY_RUN) console.log('  [DRY RUN — ElevenLabs and R2 calls skipped]');
  console.log('═══════════════════════════════════════════════════════\n');

  const id = blockId();
  const targetSecs = Number(process.env.TARGET_DURATION_SECS ?? 7200);

  // Ensure directories exist
  fs.mkdirSync(TEMP_DIR, { recursive: true });
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // ── Step 1: Fetch library from DB ──────────────────────────────────────────
  const library = await fetchLibrary();

  // ── Step 2: Select chapters ────────────────────────────────────────────────
  const BUMPER_ESTIMATE_SECS = 22; // avg bumper length for selection math
  const selected = selectChapters(library, targetSecs, BUMPER_ESTIMATE_SECS);

  // Confirm the plan
  console.log('\n📋 Block plan:');
  selected.forEach(({ book, chapter }, i) => {
    console.log(`   ${String(i + 1).padStart(2)}. [${formatDuration(chapter.duration)}] "${chapter.title}" — ${book.title}`);
  });
  console.log();

  if (DRY_RUN) {
    console.log('✅ Dry run complete — no files generated.\n');
    return;
  }

  // ── Step 3: Generate bumpers + extract chapter clips ───────────────────────
  cleanTemp(); // clear any leftover temp files

  const orderedTrackMeta = []; // for the manifest
  const clipPaths = [];        // ordered list for ffmpeg

  for (let i = 0; i < selected.length; i++) {
    const { book, chapter } = selected[i];
    const nextItem = selected[i + 1];
    const isFirst = i === 0;
    const isLast = i === selected.length - 1;

    // ─ Bumper ─
    const bumperType = isFirst ? 'opening' : isLast ? 'between' : 'between';
    const bumperText = buildBumperText(bumperType, {
      chapter,
      book,
      nextChapter: nextItem?.chapter ?? chapter,
      nextBook: nextItem?.book ?? book,
    });

    const bumperPath = path.join(TEMP_DIR, `bumper_${String(i).padStart(3, '0')}.mp3`);
    console.log(`🎙️  [${i + 1}/${selected.length}] Generating bumper via ElevenLabs...`);
    const bumperDuration = await generateBumper(bumperText, bumperPath);
    clipPaths.push(bumperPath);
    orderedTrackMeta.push({ type: 'bumper', duration: bumperDuration });

    // ─ Chapter clip ─
    const clipPath = path.join(TEMP_DIR, `chapter_${String(i).padStart(3, '0')}.mp3`);
    console.log(`✂️   [${i + 1}/${selected.length}] Extracting "${chapter.title}" (${formatDuration(chapter.duration)}) via ffmpeg...`);
    await extractChapter(book.mp3Url, chapter.startTime, chapter.duration, clipPath);

    // Probe actual duration (may differ slightly from DB metadata)
    const actualDuration = await probeDuration(clipPath) || chapter.duration;
    clipPaths.push(clipPath);
    orderedTrackMeta.push({ type: 'chapter', duration: actualDuration, book, chapter });
  }

  // Add closing bumper
  const lastItem = selected[selected.length - 1];
  const closingText = buildBumperText('closing', { chapter: lastItem.chapter, book: lastItem.book });
  const closingPath = path.join(TEMP_DIR, 'bumper_closing.mp3');
  console.log('🎙️  Generating closing bumper...');
  const closingDuration = await generateBumper(closingText, closingPath);
  clipPaths.push(closingPath);
  orderedTrackMeta.push({ type: 'bumper', duration: closingDuration });

  // ── Step 4: Stitch ─────────────────────────────────────────────────────────
  const outputMp3 = path.join(OUTPUT_DIR, `${id}.mp3`);
  await stitchClips(clipPaths, outputMp3, TEMP_DIR);

  // ── Step 5: Build manifest ─────────────────────────────────────────────────
  const manifest = buildManifest(orderedTrackMeta, id);
  const outputManifest = path.join(OUTPUT_DIR, `${id}.manifest.json`);
  fs.writeFileSync(outputManifest, JSON.stringify(manifest, null, 2), 'utf8');
  console.log(`📄 Manifest written → ${path.basename(outputManifest)}`);
  console.log(`   Total duration: ${formatDuration(manifest.totalDuration)}`);
  console.log(`   Tracks: ${manifest.tracks.length}`);

  // ── Step 6: Upload to R2 ───────────────────────────────────────────────────
  const { mp3Url, manifestUrl } = await uploadBlock(outputMp3, outputManifest, id);

  // ── Step 7: Write summary ──────────────────────────────────────────────────
  const summary = {
    blockId: id,
    generatedAt: manifest.generatedAt,
    totalDuration: manifest.totalDuration,
    chapterCount: selected.length,
    mp3Url,
    manifestUrl,
    tracks: manifest.tracks.filter(t => t.type === 'chapter').map(t => ({
      offset: t.offset,
      title: t.title,
      bookTitle: t.bookTitle,
      authorName: t.authorName,
    })),
  };

  const summaryPath = path.join(OUTPUT_DIR, `${id}.summary.json`);
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf8');

  // Cleanup temp
  cleanTemp();

  console.log('\n');
  console.log('═══════════════════════════════════════════════════════');
  console.log('  ✅  Block generated successfully!');
  console.log(`  ID:       ${id}`);
  console.log(`  Duration: ${formatDuration(manifest.totalDuration)}`);
  console.log(`  Chapters: ${selected.length}`);
  console.log(`  MP3:      ${mp3Url}`);
  console.log(`  Manifest: ${manifestUrl}`);
  console.log('═══════════════════════════════════════════════════════\n');
  console.log('Next step: Go to the ScrollReader admin → Now Playing,');
  console.log('and register this block using the URLs above.\n');
}

main().catch(err => {
  console.error('\n❌ Generation failed:', err.message);
  console.error(err.stack);
  process.exit(1);
});
