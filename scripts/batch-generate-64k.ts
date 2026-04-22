/**
 * scripts/batch-generate-64k.ts
 *
 * Runs LOCALLY on your machine.
 * Finds all audiobooks missing a 64kbps version, downloads the source MP3,
 * transcodes to 64kbps mono with your local ffmpeg, uploads to R2, and
 * saves the new URL to the database.
 *
 * Usage:
 *   npx ts-node -r tsconfig-paths/register scripts/batch-generate-64k.ts
 *
 * Flags:
 *   --limit=5          Only process the first N books (for testing)
 *   --slug=some-slug   Process only one specific book
 *   --dry-run          Print what would be done, don't transcode or upload
 */

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';
import { execSync } from 'child_process';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

// ── Config ────────────────────────────────────────────────────────────────────
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const sql = neon(process.env.DATABASE_URL!);
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL!;
const R2_BUCKET = process.env.R2_BUCKET_NAME!;

const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

// ── CLI Args ──────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const limitArg = args.find(a => a.startsWith('--limit='));
const slugArg = args.find(a => a.startsWith('--slug='));
const LIMIT = limitArg ? parseInt(limitArg.split('=')[1]) : Infinity;
const ONLY_SLUG = slugArg ? slugArg.split('=')[1] : null;

// ── Helpers ───────────────────────────────────────────────────────────────────

function log(msg: string) { console.log(msg); }
function ok(msg: string)  { console.log(`  ✅ ${msg}`); }
function err(msg: string) { console.error(`  ❌ ${msg}`); }
function info(msg: string){ console.log(`  ℹ️  ${msg}`); }

/** Download a URL to a local path, following redirects. */
function downloadFile(url: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        return downloadFile(res.headers.location, destPath).then(resolve).catch(reject);
      }
      if (!res.statusCode || res.statusCode >= 400) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode} downloading ${url}`));
      }
      const ws = fs.createWriteStream(destPath);
      res.pipe(ws);
      ws.on('finish', resolve);
      ws.on('error', reject);
      res.on('error', reject);
    }).on('error', reject);
  });
}

/** Upload a file to R2. */
async function uploadToR2(filePath: string, key: string): Promise<void> {
  const body = fs.readFileSync(filePath);
  await r2.send(new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    Body: body,
    ContentType: 'audio/mpeg',
  }));
}

/** Format bytes as human-readable size. */
function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** Format elapsed seconds as mm:ss. */
function formatTime(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}m ${s}s`;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  log('\n🎙️  Batch 64kbps Generator');
  log('═'.repeat(50));
  if (isDryRun) log('⚠️  DRY RUN — no files will be transcoded or uploaded\n');

  // 1. Validate env
  const missing = ['DATABASE_URL', 'R2_PUBLIC_URL', 'R2_BUCKET_NAME', 'R2_ENDPOINT', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY']
    .filter(k => !process.env[k]);
  if (missing.length) {
    err(`Missing environment variables: ${missing.join(', ')}`);
    err('Make sure .env.local is populated.');
    process.exit(1);
  }

  // 2. Check local ffmpeg
  try {
    const version = execSync('ffmpeg -version', { stdio: 'pipe' }).toString().split('\n')[0];
    ok(`ffmpeg found: ${version}`);
  } catch {
    err('ffmpeg not found in PATH. Install it: https://ffmpeg.org/download.html');
    process.exit(1);
  }

  // 3. Query DB for books missing 64k
  log('\n📋 Querying database...');
  let books: { id: string; slug: string; title: string; mp3_url: string }[];

  if (ONLY_SLUG) {
    books = await sql`
      SELECT id, slug, title, mp3_url
      FROM audiobooks
      WHERE slug = ${ONLY_SLUG}
        AND mp3_url IS NOT NULL AND mp3_url != ''
    ` as any;
  } else {
    books = await sql`
      SELECT id, slug, title, mp3_url
      FROM audiobooks
      WHERE (mp3_url_low IS NULL OR mp3_url_low = '')
        AND mp3_url IS NOT NULL AND mp3_url != ''
      ORDER BY title ASC
    ` as any;
  }

  if (!books.length) {
    ok('No books need 64kbps versions — all done!');
    return;
  }

  const toProcess = books.slice(0, LIMIT);
  log(`Found ${books.length} book(s) missing 64kbps. Processing ${toProcess.length}.\n`);

  // 4. Process each book
  let succeeded = 0;
  let failed = 0;
  const failures: string[] = [];
  const totalStart = Date.now();

  for (let i = 0; i < toProcess.length; i++) {
    const book = toProcess[i];
    const num = `[${i + 1}/${toProcess.length}]`;
    log(`${num} ${book.title}`);
    info(`Source: ${book.mp3_url}`);

    if (isDryRun) {
      info(`Would transcode → ${book.slug}-64.mp3`);
      succeeded++;
      log('');
      continue;
    }

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sr-batch-'));
    const inputPath = path.join(tmpDir, 'input.mp3');
    const out64Path = path.join(tmpDir, 'out-64.mp3');
    const bookStart = Date.now();

    try {
      // Download
      info('Downloading...');
      await downloadFile(book.mp3_url, inputPath);
      const sourceSize = fs.statSync(inputPath).size;
      info(`Downloaded: ${formatBytes(sourceSize)}`);

      // Transcode
      info('Transcoding to 64kbps mono...');
      execSync(
        `ffmpeg -y -i "${inputPath}" -codec:a libmp3lame -b:a 64k -ac 1 "${out64Path}"`,
        { stdio: 'pipe' }  // suppress ffmpeg's verbose output
      );
      const outSize = fs.statSync(out64Path).size;
      info(`Transcoded: ${formatBytes(outSize)} (${Math.round(outSize / sourceSize * 100)}% of source)`);

      // Upload
      const key64 = `${book.slug}-64.mp3`;
      info(`Uploading → R2: ${key64}`);
      await uploadToR2(out64Path, key64);

      const mp3UrlLow = `${R2_PUBLIC_URL}/${key64}`;

      // Update DB
      await sql`
        UPDATE audiobooks
        SET mp3_url_low = ${mp3UrlLow}
        WHERE id = ${book.id}
      `;

      const elapsed = (Date.now() - bookStart) / 1000;
      ok(`Done in ${formatTime(elapsed)} → ${mp3UrlLow}`);
      succeeded++;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      err(`Failed: ${msg}`);
      failures.push(`${book.title} (${book.slug}): ${msg}`);
      failed++;
    } finally {
      // Clean up temp files
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }

    log('');
  }

  // 5. Summary
  const totalElapsed = (Date.now() - totalStart) / 1000;
  log('═'.repeat(50));
  log(`\n🏁 Done in ${formatTime(totalElapsed)}`);
  log(`   ✅ Succeeded: ${succeeded}`);
  if (failed > 0) {
    log(`   ❌ Failed:    ${failed}`);
    log('\nFailed books:');
    failures.forEach(f => log(`  • ${f}`));
  }

  if (!isDryRun && books.length > toProcess.length) {
    log(`\n⚠️  ${books.length - toProcess.length} books still need processing.`);
    log('   Run the script again (or remove --limit) to continue.');
  }
}

main().catch(e => {
  console.error('\n💥 Fatal error:', e);
  process.exit(1);
});
