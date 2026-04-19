import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function requireAdmin() {
  const { userId } = await auth();
  if (!userId) throw new Error('Forbidden');

  const client = await clerkClient();
  const user = await client.users.getUser(userId);

  if (user.publicMetadata?.role !== 'admin') {
    throw new Error('Forbidden');
  }
}

export function adminForbidden() {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
