import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isAdminRoute = createRouteMatcher(['/admin(.*)', '/api/admin(.*)']);
const isPublicRoute = createRouteMatcher([
  '/',
  '/audiobook(.*)',
  '/articles(.*)',
  '/announcements(.*)',
  '/authors(.*)',
  '/categories(.*)',
  '/topics(.*)',
  '/search(.*)',
  '/bookmarks(.*)',
  '/history(.*)',
  '/quotes(.*)',
  '/api/library(.*)',
  '/api/notifications(.*)',
  '/api/image-proxy(.*)',
  '/api/analytics(.*)',  // analytics: anonymous events allowed
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/stats(.*)',          // user stats page: handled by auth() inside
]);

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
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
