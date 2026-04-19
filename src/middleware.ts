import { NextResponse, type NextRequest } from 'next/server';

/**
 * Middleware for per-org routes.
 *
 * Extracts the first path segment as the org slug and forwards it as the
 * `x-org-slug` request header so downstream server components can read it
 * without re-parsing the URL.
 *
 * Org existence is NOT validated here — that happens in the [orgSlug] layout
 * via getOrgContext(). Skipping the DB query in middleware keeps cold-start
 * latency low.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Extract the first path segment (e.g. "/acme/shop" → "acme")
  const segments = pathname.split('/').filter(Boolean);
  const orgSlug = segments[0] ?? '';

  // Clone headers and attach the org slug for downstream reads
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-org-slug', orgSlug);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    /*
     * Match all paths EXCEPT:
     *   - / (root)
     *   - /super-admin and sub-paths
     *   - /login
     *   - /api routes
     *   - /_next (Next.js internals)
     *   - /favicon.ico
     *   - Static files (images, fonts, etc.)
     */
    '/((?!$|super-admin|login|api|_next/static|_next/image|favicon\\.ico|.*\\..*).*)',
  ],
};
