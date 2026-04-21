import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env'), override: false });

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  console.log('--- Raw count ---');
  const count = await sql`SELECT COUNT(*) as total FROM user_quotes`;
  console.log(count[0]);

  console.log('\n--- Sample rows ---');
  const rows = await sql`SELECT id, text, book_id, user_id, created_at FROM user_quotes LIMIT 5`;
  rows.forEach((r: any) => console.log({ id: r.id, text: r.text?.slice(0, 60), book_id: r.book_id }));

  console.log('\n--- Group by test ---');
  const grouped = await sql`
    SELECT
      MIN(id) AS id, text, book_id,
      MAX(book_title) AS book_title,
      COUNT(*) AS saves_count,
      MAX(created_at) AS created_at
    FROM user_quotes
    GROUP BY text, book_id
    ORDER BY MAX(created_at) DESC
    LIMIT 5
  `;
  grouped.forEach((r: any) => console.log({ id: r.id, text: r.text?.slice(0, 60), saves: r.saves_count }));
}

main().catch(console.error);
