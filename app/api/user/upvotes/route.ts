import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserUpvotes, toggleQuoteUpvote } from '@/lib/db/quotes';

/** GET /api/user/upvotes — returns all upvoted { quoteText, bookId } pairs for the signed-in user */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const upvotes = await getUserUpvotes(userId);
    return NextResponse.json({ upvotes });
  } catch (e) {
    console.error('[GET /api/user/upvotes]', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/** POST /api/user/upvotes — toggle an upvote (and optionally save the quote) */
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    const { quoteText, bookId } = body;
    if (!quoteText || !bookId) {
      return NextResponse.json({ error: 'Missing quoteText or bookId' }, { status: 400 });
    }
    const nowUpvoted = await toggleQuoteUpvote(userId, quoteText, bookId);
    return NextResponse.json({ ok: true, upvoted: nowUpvoted });
  } catch (e) {
    console.error('[POST /api/user/upvotes]', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
