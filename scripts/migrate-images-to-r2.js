/**
 * migrate-images-to-r2.js
 *
 * Downloads every cover_image and thumbnail_url from the database that still
 * points to scrollreader.com (WordPress), uploads them to Cloudflare R2, then
 * updates the database record with the new R2 URL.
 *
 * Usage:
 *   node scripts/migrate-images-to-r2.js
 *
 * Requirements (already in project):
 *   - .env.local with DATABASE_URL, R2_ACCOUNT_ID, R2_ACCESS_KEY_ID,
 *     R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL
 */

require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');
const { S3Client, PutObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const https = require('https');
const http = require('http');
const path = require('path');
const { URL } = require('url');

// ─── Config ──────────────────────────────────────────────────────────────────

const sql = neon(process.env.DATABASE_URL);

const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT, // full URL e.g. https://<account>.r2.cloudflarestorage.com
  credentials: {
    accessKeyId:     process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET     = process.env.R2_BUCKET_NAME;
const PUBLIC_URL = (process.env.R2_PUBLIC_URL || '').replace(/\/$/, ''); // e.g. https://audio.scrollreader.com

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    proto.get(url, { timeout: 30_000 }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // Follow redirect
        return resolve(fetchBuffer(res.headers.location));
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve({ buffer: Buffer.concat(chunks), contentType: res.headers['content-type'] || 'image/jpeg' }));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function mimeToExt(mime) {
  if (mime.includes('png'))  return 'png';
  if (mime.includes('webp')) return 'webp';
  if (mime.includes('gif'))  return 'gif';
  return 'jpg';
}

/** Check if the key already exists in R2 (avoid re-uploading) */
async function existsInR2(key) {
  try {
    await r2.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function uploadToR2(key, buffer, contentType) {
  await r2.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000, immutable', // 1 year — images never change
  }));
  return `${PUBLIC_URL}/${key}`;
}

/**
 * Derive a stable R2 key from the original URL.
 * e.g. https://scrollreader.com/wp-content/uploads/2022/03/cover.jpg
 *   → covers/scrollreader/2022/03/cover.jpg
 */
function urlToKey(originalUrl, field) {
  try {
    const u = new URL(originalUrl);
    // Remove /wp-content/uploads prefix, keep subdirectories
    const relative = u.pathname.replace(/^\/wp-content\/uploads\//, '');
    const prefix = field === 'thumbnail_url' ? 'covers/thumbs' : 'covers';
    return `${prefix}/${relative}`;
  } catch {
    // Fallback: hash-based key
    const hash = Buffer.from(originalUrl).toString('base64url').slice(0, 24);
    return `covers/${hash}.jpg`;
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function migrate() {
  console.log('Fetching all published audiobooks…');
  const books = await sql`SELECT id, title, cover_image, thumbnail_url FROM audiobooks WHERE published = true`;
  console.log(`Found ${books.length} books.\n`);

  let skipped = 0, uploaded = 0, errors = 0;

  for (const book of books) {
    const fields = [
      { col: 'cover_image',    val: book.cover_image    },
      { col: 'thumbnail_url',  val: book.thumbnail_url  },
    ];

    for (const { col, val } of fields) {
      if (!val || !val.includes('scrollreader.com')) {
        // Already migrated or not a WP URL
        continue;
      }

      const key = urlToKey(val, col);

      // Check if already uploaded
      if (await existsInR2(key)) {
        const newUrl = `${PUBLIC_URL}/${key}`;
        await sql`UPDATE audiobooks SET ${sql.unsafe(col)} = ${newUrl} WHERE id = ${book.id}`;
        console.log(`  ✓ [skip-upload] ${book.title} (${col}) → already in R2`);
        skipped++;
        continue;
      }

      process.stdout.write(`  ↓ Downloading ${col} for "${book.title}"… `);
      try {
        const { buffer, contentType } = await fetchBuffer(val);
        const ext = mimeToExt(contentType);

        // Rename key to have correct extension if needed
        const finalKey = key.endsWith('.jpg') || key.endsWith('.png') || key.endsWith('.webp') || key.endsWith('.gif')
          ? key
          : `${key}.${ext}`;

        const newUrl = await uploadToR2(finalKey, buffer, contentType);
        await sql`UPDATE audiobooks SET ${sql.unsafe(col)} = ${newUrl} WHERE id = ${book.id}`;
        console.log(`✅ ${newUrl}`);
        uploaded++;
      } catch (err) {
        console.log(`❌ ${err.message}`);
        errors++;
      }
    }
  }

  console.log(`\n─── Migration Complete ───────────────────────────────────`);
  console.log(`  Uploaded: ${uploaded}`);
  console.log(`  Skipped (already in R2): ${skipped}`);
  console.log(`  Errors: ${errors}`);
  console.log(`\nNext step: re-deploy the app so the new URLs are served.`);
}

migrate().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
