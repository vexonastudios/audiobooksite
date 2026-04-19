import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { neon } from '@neondatabase/serverless';
import sharp from 'sharp';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);
const client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const PLACEHOLDERS = [
  'male.webp',
  'scroll-author',
  'scrollreader_profile',
  'placeholder'
];

async function main() {
  const htmlPath = path.join(process.cwd(), 'authors_html.txt');
  if (!fs.existsSync(htmlPath)) throw new Error('authors_html.txt not found');
  
  const html = fs.readFileSync(htmlPath, 'utf8');
  const $ = cheerio.load(html);

  const authorsToProcess: { slug: string, src: string }[] = [];

  $('.author-box').each((_, el) => {
    const a = $(el).find('a.author-link');
    const href = a.attr('href') || '';
    const src = $(el).find('img.author-image').attr('src') || '';

    // Extracted slug from "https://scrollreader.com/author/ajgordon/" -> "ajgordon"
    const match = href.match(/\/author\/([^\/]+)/);
    if (!match || !src) return;

    const slug = match[1];

    if (PLACEHOLDERS.some(p => src.toLowerCase().includes(p))) {
      // It's a placeholder, ignore
      return;
    }

    authorsToProcess.push({ slug, src });
  });

  console.log(`Found ${authorsToProcess.length} author images to process...`);

  let count = 0;

  for (const info of authorsToProcess) {
    try {
      console.log(`Fetching ${info.slug} from ${info.src}...`);
      const resp = await fetch(info.src);
      if (!resp.ok) {
        console.error(`Failed to fetch ${info.src}: ${resp.status}`);
        continue;
      }
      const arrayBuffer = await resp.arrayBuffer();
      const inputBuf = Buffer.from(arrayBuffer);

      // We want square thumbnail format for author portraits (400x400)
      const optimizedBuf = await sharp(inputBuf)
        .resize(400, 400, { fit: 'cover', position: 'top' })
        .webp({ quality: 85 })
        .toBuffer();

      const imageKey = `authors/${info.slug}.webp`;

      await client.send(new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: imageKey,
        Body: optimizedBuf,
        ContentType: 'image/webp',
      }));

      const finalUrl = `${process.env.R2_PUBLIC_URL}/${imageKey}`;

      const [updated] = await sql`
        UPDATE authors 
        SET image_url = ${finalUrl}
        WHERE slug = ${info.slug}
        RETURNING id
      `;

      if (updated) {
        count++;
        console.log(`✅ Uploaded mapped image for [${info.slug}] at ${finalUrl}`);
      } else {
        console.log(`⚠️  Uploaded but author [${info.slug}] not in neon DB!`);
      }
    } catch (err) {
      console.error(`Error processing ${info.slug}:`, err);
    }
  }

  console.log(`\n🎉 Processed and linked ${count} author profile images!`);
}

main().catch(console.error);
