import { NextRequest, NextResponse } from 'next/server';
import { getAudiobookById } from '@/lib/db/audiobooks';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const bookId = searchParams.get('bookId');
  const quality = searchParams.get('quality') || '64k'; // default to 64k for smaller downloads

  if (!bookId) {
    return new NextResponse('Missing bookId', { status: 400 });
  }

  try {
    const book = await getAudiobookById(bookId);
    if (!book) {
      return new NextResponse('Book not found', { status: 404 });
    }

    const mp3Url = quality === '128k' ? book.mp3Url : (book.mp3UrlLow || book.mp3Url);

    if (!mp3Url) {
      return new NextResponse('Audio file not available', { status: 404 });
    }

    // Fetch the file from the R2 public URL
    const response = await fetch(mp3Url);

    if (!response.ok) {
      return new NextResponse(`Failed to fetch audio file: ${response.statusText}`, { status: 502 });
    }

    // Determine the filename for the download
    const filename = `${book.slug}-${quality}.mp3`;

    // Stream the response with appropriate headers to force a download
    return new NextResponse(response.body, {
      headers: {
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Type': 'audio/mpeg',
        'Content-Length': response.headers.get('Content-Length') || '',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });

  } catch (error) {
    console.error('Download error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
