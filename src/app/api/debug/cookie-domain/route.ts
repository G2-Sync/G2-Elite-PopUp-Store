import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Debug endpoint — TEMPORARY. Remove once auth is working.
 *
 * Returns:
 *   - Whether COOKIE_DOMAIN env var is reaching the running code
 *   - Whether server can read the user's session from cookies
 *   - Whether user is a super-admin
 *   - List of cookie names visible to the server (no values)
 *
 * Visit /api/debug/cookie-domain AFTER signing in.
 */
export async function GET() {
  const cd = process.env.COOKIE_DOMAIN;

  // What cookies does the server see?
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  const cookieNames = allCookies.map((c) => c.name);
  const sbCookieCount = cookieNames.filter((n) => n.startsWith('sb-')).length;

  // Can we resolve the user from those cookies?
  let userId: string | null = null;
  let userEmail: string | null = null;
  let userError: string | null = null;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      userError = error.message;
    } else if (data.user) {
      userId = data.user.id;
      userEmail = data.user.email ?? null;
    }
  } catch (err) {
    userError = err instanceof Error ? err.message : 'unknown error';
  }

  // Is this user a super-admin?
  let isSuperAdmin = false;
  if (userId) {
    const admin = createAdminClient();
    const { data } = await admin
      .from('super_admins')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();
    isSuperAdmin = !!data;
  }

  return NextResponse.json({
    // Env
    cookie_domain_value: cd ?? null,
    site_url: process.env.NEXT_PUBLIC_SITE_URL ?? null,
    node_env: process.env.NODE_ENV,
    // Cookies the server can see
    total_cookies: allCookies.length,
    sb_cookies_count: sbCookieCount,
    cookie_names: cookieNames,
    // Auth resolution
    user_id: userId,
    user_email: userEmail,
    is_super_admin: isSuperAdmin,
    user_error: userError,
    // Square env vars (presence + length, not values — these are secret)
    square_environment: process.env.SQUARE_ENVIRONMENT ?? null,
    square_application_id_set: !!process.env.SQUARE_APPLICATION_ID,
    square_application_id_starts_with: process.env.SQUARE_APPLICATION_ID?.slice(0, 12) ?? null,
    square_application_secret_set: !!process.env.SQUARE_APPLICATION_SECRET,
    square_access_token_set: !!process.env.SQUARE_ACCESS_TOKEN,
    square_access_token_length: process.env.SQUARE_ACCESS_TOKEN?.length ?? 0,
    square_location_id_set: !!process.env.SQUARE_LOCATION_ID,
    square_location_id_starts_with: process.env.SQUARE_LOCATION_ID?.slice(0, 3) ?? null,
    next_public_square_app_id_set: !!process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID,
  });
}
