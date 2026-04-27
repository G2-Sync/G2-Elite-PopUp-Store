import { createAdminClient } from '@/lib/supabase/admin';
import { decryptToken } from './encryption';
import { getMerchantLocations, refreshAccessToken } from './square';

/**
 * Resolves which Square account should process a given org's checkout.
 *
 * Three modes (in priority order):
 *
 *   1. `connected`        — Org has linked their own Square merchant via OAuth
 *   2. `platform_sandbox` — Platform has SQUARE_ACCESS_TOKEN + LOCATION_ID env vars
 *   3. `mock`             — Neither configured; checkout uses fake payment_id
 */

export type SquareCharge =
  | {
      mode: 'connected';
      accessToken: string;
      locationId: string;
      merchantId: string;
    }
  | {
      mode: 'platform_sandbox';
      accessToken: string;
      locationId: string;
    }
  | { mode: 'mock' };

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export async function resolveSquareForOrg(orgId: string): Promise<SquareCharge> {
  const admin = createAdminClient();

  // 1. Check for a connected, active Square account on this org
  const accountRes = await admin
    .from('payment_accounts')
    .select('id, account_id, access_token, refresh_token, expires_at, is_active')
    .eq('organization_id', orgId)
    .eq('provider', 'square')
    .eq('is_active', true)
    .maybeSingle();

  type AcctRow = {
    id: string;
    account_id: string;
    access_token: string | null;
    refresh_token: string | null;
    expires_at: string | null;
    is_active: boolean;
  };
  const acct = accountRes.data as AcctRow | null;

  if (acct?.access_token) {
    try {
      let accessToken = decryptToken(acct.access_token);
      let refreshToken = acct.refresh_token ? decryptToken(acct.refresh_token) : null;
      let expiresAt = acct.expires_at;

      // Refresh if expiring within 7 days
      if (expiresAt && refreshToken) {
        const expiresMs = new Date(expiresAt).getTime();
        if (expiresMs - Date.now() < SEVEN_DAYS_MS) {
          try {
            const refreshed = await refreshAccessToken(refreshToken);
            accessToken = refreshed.access_token;
            refreshToken = refreshed.refresh_token;
            expiresAt = refreshed.expires_at;

            // Persist refreshed tokens back to DB (best-effort, no-throw)
            const { encryptToken } = await import('./encryption');
            await admin
              .from('payment_accounts')
              .update({
                access_token: encryptToken(accessToken),
                refresh_token: encryptToken(refreshToken),
                expires_at: expiresAt,
              })
              .eq('id', acct.id);
          } catch (err) {
            // Refresh failed — fall through and try the existing token anyway
            console.error('[resolveSquareForOrg] token refresh failed:', err);
          }
        }
      }

      // Resolve a location id — use the merchant's first active location
      const locations = await getMerchantLocations(accessToken);
      const active = locations.find((l) => l.status === 'ACTIVE') ?? locations[0];
      if (active) {
        return {
          mode: 'connected',
          accessToken,
          locationId: active.id,
          merchantId: acct.account_id,
        };
      }
    } catch (err) {
      console.error('[resolveSquareForOrg] connected mode failed, falling through:', err);
    }
  }

  // 2. Platform sandbox fallback
  const platformToken = process.env.SQUARE_ACCESS_TOKEN;
  const platformLocation = process.env.SQUARE_LOCATION_ID;
  if (platformToken && platformLocation) {
    return {
      mode: 'platform_sandbox',
      accessToken: platformToken,
      locationId: platformLocation,
    };
  }

  // 3. Pure mock mode
  return { mode: 'mock' };
}
