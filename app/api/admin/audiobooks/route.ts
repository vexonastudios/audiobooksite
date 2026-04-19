import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, adminForbidden } from '@/lib/admin-auth';
import { getAllAudiobooksAdmin, createAudiobook } from '@/lib/db/audiobooks';

export async function GET() {
  try {
    await requireAdmin();
    const books = await getAllAudiobooksAdmin();
    return NextResponse.json(books);
  } catch {
    return adminForbidden();
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const data = await req.json();
    const id = await createAudiobook(data);
    return NextResponse.json({ id }, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'Forbidden') return adminForbidden();
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
