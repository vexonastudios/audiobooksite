import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function requireAdmin() {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (role !== 'admin') {
    throw new Error('Forbidden');
  }
}

export function adminForbidden() {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
