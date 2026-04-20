import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { recordListenHeartbeat } from '@/lib/db/analytics';

export async function POST(req: NextRequest) {
  try {
    const { audiobookId, sessionId, platform = 'web', listenedSecs, position } = await req.json();
    if (!audiobookId || !sessionId || listenedSecs == null || position == null) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
    const { userId } = await auth();
    await recordListenHeartbeat(audiobookId, sessionId, platform, listenedSecs, position, userId);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
