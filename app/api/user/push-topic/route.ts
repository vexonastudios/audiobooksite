import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { subscribeTokenToTopic, unsubscribeTokenFromTopic } from '@/lib/firebase/admin';
import { sql } from '@/lib/db';

export const runtime = 'nodejs';

/**
 * POST /api/user/push-topic
 * Body: { topic: 'new-audiobooks', action: 'subscribe' | 'unsubscribe' }
 *
 * Subscribes or unsubscribes the user's FCM token(s) from a named topic.
 */
export async function POST(req: NextRequest) {
  const { topic, action } = await req.json() as {
    topic: string;
    action: 'subscribe' | 'unsubscribe';
  };

  if (!topic || !['subscribe', 'unsubscribe'].includes(action)) {
    return NextResponse.json({ error: 'Invalid params' }, { status: 400 });
  }

  const { userId } = await auth();
  let tokens: string[] = [];

  if (userId) {
    const rows = await sql`
      SELECT fcm_token FROM push_subscriptions WHERE user_id = ${userId}
    `;
    tokens = rows.map((r: any) => r.fcm_token);
  }

  if (tokens.length === 0) {
    // Guest or no tokens found — client will handle via FCM directly
    return NextResponse.json({ success: true, tokensUpdated: 0 });
  }

  let succeeded = 0;
  for (const token of tokens) {
    try {
      if (action === 'subscribe') {
        await subscribeTokenToTopic(token, topic);
      } else {
        await unsubscribeTokenFromTopic(token, topic);
      }
      succeeded++;
    } catch {
      // Non-fatal — token may be stale
    }
  }

  return NextResponse.json({ success: true, tokensUpdated: succeeded });
}
