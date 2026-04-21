/**
 * migrate-upvotes.ts
 * Creates the quote_upvotes table for tracking individual upvotes on community quotes.
 * Run: npx tsx scripts/migrate-upvotes.ts
 */
import { neon } from '@neondatabase/serverless';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env'), override: false });

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  console.log('📐 Creating quote_upvotes table…');
  await sql`
    CREATE TABLE IF NOT EXISTS quote_upvotes (
      user_id    TEXT        NOT NULL,
      quote_text TEXT        NOT NULL,
      book_id    TEXT        NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now(),
      PRIMARY KEY (user_id, quote_text, book_id)
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_qu_quote ON quote_upvotes(quote_text, book_id)`;
  console.log('✅ quote_upvotes ready');
  console.log('\n🚀 Migration complete.');
}

main().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
