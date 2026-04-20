import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  console.log('🔄 Migrating articles table for source_audiobook_slug…');

  await sql`
    ALTER TABLE articles
    ADD COLUMN IF NOT EXISTS source_audiobook_slug TEXT DEFAULT ''
  `;

  console.log('✅ Articles table updated with source audiobook column.');
}

main().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
