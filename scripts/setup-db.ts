/**
 * setup-db.ts
 * Creates the database tables AND imports all audiobooks in one command.
 * Run: npx tsx scripts/setup-db.ts
 */

import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const sql = neon(process.env.DATABASE_URL!);

async function createSchema() {
  console.log('📐 Creating tables…');

  await sql`
    CREATE TABLE IF NOT EXISTS audiobooks (
      id              TEXT PRIMARY KEY,
      slug            TEXT UNIQUE NOT NULL,
      title           TEXT NOT NULL,
      excerpt         TEXT DEFAULT '',
      description     TEXT DEFAULT '',
      pub_date        TIMESTAMPTZ DEFAULT now(),
      author_name     TEXT NOT NULL DEFAULT '',
      cover_image     TEXT DEFAULT '',
      thumbnail_url   TEXT DEFAULT '',
      mp3_url         TEXT DEFAULT '',
      mp3_url_low     TEXT DEFAULT '',
      total_duration  TEXT DEFAULT '',
      length_str      TEXT DEFAULT '',
      duration_secs   INT DEFAULT 0,
      original_year   INT,
      youtube_link    TEXT,
      spotify_link    TEXT,
      buy_link        TEXT,
      generated_colors TEXT,
      plays           INT DEFAULT 0,
      published       BOOLEAN DEFAULT true,
      categories      TEXT[] DEFAULT '{}',
      topics          TEXT[] DEFAULT '{}',
      created_at      TIMESTAMPTZ DEFAULT now(),
      updated_at      TIMESTAMPTZ DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS chapters (
      id              SERIAL PRIMARY KEY,
      audiobook_id    TEXT REFERENCES audiobooks(id) ON DELETE CASCADE,
      title           TEXT NOT NULL DEFAULT '',
      start_time      INT NOT NULL DEFAULT 0,
      duration        INT,
      sort_order      INT DEFAULT 0
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_chapters_audiobook ON chapters(audiobook_id)`;

  console.log('✅ Tables ready.\n');
}

async function importBooks() {
  const audiobooksPath = path.resolve(__dirname, '../public/data/audiobooks.json');
  const books = JSON.parse(fs.readFileSync(audiobooksPath, 'utf-8'));

  console.log(`📚 Importing ${books.length} audiobooks…`);
  let ok = 0, failed = 0;

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
          `;
        }
      }

      ok++;
      process.stdout.write(`\r  ${ok}/${books.length} imported…`);
    } catch (err) {
      failed++;
      console.error(`\n  ❌ Failed: ${b.slug} — ${err}`);
    }
  }

  console.log(`\n\n✅ Done! ${ok} imported, ${failed} failed.`);
}

async function main() {
  await createSchema();
  await importBooks();
  console.log('\n🚀 Database is ready. You can now deploy.');
}

main().catch((err) => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
