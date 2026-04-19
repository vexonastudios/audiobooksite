import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isAdminRoute = createRouteMatcher(['/admin(.*)', '/api/admin(.*)']);
const isPublicRoute = createRouteMatcher([
  '/',
  '/audiobook(.*)',
  '/articles(.*)',
  '/authors(.*)',
  '/categories(.*)',
  '/topics(.*)',
  '/search(.*)',
  '/bookmarks(.*)',
  '/history(.*)',
  '/quotes(.*)',
  '/api/library(.*)',
  '/api/image-proxy(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  if (isAdminRoute(req)) {
    const { sessionClaims } = await auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;
    if (role !== 'admin') {
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
