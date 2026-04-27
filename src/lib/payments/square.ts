import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Square API server-side helpers.
 *
 * We use direct fetch() calls instead of the heavyweight `square` npm SDK —
 * the surface we need (OAuth, payments, locations, webhooks) is small and
 * fetch is more transparent + tree-shakeable.
 *
 * All functions are server-only. Do not import this from a client component.
 */

const SQUARE_API_VERSION = '2025-01-23';
const SCOPE = 'MERCHANT_PROFILE_READ PAYMENTS_WRITE PAYMENTS_READ';

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------

export type SquareEnvironment = 'sandbox' | 'production';

export function getSquareEnvironment(): SquareEnvironment {
  const env = process.env.SQUARE_ENVIRONMENT;
  return env === 'production' ? 'production' : 'sandbox';
}

export function getApiBaseUrl(): string {
  return getSquareEnvironment() === 'production'
    ? 'https://connect.squareup.com'
    : 'https://connect.squareupsandbox.com';
}

export function getOAuthBaseUrl(): string {
  return getSquareEnvironment() === 'production'
    ? 'https://connect.squareup.com'
    : 'https://connect.squareupsandbox.com';
}

export function getApplicationId(): string {
  const id = process.env.SQUARE_APPLICATION_ID;
  if (!id) throw new Error('SQUARE_APPLICATION_ID env var is required');
  return id;
}

export function getApplicationSecret(): string {
  const s = process.env.SQUARE_APPLICATION_SECRET;
  if (!s) throw new Error('SQUARE_APPLICATION_SECRET env var is required');
  return s;
}

export function getRedirectUri(): string {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  return `${site}/api/connect/square/callback`;
}

// ---------------------------------------------------------------------------
// OAuth
// ---------------------------------------------------------------------------

export function getOAuthAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: getApplicationId(),
    scope: SCOPE,
    state,
    session: 'false',
    redirect_uri: getRedirectUri(),
  });
  return `${getOAuthBaseUrl()}/oauth2/authorize?${params.toString()}`;
}

export interface SquareOAuthResult {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_at: string; // ISO timestamp
  merchant_id: string;
  scope: string;
}

export async function exchangeOAuthCode(code: string): Promise<SquareOAuthResult> {
  const res = await fetch(`${getOAuthBaseUrl()}/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Square-Version': SQUARE_API_VERSION,
    },
    body: JSON.stringify({
      client_id: getApplicationId(),
      client_secret: getApplicationSecret(),
      code,
      grant_type: 'authorization_code',
    }),
  });

  const json = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    const errMsg =
      typeof json.error_description === 'string'
        ? json.error_description
        : typeof json.error === 'string'
          ? json.error
          : `Square OAuth exchange failed (status ${res.status})`;
    throw new Error(errMsg);
  }

  return json as unknown as SquareOAuthResult;
}

export async function refreshAccessToken(refreshToken: string): Promise<SquareOAuthResult> {
  const res = await fetch(`${getOAuthBaseUrl()}/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Square-Version': SQUARE_API_VERSION,
    },
    body: JSON.stringify({
      client_id: getApplicationId(),
      client_secret: getApplicationSecret(),
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  const json = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    throw new Error(
      typeof json.error_description === 'string'
        ? json.error_description
        : `Square token refresh failed (status ${res.status})`
    );
  }
  return json as unknown as SquareOAuthResult;
}

export async function revokeToken(accessToken: string, merchantId: string): Promise<void> {
  await fetch(`${getOAuthBaseUrl()}/oauth2/revoke`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Square-Version': SQUARE_API_VERSION,
      Authorization: `Client ${getApplicationSecret()}`,
    },
    body: JSON.stringify({
      access_token: accessToken,
      client_id: getApplicationId(),
      merchant_id: merchantId,
    }),
  });
}

// ---------------------------------------------------------------------------
// Locations
// ---------------------------------------------------------------------------

export interface SquareLocation {
  id: string;
  name: string;
  status: string;
}

export async function getMerchantLocations(accessToken: string): Promise<SquareLocation[]> {
  const res = await fetch(`${getApiBaseUrl()}/v2/locations`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Square-Version': SQUARE_API_VERSION,
    },
  });
  const json = (await res.json()) as { locations?: SquareLocation[]; errors?: unknown };
  if (!res.ok) {
    throw new Error('Failed to fetch Square locations');
  }
  return json.locations ?? [];
}

// ---------------------------------------------------------------------------
// Payments
// ---------------------------------------------------------------------------

export interface CreatePaymentInput {
  accessToken: string;
  locationId: string;
  amountCents: number;
  sourceId: string; // Token from Web Payments SDK
  idempotencyKey: string;
  buyerEmailAddress?: string;
  note?: string;
}

export interface SquarePayment {
  id: string;
  status: string; // e.g. "COMPLETED"
  amount_money: { amount: number; currency: string };
  receipt_url?: string;
}

export async function createPayment(input: CreatePaymentInput): Promise<SquarePayment> {
  const res = await fetch(`${getApiBaseUrl()}/v2/payments`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
      'Content-Type': 'application/json',
      'Square-Version': SQUARE_API_VERSION,
    },
    body: JSON.stringify({
      idempotency_key: input.idempotencyKey,
      source_id: input.sourceId,
      amount_money: {
        amount: input.amountCents,
        currency: 'USD',
      },
      location_id: input.locationId,
      autocomplete: true,
      buyer_email_address: input.buyerEmailAddress,
      note: input.note,
    }),
  });

  const json = (await res.json()) as { payment?: SquarePayment; errors?: Array<{ detail?: string; code?: string }> };
  if (!res.ok || !json.payment) {
    const detail = json.errors?.[0]?.detail ?? 'Payment failed';
    throw new Error(detail);
  }
  return json.payment;
}

// ---------------------------------------------------------------------------
// Webhook signature verification
// ---------------------------------------------------------------------------

/**
 * Verify Square webhook signature.
 * https://developer.squareup.com/docs/webhooks/step3validate
 */
export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string,
  signatureKey: string,
  notificationUrl: string
): boolean {
  if (!signatureHeader || !signatureKey) return false;
  const stringToSign = notificationUrl + rawBody;
  const expected = createHmac('sha256', signatureKey).update(stringToSign).digest('base64');
  try {
    const a = Buffer.from(expected);
    const b = Buffer.from(signatureHeader);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
