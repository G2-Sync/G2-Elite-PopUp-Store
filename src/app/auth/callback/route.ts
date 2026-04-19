import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Auth callback route — /auth/callback
 *
 * Supabase redirects here after email confirmation and magic-link clicks.
 * Exchanges the one-time `code` query param for a persistent session cookie,
 * then sends the user to their destination (or home).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Fallback — something went wrong; send them to login
  return NextResponse.redirect(`${origin}/login?error=auth-callback-failed`);
}
