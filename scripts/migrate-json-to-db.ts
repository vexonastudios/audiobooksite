/**
 * migrate-json-to-db.ts
 * Run once to seed Neon Postgres from the existing static JSON files.
 * Usage: npx tsx scripts/migrate-json-to-db.ts
 */

import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  const audiobooksPath = path.resolve(__dirname, '../public/data/audiobooks.json');
  const books = JSON.parse(fs.readFileSync(audiobooksPath, 'utf-8'));

  console.log(`📚 Migrating ${books.length} audiobooks…`);

  let ok = 0;
  let failed = 0;

  for (const b of books) {
    try {
      await sql`
        INSERT INTO audiobooks (
          id, slug, title, excerpt, description, pub_date, author_name,
          cover_image, thumbnail_url, mp3_url, mp3_url_low, total_duration,
          length_str, duration_secs, original_year, youtube_link, spotify_link,
          buy_link, generated_colors, plays, published, categories, topics
        ) VALUES (
          ${b.id}, ${b.slug}, ${b.title}, ${b.excerpt ?? ''},
          ${b.description ?? ''}, ${b.pubDate ?? new Date().toISOString()},
          ${b.authorName}, ${b.coverImage ?? ''}, ${b.thumbnailUrl ?? ''},
          ${b.mp3Url ?? ''}, ${b.mp3UrlLow ?? ''}, ${b.totalDuration ?? ''},
          ${b.length ?? ''}, 0,
          ${b.originalYear ? Number(b.originalYear) : null},
          ${b.youtubeLink ?? null}, ${b.spotifyLink ?? null}, ${b.buyLink ?? null},
          ${b.generatedColors ?? null}, ${b.plays ?? 0}, true,
          ${b.categories ?? []}, ${b.topics ?? []}
        )
        ON CONFLICT (id) DO NOTHING
      `;

      if (Array.isArray(b.chapters)) {
        for (let i = 0; i < b.chapters.length; i++) {
          const ch = b.chapters[i];
          await sql`
            INSERT INTO chapters (audiobook_id, title, start_time, duration, sort_order)
            VALUES (${b.id}, ${ch.title}, ${ch.startTime}, ${ch.duration ?? null}, ${i})
            ON CONFLICT DO NOTHING
          `;
        }
      }

      ok++;
      process.stdout.write(`\r  ✅ ${ok}/${books.length}`);
    } catch (err) {
      failed++;
      console.error(`\n  ❌ Failed: ${b.slug} — ${err}`);
    }
  }

  console.log(`\n\nDone! ${ok} imported, ${failed} failed.`);
}

main().catch(console.error);
