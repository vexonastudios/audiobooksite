import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getAuthorById, updateAuthor, deleteAuthor } from '@/lib/db/authors';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireAdmin();
    const { id } = await params;
    const author = await getAuthorById(id);
    if (!author) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(author);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 401 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireAdmin();
    const { id } = await params;
    const body = await req.json();
    await updateAuthor(id, body);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireAdmin();
    const { id } = await params;
    await deleteAuthor(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
