import * as fs from 'fs';
import * as path from 'path';
import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
const sql = neon(process.env.DATABASE_URL!);

async function updateDates() {
  const xmlData = fs.readFileSync(path.resolve(__dirname, '../scrollreader.WordPress.2026-04-19.xml'), 'utf-8');
  const items = xmlData.match(/<item>[\s\S]*?<\/item>/g) || [];
  
  const postDatesBySlug: Record<string, string> = {};
  
  for (const item of items) {
    const typeMatch = item.match(/<wp:post_type><!\[CDATA\[(.*?)\]\]><\/wp:post_type>/) || item.match(/<wp:post_type>(.*?)<\/wp:post_type>/);
    const type = typeMatch ? typeMatch[1] : '';
    
    if (type === 'post') {
      const nameMatch = item.match(/<wp:post_name><!\[CDATA\[(.*?)\]\]><\/wp:post_name>/) || item.match(/<wp:post_name>(.*?)<\/wp:post_name>/);
      const slug = nameMatch ? nameMatch[1] : '';
      
      const dateMatch = item.match(/<wp:post_date><!\[CDATA\[(.*?)\]\]><\/wp:post_date>/) || item.match(/<wp:post_date>(.*?)<\/wp:post_date>/);
      const pubDate = dateMatch ? dateMatch[1] : '';
      
      if (slug && pubDate) {
        // pubDate is usually "YYYY-MM-DD HH:MM:SS" from WP
        // We can append UTC timezone or let postgres infer local server time
        // The DB schema is TIMESTAMPTZ, so adding 'Z' makes it UTC, or let PG handle it.
        postDatesBySlug[slug] = pubDate;
      }
    }
  }

  const dbBooks = await sql`SELECT id, slug, pub_date FROM audiobooks`;
  console.log(`Found ${dbBooks.length} audiobooks in database.`);

  let updatedCount = 0;

  for (const dbBook of dbBooks) {
    const wpDate = postDatesBySlug[dbBook.slug];
    if (wpDate) {
      // In Postgres, we can just pass '2023-08-13 20:04:22' directly or '2023-08-13T20:04:22Z'
      // WP dates are local to the site settings. We'll pass the string exactly as is.
      await sql`
        UPDATE audiobooks 
        SET pub_date = ${wpDate}
        WHERE id = ${dbBook.id}
      `;
      updatedCount++;
      process.stdout.write(`\r✅ Updated ${updatedCount} dates...`);
    }
  }

  console.log(`\n✅ Finished updating ${updatedCount} audiobooks with original publish dates.`);
}

updateDates().catch(e => console.error(e));
