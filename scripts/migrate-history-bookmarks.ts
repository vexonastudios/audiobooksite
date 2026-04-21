/**
 * migrate-history-bookmarks.ts
 * Adds user_history and user_bookmarks tables.
 * Run: $env:DATABASE_URL="..."; npx tsx scripts/migrate-history-bookmarks.ts
 */
import { neon } from '@neondatabase/serverless';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env'), override: false });

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  console.log('📐 Creating user_history table…');
  await sql`
    CREATE TABLE IF NOT EXISTS user_history (
      user_id        TEXT NOT NULL,
      book_id        TEXT NOT NULL,
      position_secs  REAL NOT NULL DEFAULT 0,
      last_listened  TIMESTAMPTZ DEFAULT now(),
      PRIMARY KEY (user_id, book_id)
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_uh_user ON user_history(user_id, last_listened DESC)`;
  console.log('✅ user_history ready');

  console.log('📐 Creating user_bookmarks table…');
  await sql`
    CREATE TABLE IF NOT EXISTS user_bookmarks (
      id                 TEXT NOT NULL,
      user_id            TEXT NOT NULL,
      book_id            TEXT NOT NULL,
      time_secs          REAL NOT NULL DEFAULT 0,
      note               TEXT DEFAULT '',
      chapter_title      TEXT DEFAULT '',
      transcript_context TEXT DEFAULT '',
      book_title         TEXT DEFAULT '',
      book_slug          TEXT DEFAULT '',
      book_cover         TEXT DEFAULT '',
      book_author        TEXT DEFAULT '',
      created_at         TIMESTAMPTZ DEFAULT now(),
      PRIMARY KEY (user_id, id)
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_ubm_user ON user_bookmarks(user_id, created_at DESC)`;
  console.log('✅ user_bookmarks ready');

  console.log('\n🚀 Migration complete.');
}

main().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
