import { NextRequest, NextResponse } from 'next/server';
import { getAudiobookById } from '@/lib/db/audiobooks';

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

    // Forward any Range header from the client (needed for iOS audio seeking and offline caching)
    const rangeHeader = req.headers.get('range');
    const upstreamHeaders: HeadersInit = {};
    if (rangeHeader) upstreamHeaders['Range'] = rangeHeader;

    const response = await fetch(mp3Url, { headers: upstreamHeaders });

    if (!response.ok && response.status !== 206) {
      return new NextResponse(`Failed to fetch audio: ${response.statusText}`, { status: 502 });
    }

    // Build clean filename for download
    const filename = `${book.slug}-${quality}.mp3`;

    // Pass through relevant headers so progress bars and seeking work
    const responseHeaders: Record<string, string> = {
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Type': 'audio/mpeg',
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=31536000, immutable',
    };

    const contentLength = response.headers.get('Content-Length');
    if (contentLength) responseHeaders['Content-Length'] = contentLength;

    const contentRange = response.headers.get('Content-Range');
    if (contentRange) responseHeaders['Content-Range'] = contentRange;

    return new NextResponse(response.body, {
      status: response.status, // preserve 206 for range requests
      headers: responseHeaders,
    });

  } catch (error) {
    console.error('Download error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
