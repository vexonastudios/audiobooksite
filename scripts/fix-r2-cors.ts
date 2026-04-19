/**
 * Sets CORS rules on the R2 bucket and cleans up Vercel env vars
 * Run: npx tsx scripts/fix-r2-cors.ts
 */
import { S3Client, PutBucketCorsCommand } from '@aws-sdk/client-s3';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Use env vars instead of hardcoded raw values to prevent security leaks
const ACCOUNT_ID    = process.env.R2_ACCOUNT_ID;
const ACCESS_KEY    = process.env.R2_ACCESS_KEY_ID!;
const SECRET_KEY    = process.env.R2_SECRET_ACCESS_KEY!;
const BUCKET        = process.env.R2_BUCKET_NAME;
const ENDPOINT      = process.env.R2_ENDPOINT;

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
