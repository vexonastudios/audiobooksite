import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { sql } from '@/lib/db';
import { unsubscribeTokenFromTopic } from '@/lib/firebase/admin';

export const runtime = 'nodejs';

/**
 * POST /api/user/push-unsubscribe
 *
 * Removes all push tokens for the current user and unsubscribes them
 * from the "all-users" topic.
 */
export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch all tokens for this user before deleting them
  const rows = await sql`
    SELECT fcm_token FROM push_subscriptions WHERE user_id = ${userId}
  `;

  // Unsubscribe from FCM topic (best-effort)
  for (const row of rows) {
    try {
      await unsubscribeTokenFromTopic(row.fcm_token, 'all-users');
    } catch {
      // Token may already be invalid — not fatal
    }
  }

  // Delete from DB
  await sql`DELETE FROM push_subscriptions WHERE user_id = ${userId}`;

  return NextResponse.json({ success: true });
}
