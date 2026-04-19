import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { requireAdmin } from '@/lib/admin-auth';

const sql = neon(process.env.DATABASE_URL!);

// GET /api/admin/articles/[id]
export async function GET(_: Request, { params }: { params: { id: string } }) {
  try { await requireAdmin(); } catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }); }

  const [row] = await sql`SELECT * FROM articles WHERE id = ${params.id}`;
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(row);
}

// PUT /api/admin/articles/[id]
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try { await requireAdmin(); } catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }); }

  const body = await req.json();
  const {
    slug, title, excerpt, content, pub_date,
    author_name, cover_image, categories, topics, published,
  } = body;

  const [row] = await sql`
    UPDATE articles SET
      slug        = COALESCE(${slug ?? null}, slug),
      title       = COALESCE(${title ?? null}, title),
      excerpt     = COALESCE(${excerpt ?? null}, excerpt),
      content     = COALESCE(${content ?? null}, content),
      pub_date    = COALESCE(${pub_date ?? null}, pub_date),
      author_name = COALESCE(${author_name ?? null}, author_name),
      cover_image = COALESCE(${cover_image ?? null}, cover_image),
      categories  = COALESCE(${categories ?? null}, categories),
      topics      = COALESCE(${topics ?? null}, topics),
      published   = COALESCE(${published ?? null}, published),
      updated_at  = now()
    WHERE id = ${params.id}
    RETURNING *
  `;

  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(row);
}

// DELETE /api/admin/articles/[id]
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try { await requireAdmin(); } catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }); }

  await sql`DELETE FROM articles WHERE id = ${params.id}`;
  return NextResponse.json({ success: true });
}
