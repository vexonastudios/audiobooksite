/**
 * scripts/setup-authors.ts
 * Creates the "authors" table and seeds it from the existing audiobooks table.
 * Run: npx ts-node -r dotenv/config --project tsconfig.json scripts/setup-authors.ts
 */
import path from 'path';
import * as dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const sql = neon(process.env.DATABASE_URL!);

// The same slug normalization WordPress used: strip non-alpha chars, lowercase
function slugify(name: string): string {
  return name
    .normalize('NFD')                     // decompose accented chars: ü -> u + combining
    .replace(/[\u0300-\u036f]/g, '')      // remove combining diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');          // strip all non-alphanum (dots, spaces, etc.)
}

async function main() {
  console.log('📋 Creating authors table (if not exists)…');

  await sql`
    CREATE TABLE IF NOT EXISTS authors (
      id          TEXT PRIMARY KEY,
      slug        TEXT NOT NULL UNIQUE,
      name        TEXT NOT NULL,
      birth_year  INTEGER,
      death_year  INTEGER,
      description TEXT,
      image_url   TEXT,
      created_at  TIMESTAMPTZ DEFAULT NOW(),
      updated_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  console.log('✅ Table ready.\n📚 Fetching distinct author names from audiobooks…');

  // Pull all unique authorName values from audiobooks
  const rows = await sql`SELECT DISTINCT author_name FROM audiobooks ORDER BY author_name ASC` as { author_name: string }[];

  console.log(`Found ${rows.length} unique authors.\n`);

  let inserted = 0;
  let skipped = 0;

  for (const row of rows) {
    const name = row.author_name?.trim();
    if (!name || name === 'admin') { skipped++; continue; }

    const slug = slugify(name);
    const id   = `author-${slug}`;

    try {
      await sql`
        INSERT INTO authors (id, slug, name)
        VALUES (${id}, ${slug}, ${name})
        ON CONFLICT (slug) DO NOTHING
      `;
      console.log(`  ✅  ${name}  →  /author/${slug}/`);
      inserted++;
    } catch (e) {
      console.error(`  ❌  ${name}:`, (e as Error).message);
      skipped++;
    }
  }

  console.log(`\n🎉 Done! Inserted: ${inserted}, Skipped: ${skipped}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
