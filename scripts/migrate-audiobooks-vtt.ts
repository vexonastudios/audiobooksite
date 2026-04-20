import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  console.log('🔄 Migrating audiobooks table for vtt_url…');

  await sql`
    ALTER TABLE audiobooks
    ADD COLUMN IF NOT EXISTS vtt_url TEXT DEFAULT ''
  `;

  console.log('✅ Audiobooks table updated with vtt_url column.');
}

main().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
