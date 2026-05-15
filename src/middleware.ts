import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * Middleware — runs on every request that matches the config matcher.
 *
 * Sole responsibility: refresh the Supabase auth session on every request
 * and propagate any updated cookies back to the client. Without this, the
 * Supabase access token expires (~1 hour) and the user gets bounced to
 * /login on the next page load.
 *
 * Pattern: https://supabase.com/docs/guides/auth/server-side/nextjs
 */

/**
 * Optional cookie domain override. See server.ts for the explanation —
 * keep these two values in sync.
 */
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN;

export async function middleware(request: NextRequest) {
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
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            const finalOptions = COOKIE_DOMAIN
              ? { ...options, domain: COOKIE_DOMAIN }
              : options;
            supabaseResponse.cookies.set(name, value, finalOptions);
          });
        },
      },
    }
  );

  // IMPORTANT: do not write any code between createServerClient and getUser.
  // A simple mistake could cause issues with users randomly being logged out.
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
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\..*).*)',
  ],
};
