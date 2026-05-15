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
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              const finalOptions = COOKIE_DOMAIN
                ? { ...options, domain: COOKIE_DOMAIN }
                : options;
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
