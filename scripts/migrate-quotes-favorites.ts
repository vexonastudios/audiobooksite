/**
 * migrate-quotes-favorites.ts
 * Creates the user_quotes and user_favorites tables.
 * Run: npx tsx scripts/migrate-quotes-favorites.ts
 */
import { neon } from '@neondatabase/serverless';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env'), override: false }); // fallback

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  console.log('📐 Creating user_quotes table…');
  await sql`
    CREATE TABLE IF NOT EXISTS user_quotes (
      id            TEXT NOT NULL,
      user_id       TEXT NOT NULL,
      text          TEXT NOT NULL,
      book_id       TEXT NOT NULL,
      book_title    TEXT NOT NULL,
      book_slug     TEXT NOT NULL,
      book_author   TEXT NOT NULL,
      book_cover    TEXT DEFAULT '',
      chapter_title TEXT DEFAULT '',
      time_secs     REAL NOT NULL DEFAULT 0,
      created_at    TIMESTAMPTZ DEFAULT now(),
      PRIMARY KEY (user_id, id)
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_uq_user ON user_quotes(user_id, created_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_uq_community ON user_quotes(created_at DESC)`;
  console.log('✅ user_quotes ready');

  console.log('📐 Creating user_favorites table…');
  await sql`
    CREATE TABLE IF NOT EXISTS user_favorites (
      id         TEXT NOT NULL,
      user_id    TEXT NOT NULL,
      type       TEXT NOT NULL,
      item_id    TEXT NOT NULL,
      item_slug  TEXT NOT NULL,
      title      TEXT NOT NULL,
      author     TEXT NOT NULL,
      cover      TEXT DEFAULT '',
      thumbnail  TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT now(),
      PRIMARY KEY (user_id, id)
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_uf_user ON user_favorites(user_id, created_at DESC)`;
  console.log('✅ user_favorites ready');

  console.log('\n🚀 Migration complete.');
}

main().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
