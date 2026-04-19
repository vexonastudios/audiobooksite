/**
 * Sets CORS rules on the R2 bucket and cleans up Vercel env vars
 * Run: npx tsx scripts/fix-r2-cors.ts
 */
import { S3Client, PutBucketCorsCommand } from '@aws-sdk/client-s3';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Use the raw values — no env var corruption locally
const ACCOUNT_ID    = '7f888ea20d137eb5eba42db45b492cba';
const ACCESS_KEY    = 'be51efbe36931572c0ef702cd1ec057a';
const SECRET_KEY    = '1a50708e657b06ad3b2ae807fa4680c35627f9199d225c8b9f1aa0e53aca4752';
const BUCKET        = 'scrollreader';
const ENDPOINT      = `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`;

async function setCors() {
  const r2 = new S3Client({
    region: 'auto',
    endpoint: ENDPOINT,
    credentials: { accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_KEY },
  });

  await r2.send(new PutBucketCorsCommand({
    Bucket: BUCKET,
    CORSConfiguration: {
      CORSRules: [
        {
          AllowedOrigins: ['*'],
          AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
          AllowedHeaders: ['*'],
          ExposeHeaders: ['ETag'],
          MaxAgeSeconds: 3600,
        },
      ],
    },
  }));

  console.log('✅ R2 CORS rules set successfully.');
}

setCors().catch((err) => {
  console.error('❌ Failed:', err.message);
  process.exit(1);
});
