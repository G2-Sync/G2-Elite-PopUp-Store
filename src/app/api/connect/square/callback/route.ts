import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';
import { isCurrentUserOrgAdmin } from '@/lib/auth/session';
import { exchangeOAuthCode } from '@/lib/payments/square';
import { encryptToken } from '@/lib/payments/encryption';

/**
 * GET /api/connect/square/callback?code=...&state=...
 *
 * Square redirects the merchant here after OAuth consent. We:
 *  1. Verify the state cookie matches (CSRF protection)
 *  2. Exchange the auth code for access + refresh tokens
 *  3. Encrypt tokens, upsert into payment_accounts
 *  4. Redirect back to the org's payments settings page
 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const code = url.searchParams.get('code');
  const stateParam = url.searchParams.get('state');
  const errorParam = url.searchParams.get('error');

  const cookieStore = await cookies();
  const stateCookie = cookieStore.get('square_oauth_state')?.value;
  const orgSlug = cookieStore.get('square_oauth_org_slug')?.value;

  // Always clear the cookies once we've read them
  cookieStore.delete('square_oauth_state');
  cookieStore.delete('square_oauth_org_slug');

  // Build redirect target — fall back to home if we don't know the slug
  const baseRedirect = orgSlug
    ? `/${orgSlug}/admin/settings/payments`
    : '/super-admin/organizations';

  if (errorParam) {
    return NextResponse.redirect(
      new URL(`${baseRedirect}?error=${encodeURIComponent(errorParam)}`, req.url)
    );
  }

  if (!code || !stateParam || !stateCookie || stateParam !== stateCookie) {
    return NextResponse.redirect(
      new URL(`${baseRedirect}?error=invalid_state`, req.url)
    );
  }

  // state encodes "{orgId}.{nonce}" — pull orgId out
  const [orgId] = stateParam.split('.');
  if (!orgId) {
    return NextResponse.redirect(
      new URL(`${baseRedirect}?error=invalid_state`, req.url)
    );
  }

  // Auth check — must still be admin of this org
  const isAdmin = await isCurrentUserOrgAdmin(orgId);
  if (!isAdmin) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Exchange code for tokens
  let tokens;
  try {
    tokens = await exchangeOAuthCode(code);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'oauth_exchange_failed';
    return NextResponse.redirect(
      new URL(`${baseRedirect}?error=${encodeURIComponent(msg)}`, req.url)
    );
  }

  // Encrypt and upsert
  const admin = createAdminClient();
  const encryptedAccess = encryptToken(tokens.access_token);
  const encryptedRefresh = encryptToken(tokens.refresh_token);

  const { error: upsertError } = await admin
    .from('payment_accounts')
    .upsert(
      {
        organization_id: orgId,
        provider: 'square',
        account_id: tokens.merchant_id,
        access_token: encryptedAccess,
        refresh_token: encryptedRefresh,
        scope: tokens.scope,
        expires_at: tokens.expires_at,
        is_active: true,
        connected_at: new Date().toISOString(),
      },
      { onConflict: 'organization_id,provider' }
    );

  if (upsertError) {
    console.error('[square/callback] upsert failed:', upsertError);
    return NextResponse.redirect(
      new URL(`${baseRedirect}?error=db_save_failed`, req.url)
    );
  }

  return NextResponse.redirect(new URL(`${baseRedirect}?connected=square`, req.url));
}
