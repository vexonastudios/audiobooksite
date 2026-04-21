// src/uploader.js
// Uploads the finished MP3 and manifest JSON to Cloudflare R2.
// R2 is S3-compatible — we use the official AWS SDK v3.

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';

function getClient() {
  const accountId = process.env.R2_ACCOUNT_ID;
  if (!accountId) throw new Error('R2_ACCOUNT_ID is not set in .env');

  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    forcePathStyle: true, // Required for Cloudflare R2
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
    },
  });
}

/**
 * Uploads a local file to Cloudflare R2.
 *
 * @param {string} localPath  - Absolute path to the local file
 * @param {string} r2Key      - The key (path) inside the bucket
 * @param {string} contentType - MIME type
 * @returns {string}          - Public URL of the uploaded file (if bucket has public access)
 */
async function uploadFile(localPath, r2Key, contentType) {
  const client = getClient();
  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket) throw new Error('R2_BUCKET_NAME is not set in .env');

  // Read as Buffer — more reliable than ReadStream with Cloudflare R2.
  // R2 rejects streaming uploads that include AWS SDK v3 checksum headers.
  const fileBuffer = fs.readFileSync(localPath);
  const fileSizeBytes = fileBuffer.length;

  console.log(`   ↑ Uploading ${path.basename(localPath)} (${(fileSizeBytes / 1024 / 1024).toFixed(1)} MB) → r2://${bucket}/${r2Key}`);

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: r2Key,
    Body: fileBuffer,
    ContentType: contentType,
    ContentLength: fileSizeBytes,
    // Disable checksum — Cloudflare R2 does not support AWS SDK v3 checksum headers
    ChecksumAlgorithm: undefined,
    // Cache for 7 days — safe since block IDs are unique
    CacheControl: 'public, max-age=604800, immutable',
    Metadata: {
      'generated-by': 'scroll-radio-generator',
    },
  });

  await client.send(command);

  // Return the public URL via the custom domain
  const domain = process.env.R2_PUBLIC_DOMAIN ?? `https://${process.env.R2_BUCKET_NAME}.${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  return `${domain}/${r2Key}`;
}

/**
 * Uploads the MP3 block and its JSON manifest to R2.
 *
 * @param {string} mp3Path      - Local path to the stitched MP3
 * @param {string} manifestPath - Local path to the JSON manifest
 * @param {string} blockId      - Unique block identifier
 * @returns {{ mp3Url, manifestUrl }}
 */
export async function uploadBlock(mp3Path, manifestPath, blockId) {
  const accountId = process.env.R2_ACCOUNT_ID;
  const prefix = process.env.R2_RADIO_PREFIX ?? 'radio/';
  const mp3Key = `${prefix}${blockId}.mp3`;
  const manifestKey = `${prefix}${blockId}.manifest.json`;

  if (!accountId || accountId.includes('your_cloudflare')) {
    console.log('\n⚠️  Skipping Cloudflare R2 upload (No R2 credentials found in .env)');
    console.log('   You will need to manually upload the MP3 and JSON files to your R2 bucket.');
    
    // Return dummy URLs for the summary
    return {
      mp3Url: `https://audio.scrollreader.com/${mp3Key}`,
      manifestUrl: `https://audio.scrollreader.com/${manifestKey}`,
      mp3Key,
      manifestKey
    };
  }

  console.log('\n☁️  Uploading to Cloudflare R2...');

  const [mp3Url, manifestUrl] = await Promise.all([
    uploadFile(mp3Path, mp3Key, 'audio/mpeg'),
    uploadFile(manifestPath, manifestKey, 'application/json'),
  ]);

  console.log(`   ✅ MP3:      ${mp3Url}`);
  console.log(`   ✅ Manifest: ${manifestUrl}`);

  return { mp3Url, manifestUrl, mp3Key, manifestKey };
}
