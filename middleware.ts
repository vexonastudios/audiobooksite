import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// ── Vercel cost optimization (2026-04-25) ──────────────────────────────────
// The matcher below limits middleware to ONLY auth-relevant routes.
// Public pages and public API routes no longer invoke the Edge Function,
// saving ~40-60% of middleware invocations on Vercel.
// ────────────────────────────────────────────────────────────────────────────

const isAdminRoute = createRouteMatcher(['/admin(.*)', '/api/admin(.*)']);

export default clerkMiddleware(async (auth, req) => {
  if (isAdminRoute(req)) {
    const { userId } = await auth();
    if (!userId) {
      const signIn = new URL('/sign-in', req.url);
      return NextResponse.redirect(signIn);
    }
  }
});

export const config = {
  // Only run middleware on routes that actually need auth.
  // Public pages (/, /audiobook/*, /articles/*, etc.) and public API routes
  // (/api/library, /api/analytics/*, /api/notifications, /api/quotes/*)
  // are excluded to avoid unnecessary Edge Function invocations.
  matcher: [
    '/admin(.*)',
    '/api/admin(.*)',
    '/api/user(.*)',
    '/settings(.*)',
    '/bookmarks(.*)',
    '/favorites(.*)',
    '/history(.*)',
    '/stats(.*)',
    '/downloads(.*)',
    '/donate(.*)',
    '/connect(.*)',
    '/api/contact(.*)',
  ],
};
