import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isCurrentUserOrgAdmin } from '@/lib/auth/session';
import { decryptToken } from '@/lib/payments/encryption';
import { revokeToken } from '@/lib/payments/square';

/**
 * POST /api/connect/square/disconnect
 *
 * Body: { orgId: string }
 *
 * Revokes the org's Square access token at Square + marks the local
 * payment_accounts row inactive. Idempotent.
 */
export async function POST(req: NextRequest) {
  let body: { orgId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }
  const orgId = body.orgId;
  if (!orgId) {
    return NextResponse.json({ ok: false, error: 'Missing orgId' }, { status: 400 });
  }

  const isAdmin = await isCurrentUserOrgAdmin(orgId);
  if (!isAdmin) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  const acctRes = await admin
    .from('payment_accounts')
    .select('id, account_id, access_token')
    .eq('organization_id', orgId)
    .eq('provider', 'square')
    .maybeSingle();

  type AcctRow = {
    id: string;
    account_id: string;
    access_token: string | null;
  };
  const acct = acctRes.data as AcctRow | null;

  if (!acct) {
    return NextResponse.json({ ok: true, alreadyDisconnected: true });
  }

  // Best-effort revoke at Square (don't fail the request if it errors)
  if (acct.access_token) {
    try {
      const accessToken = decryptToken(acct.access_token);
      await revokeToken(accessToken, acct.account_id);
    } catch (err) {
      console.error('[square/disconnect] revoke failed:', err);
    }
  }

  await admin
    .from('payment_accounts')
    .update({ is_active: false })
    .eq('id', acct.id);

  return NextResponse.json({ ok: true });
}
