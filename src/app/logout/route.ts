import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Logout route — GET /logout
 *
 * Signs the user out by clearing their Supabase session cookie, then
 * redirects to /login. A GET handler is intentional — triggered by a plain
 * <Link href="/logout"> rather than a form submission.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const url = new URL('/login', request.url);
  return NextResponse.redirect(url);
}
