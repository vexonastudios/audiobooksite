import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getAnalyticsSummary } from '@/lib/db/analytics';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const days = parseInt(req.nextUrl.searchParams.get('days') ?? '30');
    const data = await getAnalyticsSummary(Math.min(Math.max(days, 1), 365));
    return NextResponse.json(data);
  } catch (e: any) {
    if (e?.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
