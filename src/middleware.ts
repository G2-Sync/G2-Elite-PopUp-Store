import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * Middleware — runs on every request that matches the config matcher.
 *
 * Responsibilities:
 *   1. Refresh the Supabase auth session and propagate cookies back to the
 *      client. Without this, sessions die between requests on production.
 *   2. For per-org routes (/[orgSlug]/...), pre-compute the slug into the
 *      `x-org-slug` request header so downstream server components can read
 *      it without re-parsing the URL.
 *
 * Pattern: https://supabase.com/docs/guides/auth/server-side/nextjs
 *
 * Excluded paths (set in config.matcher below): static assets, Next.js
 * internals, and the favicon. Everything else flows through here so auth
 * cookies stay fresh.
 */

const RESERVED_TOP_LEVEL_PATHS = new Set([
  'super-admin',
  'login',
  'signup',
  'logout',
  'auth',
  'api',
  '_next',
  'favicon.ico',
]);

export async function middleware(request: NextRequest) {
  // --- 1. Build a NEW request with x-org-slug header pre-set ------------
  // This way, when supabase refreshes cookies (which rebuilds the response),
  // we hand it a request that ALREADY has our custom header attached.

  const { pathname } = request.nextUrl;
  const segments = pathname.split('/').filter(Boolean);
  const firstSegment = segments[0] ?? '';
  const orgSlug =
    firstSegment && !RESERVED_TOP_LEVEL_PATHS.has(firstSegment)
      ? firstSegment
      : '';

  // Mutate the incoming request's headers (in-place) so all subsequent
  // NextResponse.next({ request }) calls preserve them.
  if (orgSlug) {
    request.headers.set('x-org-slug', orgSlug);
  }

  // --- 2. Set up session refresh ----------------------------------------
  // Canonical Supabase SSR middleware pattern.
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Update request.cookies so downstream code in this same request
          // sees the refreshed values.
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          // Rebuild the response, preserving our custom request headers.
          supabaseResponse = NextResponse.next({ request });
          // Mirror cookies onto the response so they get sent to the browser.
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Triggers refresh as a side effect. The result is intentionally ignored —
  // we only care about the cookies being updated.
  await supabase.auth.getUser();

  return supabaseResponse;
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
