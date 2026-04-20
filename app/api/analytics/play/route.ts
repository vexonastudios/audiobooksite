import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { recordPlay } from '@/lib/db/analytics';

export async function POST(req: NextRequest) {
  try {
    const { audiobookId, sessionId, platform = 'web', startPosition = 0 } = await req.json();
    if (!audiobookId || !sessionId) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
    const { userId } = await auth();
    await recordPlay(audiobookId, sessionId, platform, startPosition, userId);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
