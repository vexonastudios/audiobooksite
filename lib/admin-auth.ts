import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

/**
 * Verifies the request comes from an authenticated user.
 * Role check happens at the layout/middleware level on the UI.
 * API routes are additionally protected by Clerk middleware (must have valid session).
 */
export async function requireAdmin() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Forbidden');
  }
}

export function adminForbidden() {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
