import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');

  if (!slug) {
    return NextResponse.json({ error: 'Missing slug' }, { status: 400 });
  }

  try {
    const filePath = path.join(process.cwd(), 'public', 'transcripts', `${slug}.vtt`);
    
    if (!fs.existsSync(filePath)) {
      // Return 200 with JSON to avoid browser console 404 errors for missing transcripts
      return NextResponse.json({ available: false }, { status: 200 });
    }

    const content = fs.readFileSync(filePath, 'utf8');
    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': 'text/vtt; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    return NextResponse.json({ available: false }, { status: 200 });
  }
}
