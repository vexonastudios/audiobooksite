import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { sql } from '@/lib/db';
import { subscribeTokenToTopic } from '@/lib/firebase/admin';

export const runtime = 'nodejs';

/**
 * POST /api/user/push-subscribe
 * Body: { token: string, platform: 'web' | 'ios' | 'android' }
 *
 * Saves the FCM token for the authenticated user and subscribes it
 * to the "all-users" topic so admin can broadcast to everyone.
 */
export async function POST(req: NextRequest) {
  const { userId } = await auth();

  const { token, platform = 'web' } = await req.json();
  if (!token) {
    return NextResponse.json({ error: 'token is required' }, { status: 400 });
  }

  // Upsert the token — update user_id if the token already exists (device switch)
  await sql`
    INSERT INTO push_subscriptions (id, user_id, fcm_token, platform, updated_at)
    VALUES (gen_random_uuid()::text, ${userId ?? null}, ${token}, ${platform}, NOW())
    ON CONFLICT (fcm_token) DO UPDATE
    SET user_id = EXCLUDED.user_id,
        platform = EXCLUDED.platform,
        updated_at = NOW()
  `;

  // Subscribe the token to the broadcast topic
  try {
    await subscribeTokenToTopic(token, 'all-users');
  } catch (err) {
    // Non-fatal — token is saved, topic subscription may retry
    console.warn('[push-subscribe] topic subscription failed:', err);
  }

  return NextResponse.json({ success: true });
}
