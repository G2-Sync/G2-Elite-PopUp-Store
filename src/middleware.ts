import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * Middleware — runs on every request that matches the config matcher.
 *
 * Responsibilities:
 *   1. Refresh the Supabase auth session and propagate cookies back to the
 *      client. Without this, sessions die between requests on production.
 *      (Local dev sometimes works because cookies stay in memory longer.)
 *   2. For per-org routes (/[orgSlug]/...), extract the slug into the
 *      `x-org-slug` header so downstream server components can read it
 *      without re-parsing the URL.
 *
 * Excluded paths (set in config.matcher below): static assets, Next.js
 * internals, and the favicon. Everything else flows through here so auth
 * cookies stay fresh.
 */
export async function middleware(request: NextRequest) {
  // Start with a response that forwards request headers
  let response = NextResponse.next({
    request: { headers: new Headers(request.headers) },
  });

  // -------------------------------------------------------------------------
  // Session refresh
  // -------------------------------------------------------------------------
  // Create a Supabase server client wired to read cookies from the request
  // and write any refreshed cookies to the response.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Update the request (so downstream getUser() sees fresh values)
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          // Rebuild the response so the new cookies are written to it
          response = NextResponse.next({
            request: { headers: new Headers(request.headers) },
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Touching getUser() triggers a refresh if the access token is close to
  // expiring. Result is discarded — we just want the side effect (cookie set).
  await supabase.auth.getUser();

  // -------------------------------------------------------------------------
  // Org slug forwarding (for /[orgSlug]/... paths only)
  // -------------------------------------------------------------------------
  const { pathname } = request.nextUrl;
  const segments = pathname.split('/').filter(Boolean);
  const orgSlug = segments[0] ?? '';

  // Skip slug forwarding for reserved top-level paths
  const RESERVED = new Set([
    'super-admin',
    'login',
    'signup',
    'logout',
    'auth',
    'api',
    '_next',
    'favicon.ico',
  ]);

  if (orgSlug && !RESERVED.has(orgSlug)) {
    // Add the slug as a header on the request so the response includes it
    const headers = new Headers(request.headers);
    headers.set('x-org-slug', orgSlug);
    response.headers.set('x-org-slug', orgSlug);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match every path EXCEPT:
     *   - /_next/static (build artifacts)
     *   - /_next/image (Next.js image optimization)
     *   - /favicon.ico
     *   - Anything with a file extension (.png, .jpg, .css, .js, etc.)
     *
     * This intentionally INCLUDES /super-admin, /login, /api so session
     * refresh runs everywhere. Without it, auth dies on production.
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\..*).*)',
  ],
};
