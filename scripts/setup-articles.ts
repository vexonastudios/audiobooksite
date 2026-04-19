/**
 * setup-articles.ts
 * Creates the articles table and imports from public/data/articles.json
 * Run: npx tsx scripts/setup-articles.ts
 */

import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const sql = neon(process.env.DATABASE_URL!);

async function createSchema() {
  console.log('📐 Creating articles table…');

  await sql`
    CREATE TABLE IF NOT EXISTS articles (
      id            TEXT PRIMARY KEY,
      slug          TEXT UNIQUE NOT NULL,
      title         TEXT NOT NULL,
      excerpt       TEXT DEFAULT '',
      content       TEXT DEFAULT '',
      pub_date      TIMESTAMPTZ DEFAULT now(),
      author_name   TEXT NOT NULL DEFAULT '',
      cover_image   TEXT DEFAULT '',
      categories    TEXT[] DEFAULT '{}',
      topics        TEXT[] DEFAULT '{}',
      published     BOOLEAN DEFAULT true,
      created_at    TIMESTAMPTZ DEFAULT now(),
      updated_at    TIMESTAMPTZ DEFAULT now()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_articles_pub_date ON articles(pub_date DESC)`;

  console.log('✅ Articles table ready.\n');
}

async function importArticles() {
  const articlesPath = path.resolve(__dirname, '../public/data/articles.json');
  const articles = JSON.parse(fs.readFileSync(articlesPath, 'utf-8'));

  console.log(`📄 Importing ${articles.length} articles…`);
  let ok = 0, failed = 0;

  for (const a of articles) {
    try {
      await sql`
        INSERT INTO articles (
          id, slug, title, excerpt, content, pub_date,
          author_name, cover_image, categories, topics, published
        ) VALUES (
          ${a.id}, ${a.slug}, ${a.title},
          ${a.excerpt ?? ''},
          ${a.description ?? ''},
          ${a.pubDate ?? new Date().toISOString()},
          ${a.authorName ?? 'admin'},
          ${a.coverImage ?? ''},
          ${a.categories ?? []},
          ${a.topics ?? []},
          true
        )
        ON CONFLICT (id) DO NOTHING
      `;
      ok++;
      process.stdout.write(`\r  ${ok}/${articles.length} imported…`);
    } catch (err) {
      failed++;
      console.error(`\n  ❌ Failed: ${a.slug} — ${err}`);
    }
  }

  console.log(`\n\n✅ Done! ${ok} imported, ${failed} failed.`);
}

async function main() {
  await createSchema();
  await importArticles();
  console.log('\n🚀 Articles are ready.');
}

main().catch((err) => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
