import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, adminForbidden } from '@/lib/admin-auth';
import { sql } from '@/lib/db';
import { sendPushToTopic, type PushPayload } from '@/lib/firebase/admin';

export const runtime = 'nodejs';

/**
 * POST /api/admin/push-send
 * Body: { title: string, body: string, link?: string, imageUrl?: string }
 *
 * Sends a push notification to all subscribed users via the "all-users" FCM topic.
 * Logs the send to push_log for the admin audit trail.
 */
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();

    const payload: PushPayload & { trigger?: string } = await req.json();
    const { title, body, link, imageUrl, trigger = 'manual' } = payload;

    if (!title || !body) {
      return NextResponse.json({ error: 'title and body are required' }, { status: 400 });
    }

    // Count subscribed users
    const countResult = await sql`
      SELECT COUNT(*)::text AS count FROM push_subscriptions
    `;
    const subscriberCount = parseInt((countResult[0] as any)?.count ?? '0', 10);

    // Send via Firebase to the topic
    const messageId = await sendPushToTopic('all-users', { title, body, link, imageUrl });

    // Log to audit table
    await sql`
      INSERT INTO push_log (id, title, body, link, trigger, sent_count)
      VALUES (
        gen_random_uuid()::text,
        ${title}, ${body}, ${link ?? null}, ${trigger}, ${subscriberCount}
      )
    `;

    return NextResponse.json({ success: true, messageId, subscriberCount });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'Forbidden') return adminForbidden();
    console.error('[push-send]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

/**
 * GET /api/admin/push-send
 * Returns the push log (most recent 50 sends)
 */
export async function GET() {
  try {
    await requireAdmin();
    const rows = await sql`
      SELECT id, title, body, link, trigger, sent_count, created_at
      FROM push_log
      ORDER BY created_at DESC
      LIMIT 50
    `;
    return NextResponse.json(rows);
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'Forbidden') return adminForbidden();
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
