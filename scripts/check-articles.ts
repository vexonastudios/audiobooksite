import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function run() {
  const sql = neon(process.env.DATABASE_URL!);
  const data = await sql`SELECT slug, audio_url, length_str, source_audiobook_slug FROM articles`;
  console.log(JSON.stringify(data, null, 2));
}

run();
