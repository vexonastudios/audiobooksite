import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function test() {
  const { sql } = await import('@/lib/db/index');
  // Check how many books have buy_link
  const result = await sql`
    SELECT COUNT(*) as total, COUNT(buy_link) as with_link 
    FROM audiobooks WHERE published = true
  `;
  console.log("Totals:", result);

  // Sample top books with buy links
  const sample = await sql`
    SELECT id, title, author_name, buy_link, plays, cover_image, slug
    FROM audiobooks
    WHERE published = true AND buy_link IS NOT NULL AND buy_link != ''
    ORDER BY plays DESC
    LIMIT 5
  `;
  console.log("Sample with buy links:", sample);
}
test().catch(console.error);
