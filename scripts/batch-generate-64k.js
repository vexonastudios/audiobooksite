/**
 * scripts/batch-generate-64k.js
 *
 * Runs LOCALLY on your machine with plain Node.js — no TypeScript, no tsconfig issues.
 *
 * Usage:
 *   node scripts/batch-generate-64k.js
 *   node scripts/batch-generate-64k.js --dry-run
 *   node scripts/batch-generate-64k.js --limit=5
 *   node scripts/batch-generate-64k.js --slug=some-slug
 *   node scripts/batch-generate-64k.js --dry-run --limit=3
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const https = require('https');
const http = require('http');
const { execSync } = require('child_process');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

// ── Config ────────────────────────────────────────────────────────────────────
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;
const R2_BUCKET     = process.env.R2_BUCKET_NAME;

const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId:     process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

// sql is initialized after env validation in main()
let sql;

// ── CLI Args ──────────────────────────────────────────────────────────────────
const args     = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const limitArg = args.find(a => a.startsWith('--limit='));
const slugArg  = args.find(a => a.startsWith('--slug='));
const LIMIT     = limitArg ? parseInt(limitArg.split('=')[1]) : Infinity;
const ONLY_SLUG = slugArg  ? slugArg.split('=')[1] : null;

// ── Helpers ───────────────────────────────────────────────────────────────────
const log  = msg => console.log(msg);
const ok   = msg => console.log(`  ✅ ${msg}`);
const fail = msg => console.error(`  ❌ ${msg}`);
const info = msg => console.log(`  ℹ️  ${msg}`);

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatTime(secs) {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}m ${s}s`;
}

/** Download a URL to a local file, following redirects. */
function downloadFile(url, destPath, redirectsLeft = 5) {
  return new Promise((resolve, reject) => {
    if (redirectsLeft <= 0) return reject(new Error(`Too many redirects: ${url}`));
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        return downloadFile(res.headers.location, destPath, redirectsLeft - 1).then(resolve).catch(reject);
      }
      if (res.statusCode >= 400) {
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

/** Upload a local file to R2. */
async function uploadToR2(filePath, key) {
  const body = fs.readFileSync(filePath);
  await r2.send(new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    Body: body,
    ContentType: 'audio/mpeg',
  }));
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  log('\n🎙️  Batch 64kbps Generator');
  log('═'.repeat(52));
  if (isDryRun) log('⚠️  DRY RUN — nothing will be transcoded or uploaded\n');

  // 1. Validate env
  const required = ['DATABASE_URL', 'R2_PUBLIC_URL', 'R2_BUCKET_NAME', 'R2_ENDPOINT', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY'];
  const missing  = required.filter(k => !process.env[k]);
  if (missing.length) {
    fail(`Missing env vars: ${missing.join(', ')}`);
    fail('Run this first to pull your Vercel env vars locally:');
    fail('  npx vercel env pull .env.local');
    fail('Then re-run this script.');
    process.exit(1);
  }

  // Init DB client now that env is confirmed present
  sql = neon(process.env.DATABASE_URL);

  // 2. Verify local ffmpeg
  try {
    const v = execSync('ffmpeg -version', { stdio: 'pipe' }).toString().split('\n')[0];
    ok(`ffmpeg: ${v}`);
  } catch {
    fail('ffmpeg not found in PATH.');
    fail('Install from https://ffmpeg.org/download.html and make sure it is on your PATH.');
    process.exit(1);
  }

  // 3. Query DB
  log('\n📋 Querying database...');
  let books;
  if (ONLY_SLUG) {
    books = await sql`
      SELECT id, slug, title, mp3_url
      FROM audiobooks
      WHERE slug = ${ONLY_SLUG}
        AND mp3_url IS NOT NULL AND mp3_url != ''
    `;
  } else {
    books = await sql`
      SELECT id, slug, title, mp3_url
      FROM audiobooks
      WHERE (mp3_url_low IS NULL OR mp3_url_low = '')
        AND mp3_url IS NOT NULL AND mp3_url != ''
      ORDER BY title ASC
    `;
  }

  if (!books.length) {
    ok('All books already have a 64kbps version — nothing to do!');
    return;
  }

  const toProcess = books.slice(0, LIMIT);
  log(`Found ${books.length} book(s) missing 64kbps. Will process ${toProcess.length}.\n`);

  // 4. Process each book
  let succeeded = 0;
  let failed    = 0;
  const failures = [];
  const totalStart = Date.now();

  for (let i = 0; i < toProcess.length; i++) {
    const book = toProcess[i];
    log(`[${i + 1}/${toProcess.length}] ${book.title}`);
    info(`Source: ${book.mp3_url}`);

    if (isDryRun) {
      info(`Would produce → ${R2_PUBLIC_URL}/${book.slug}-64.mp3`);
      succeeded++;
      log('');
      continue;
    }

    const tmpDir  = fs.mkdtempSync(path.join(os.tmpdir(), 'sr-batch-'));
    const input   = path.join(tmpDir, 'input.mp3');
    const out64   = path.join(tmpDir, 'out-64.mp3');
    const bookStart = Date.now();

    try {
      // Download
      info('Downloading...');
      await downloadFile(book.mp3_url, input);
      const srcSize = fs.statSync(input).size;
      info(`Downloaded ${formatBytes(srcSize)}`);

      // Transcode (ffmpeg writes to stderr by default — pipe to hide it)
      info('Transcoding → 64kbps mono...');
      execSync(
        `ffmpeg -y -i "${input}" -codec:a libmp3lame -b:a 64k -ac 1 "${out64}"`,
        { stdio: 'pipe' }
      );
      const outSize = fs.statSync(out64).size;
      info(`Encoded ${formatBytes(outSize)} (${Math.round(outSize / srcSize * 100)}% of source)`);

      // Upload to R2
      const key64 = `${book.slug}-64.mp3`;
      info(`Uploading → ${key64}`);
      await uploadToR2(out64, key64);

      const mp3UrlLow = `${R2_PUBLIC_URL}/${key64}`;

      // Update DB
      await sql`UPDATE audiobooks SET mp3_url_low = ${mp3UrlLow} WHERE id = ${book.id}`;

      const elapsed = (Date.now() - bookStart) / 1000;
      ok(`Done in ${formatTime(elapsed)}  →  ${mp3UrlLow}`);
      succeeded++;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      fail(`${msg}`);
      failures.push(`${book.title}: ${msg}`);
      failed++;
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }

    log('');
  }

  // 5. Summary
  const totalElapsed = (Date.now() - totalStart) / 1000;
  log('═'.repeat(52));
  log(`\n🏁 Finished in ${formatTime(totalElapsed)}`);
  log(`   ✅ Succeeded: ${succeeded}`);
  if (failed > 0) {
    log(`   ❌ Failed:    ${failed}`);
    log('\nFailed books:');
    failures.forEach(f => log(`  • ${f}`));
  }
  if (!isDryRun && toProcess.length < books.length) {
    log(`\n⚠️  ${books.length - toProcess.length} books still need processing. Run again to continue.`);
  }
}

main().catch(e => {
  console.error('\n💥 Fatal error:', e);
  process.exit(1);
});
