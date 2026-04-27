import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { cookies } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';
import { isCurrentUserOrgAdmin } from '@/lib/auth/session';
import { getOAuthAuthorizeUrl } from '@/lib/payments/square';

/**
 * GET /api/connect/square?orgId=...
 *
 * Initiates Square OAuth for a given org.
 * - Verifies caller is an admin of that org (or super-admin via the helper)
 * - Generates a CSRF state token, stores it in a short-lived httpOnly cookie
 * - Redirects to Square's OAuth consent page
 */
export async function GET(req: NextRequest) {
  const orgId = req.nextUrl.searchParams.get('orgId');
  if (!orgId) {
    return new NextResponse('Missing orgId', { status: 400 });
  }

  // Auth: must be admin of this org (super-admins included)
  const isAdmin = await isCurrentUserOrgAdmin(orgId);
  if (!isAdmin) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Look up org slug for the redirect-back location
  const admin = createAdminClient();
  const orgRes = await admin
    .from('organizations')
    .select('slug')
    .eq('id', orgId)
    .maybeSingle();
  const org = orgRes.data as { slug: string } | null;
  if (!org) {
    return new NextResponse('Org not found', { status: 404 });
  }

  // CSRF state encodes orgId so the callback can find its way home
  const csrfNonce = randomBytes(16).toString('hex');
  const state = `${orgId}.${csrfNonce}`;

  const cookieStore = await cookies();
  cookieStore.set('square_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 10, // 10 minutes
  });
  cookieStore.set('square_oauth_org_slug', org.slug, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 10,
  });

  return NextResponse.redirect(getOAuthAuthorizeUrl(state));
}
