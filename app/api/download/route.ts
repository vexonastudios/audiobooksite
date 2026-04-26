import { NextRequest, NextResponse } from 'next/server';
import { getAudiobookById } from '@/lib/db/audiobooks';

/**
 * GET /api/download?bookId=...&quality=64k|128k
 *
 * Vercel cost optimization (2026-04-25):
 * BEFORE — this route streamed the entire MP3 through Vercel's serverless function,
 *   causing double-bandwidth charges (R2 → Vercel → User) and burning GB-hours.
 * AFTER — we redirect to the R2 public URL. R2 has zero egress fees, so the
 *   audio bytes never touch Vercel at all. Massive bandwidth + duration savings.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const bookId = searchParams.get('bookId');
  const quality = searchParams.get('quality') || '64k';

  if (!bookId) {
    return new NextResponse('Missing bookId', { status: 400 });
  }

  try {
    const book = await getAudiobookById(bookId);
    if (!book) {
      return new NextResponse('Book not found', { status: 404 });
    }

    const mp3Url = quality === '128k'
      ? book.mp3Url
      : (book.mp3UrlLow || book.mp3Url);

    if (!mp3Url) {
      return new NextResponse('Audio file not available for this quality', { status: 404 });
    }

    // Redirect to R2 CDN — zero bandwidth through Vercel.
    // R2 supports Range requests natively, so seeking still works.
    // The Content-Disposition header for "download" filename is handled by the
    // browser when the user right-clicks → Save As, or by the SW for offline caching.
    return NextResponse.redirect(mp3Url, 302);

  } catch (error) {
    console.error('Download error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
