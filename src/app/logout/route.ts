import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Logout route — POST /logout (NOT GET).
 *
 * GET was a bad idea because Next.js's <Link> prefetches the target on
 * hover/viewport — which triggered an immediate auto-logout the moment
 * the user landed on any page with a "Sign out" link. Cookies got wiped
 * before the user could do anything. Switching to POST means only an
 * explicit form submission triggers sign-out.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const url = new URL('/login', request.url);
  return NextResponse.redirect(url, 303);
}
