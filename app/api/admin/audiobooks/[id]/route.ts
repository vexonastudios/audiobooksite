import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin, adminForbidden } from '@/lib/admin-auth';
import { getAudiobookById, updateAudiobook, deleteAudiobook } from '@/lib/db/audiobooks';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const book = await getAudiobookById(id);
    if (!book) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(book);
  } catch {
    return adminForbidden();
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const data = await req.json();
    await updateAudiobook(id, data);

    // Bust ISR caches so changes appear immediately
    revalidatePath('/');
    revalidatePath('/audiobooks');
    revalidatePath('/api/library');
    if (data.slug) revalidatePath(`/audiobook/${data.slug}`);

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'Forbidden') return adminForbidden();
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    await deleteAudiobook(id);

    // Bust caches after deletion
    revalidatePath('/');
    revalidatePath('/audiobooks');
    revalidatePath('/api/library');

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'Forbidden') return adminForbidden();
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

