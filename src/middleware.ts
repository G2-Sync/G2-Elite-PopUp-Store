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
  // ---------------------------------------------------------------------
  // Force www → non-www redirect at the app level.
  // Backup for vercel.json — guarantees consistent domain regardless of
  // CDN routing differences between GET and POST.
  // ---------------------------------------------------------------------
  const host = request.headers.get('host') ?? '';
  if (host === 'www.uabpractitionershop.com') {
    const url = request.nextUrl.clone();
    url.host = 'uabpractitionershop.com';
    return NextResponse.redirect(url, 308);
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // Apply our cookie domain (e.g. .uabpractitionershop.com) so refresh
      // cookies are scoped to apex + all subdomains. Without this, Vercel
      // can quietly route the response through www and the cookie ends
      // up only valid on that exact host.
      cookieOptions: COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : undefined,
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
            console.log('[middleware setAll]', name, 'domain=', finalOptions.domain);
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
