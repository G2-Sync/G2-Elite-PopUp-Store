import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from './types';

/**
 * Optional cookie domain override.
 *
 * Set this in Vercel env vars to a leading-dot domain like
 * `.uabpractitionershop.com` so cookies are scoped to the apex
 * domain AND all subdomains (especially `www.`). Without it,
 * Vercel can quietly route some requests through `www.` and the
 * cookie ends up scoped only to that exact host, breaking auth
 * when the user is browsing the apex.
 *
 * Leave unset in local dev (localhost).
 */
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN;

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // Apply our domain at the client level so it gets baked into every
      // cookie Supabase asks us to write.
      cookieOptions: COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : undefined,
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              // Belt-and-suspenders: force the domain again in case
              // cookieOptions didn't propagate through every code path.
              const finalOptions = COOKIE_DOMAIN
                ? { ...options, domain: COOKIE_DOMAIN }
                : options;
              if (process.env.NODE_ENV !== 'development') {
                // Temporary diagnostic — remove once auth is confirmed.
                console.log('[supabase server setAll]', name, 'domain=', finalOptions.domain);
              }
              cookieStore.set(name, value, finalOptions);
            });
          } catch {
            // setAll called from a Server Component — cookies are read-only.
            // This is expected and safe to ignore.
          }
        },
      },
    }
  );
}
