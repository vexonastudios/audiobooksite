/**
 * migrate-articles-audio.ts
 * Adds audio_url, voice_id, duration_secs, length_str columns to articles table
 * Run: npx tsx scripts/migrate-articles-audio.ts
 */
import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  console.log('🔄 Migrating articles table for audio support…');

  await sql`
    ALTER TABLE articles
    ADD COLUMN IF NOT EXISTS audio_url    TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS voice_id     TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS duration_secs INT  DEFAULT 0,
    ADD COLUMN IF NOT EXISTS length_str   TEXT DEFAULT ''
  `;

  console.log('✅ Articles table updated with audio columns.');
}

main().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
