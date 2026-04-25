import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);

async function migrate() {
  console.log('Adding meta_description and focus_keyword columns to audiobooks table...');
  
  try {
    await sql`ALTER TABLE audiobooks ADD COLUMN IF NOT EXISTS meta_description TEXT DEFAULT ''`;
    console.log('✓ meta_description column added');
  } catch (e) {
    console.log('meta_description column may already exist:', String(e));
  }
  
  try {
    await sql`ALTER TABLE audiobooks ADD COLUMN IF NOT EXISTS focus_keyword TEXT DEFAULT ''`;
    console.log('✓ focus_keyword column added');
  } catch (e) {
    console.log('focus_keyword column may already exist:', String(e));
  }

  console.log('Migration complete!');
}

migrate().catch(console.error);
