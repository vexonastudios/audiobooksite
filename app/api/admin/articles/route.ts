import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { requireAdmin } from '@/lib/admin-auth';

const sql = neon(process.env.DATABASE_URL!);

// GET /api/admin/articles — list all
export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const rows = await sql`
    SELECT id, slug, title, author_name, pub_date, published,
           categories, cover_image, excerpt
    FROM articles
    ORDER BY pub_date DESC
  `;
  return NextResponse.json(rows);
}

// POST /api/admin/articles — create new article
export async function POST(req: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const {
    id, slug, title, excerpt = '', content = '', pub_date,
    author_name = 'admin', cover_image = '',
    categories = [], topics = [], published = true,
  } = body;

  if (!slug || !title) {
    return NextResponse.json({ error: 'slug and title are required' }, { status: 400 });
  }

  const finalId = id || String(Date.now());

  const [row] = await sql`
    INSERT INTO articles (
      id, slug, title, excerpt, content, pub_date,
      author_name, cover_image, categories, topics, published
    ) VALUES (
      ${finalId}, ${slug}, ${title}, ${excerpt}, ${content},
      ${pub_date ?? new Date().toISOString()},
      ${author_name}, ${cover_image}, ${categories}, ${topics}, ${published}
    )
    RETURNING *
  `;

  return NextResponse.json(row, { status: 201 });
}
