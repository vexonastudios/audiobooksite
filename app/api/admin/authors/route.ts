import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getAllAuthors, createAuthor } from '@/lib/db/authors';

export async function GET() {
  try {
    requireAdmin();
    const authors = await getAllAuthors();
    return NextResponse.json(authors);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    requireAdmin();
    const body = await req.json();
    const id = await createAuthor(body);
    return NextResponse.json({ id }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
