import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin, adminForbidden } from '@/lib/admin-auth';
import { getAllAudiobooksAdmin, createAudiobook } from '@/lib/db/audiobooks';
import { sendPushToTopic } from '@/lib/firebase/admin';

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

    // Bust ISR caches so the new audiobook appears immediately
    revalidatePath('/');
    revalidatePath('/audiobooks');
    revalidatePath('/api/library');

    // Auto-push notification to all subscribed users when publishing live
    if (data.published) {
      sendPushToTopic('all-users', {
        title: `🎧 New Audiobook: ${data.title}`,
        body: `By ${data.authorName} — now streaming free on Scroll Reader`,
        link: `/audiobook/${data.slug}`,
      }).catch((err) => console.warn('[auto-push] failed:', err)); // non-fatal
    }

    return NextResponse.json({ id }, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'Forbidden') return adminForbidden();
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
