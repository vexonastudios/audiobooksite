import { NextResponse } from 'next/server';
import { requireAdmin, adminForbidden } from '@/lib/admin-auth';
import { sql } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  try {
    await requireAdmin();
    const result = await sql`SELECT COUNT(*)::text AS count FROM push_subscriptions`;
    const count = parseInt((result[0] as any)?.count ?? '0', 10);
    return NextResponse.json({ count });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'Forbidden') return adminForbidden();
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
