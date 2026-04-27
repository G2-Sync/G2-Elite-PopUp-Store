import Link from 'next/link';
import { getOrgContext } from '@/lib/org/context';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSquareEnvironment } from '@/lib/payments/square';
import DisconnectButton from './_disconnect-button';

interface PaymentsSettingsPageProps {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<{ connected?: string; error?: string }>;
}

type PaymentAccountRow = {
  id: string;
  account_id: string;
  is_active: boolean;
  scope: string | null;
  expires_at: string | null;
  connected_at: string;
};

/**
 * Payment connections settings — /[orgSlug]/admin/settings/payments
 *
 * Shows the connection status for each supported payment provider.
 * Currently only Square is wired for real connections (Phase 5).
 */
export default async function PaymentsSettingsPage({
  params,
  searchParams,
}: PaymentsSettingsPageProps) {
  const { orgSlug } = await params;
  const { connected, error } = await searchParams;
  const org = await getOrgContext({ orgSlug });

  const admin = createAdminClient();
  const acctRes = await admin
    .from('payment_accounts')
    .select('id, account_id, is_active, scope, expires_at, connected_at')
    .eq('organization_id', org.id)
    .eq('provider', 'square')
    .eq('is_active', true)
    .maybeSingle();

  const square = acctRes.data as PaymentAccountRow | null;
  const env = getSquareEnvironment();

  const platformFallbackActive = !square && !!process.env.SQUARE_ACCESS_TOKEN;

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-zinc-500">
        <Link href={`/${orgSlug}/admin/settings`} className="hover:text-zinc-900">
          Settings
        </Link>
        <span>/</span>
        <span className="font-medium text-zinc-900">Payments</span>
      </nav>

      <h1 className="mb-2 text-2xl font-bold tracking-tight text-zinc-900">Payment Connections</h1>
      <p className="mb-8 text-sm text-zinc-500">
        Connect each provider so payments flow directly to your accounts. While disconnected,
        the platform&rsquo;s sandbox or mock mode is used so you can still demo the experience.
      </p>

      {/* Flash messages */}
      {connected === 'square' && (
        <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          ✓ Square connected successfully.
        </div>
      )}
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          Connection failed: {error}
        </div>
      )}

      {/* Square card */}
      <section className="mb-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="mb-1 flex items-center gap-2">
              <h2 className="text-lg font-semibold text-zinc-900">Square</h2>
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                {env === 'production' ? 'Production' : 'Sandbox'}
              </span>
              {square && (
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                  Connected
                </span>
              )}
              {!square && platformFallbackActive && (
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                  Using platform sandbox
                </span>
              )}
              {!square && !platformFallbackActive && (
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600">
                  Mock mode
                </span>
              )}
            </div>
            {square ? (
              <div className="mt-2 space-y-1 text-sm text-zinc-600">
                <p>
                  Merchant ID:{' '}
                  <span className="font-mono text-xs text-zinc-900">{square.account_id}</span>
                </p>
                <p>
                  Connected:{' '}
                  <span className="text-zinc-900">
                    {new Date(square.connected_at).toLocaleString()}
                  </span>
                </p>
                {square.expires_at && (
                  <p>
                    Token expires:{' '}
                    <span className="text-zinc-900">
                      {new Date(square.expires_at).toLocaleString()}
                    </span>
                  </p>
                )}
              </div>
            ) : (
              <p className="mt-2 text-sm text-zinc-600">
                {platformFallbackActive
                  ? 'Connect this org’s own Square merchant account so payments go directly to them. Until then, charges run through the platform’s sandbox.'
                  : 'Connect a Square merchant account so payments process for real (in sandbox).'}
              </p>
            )}
          </div>

          <div className="flex-shrink-0">
            {square ? (
              <DisconnectButton orgId={org.id} />
            ) : (
              <Link
                href={`/api/connect/square?orgId=${encodeURIComponent(org.id)}`}
                className="inline-flex items-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90"
              >
                Connect Square
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Stripe — coming soon */}
      <section className="mb-4 rounded-xl border border-zinc-200 bg-white p-6 opacity-60 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="mb-1 flex items-center gap-2">
              <h2 className="text-lg font-semibold text-zinc-900">Stripe</h2>
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600">
                Coming soon
              </span>
            </div>
            <p className="mt-2 text-sm text-zinc-600">
              Stripe Connect (Express) integration is on the roadmap. For now, Stripe checkout
              uses the mock provider.
            </p>
          </div>
          <button
            type="button"
            disabled
            className="cursor-not-allowed rounded-md bg-zinc-200 px-4 py-2 text-sm font-medium text-zinc-500"
          >
            Connect Stripe
          </button>
        </div>
      </section>

      {/* PayPal — coming soon */}
      <section className="rounded-xl border border-zinc-200 bg-white p-6 opacity-60 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="mb-1 flex items-center gap-2">
              <h2 className="text-lg font-semibold text-zinc-900">PayPal</h2>
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600">
                Coming soon
              </span>
            </div>
            <p className="mt-2 text-sm text-zinc-600">
              PayPal Partner Referrals will let each org link their own PayPal merchant account.
            </p>
          </div>
          <button
            type="button"
            disabled
            className="cursor-not-allowed rounded-md bg-zinc-200 px-4 py-2 text-sm font-medium text-zinc-500"
          >
            Connect PayPal
          </button>
        </div>
      </section>
    </main>
  );
}
