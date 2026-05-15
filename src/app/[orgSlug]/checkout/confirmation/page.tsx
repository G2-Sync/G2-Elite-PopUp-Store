import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { getOrgContext } from '@/lib/org/context';
import { formatPrice } from '@/lib/utils';
import CartClearer from './_cart-clearer';
import type { Order, OrderItem } from '@/lib/supabase/types';

interface ConfirmationPageProps {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<{ order?: string }>;
}

type OrderWithItems = Order & { order_items: OrderItem[] };

const PROVIDER_LABELS: Record<string, string> = {
  stripe: 'Stripe',
  paypal: 'PayPal',
  square: 'Square',
};

export default async function ConfirmationPage({ params, searchParams }: ConfirmationPageProps) {
  const { orgSlug } = await params;
  const { order: orderNumber } = await searchParams;

  const org = await getOrgContext({ orgSlug });
  const admin = createAdminClient();

  if (!orderNumber) notFound();

  const { data, error } = await admin
    .from('orders')
    .select('*, order_items(*)')
    .eq('order_number', orderNumber)
    .eq('organization_id', org.id)
    .single();

  if (error || !data) notFound();

  const order = data as unknown as OrderWithItems;
  const providerLabel = order.payment_provider
    ? (PROVIDER_LABELS[order.payment_provider] ?? order.payment_provider)
    : 'Unknown';

  return (
    <>
      {/* Clear cart on the client side */}
      <CartClearer orgSlug={orgSlug} />

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12 sm:px-6 lg:px-8">
        {/* Success header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl">
            ✓
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Thank you! Order received.
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            We've received your order and will start preparing it shortly.
          </p>
        </div>

        {/* Order number */}
        <div className="mb-6 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-zinc-400">Order Number</p>
          <p className="mt-1 font-mono text-2xl font-bold tracking-widest text-zinc-900">
            {order.order_number}
          </p>
        </div>

        <div className="space-y-4">
          {/* Customer info */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-zinc-900">Customer</h2>
            <div className="text-sm text-zinc-700 space-y-0.5">
              {order.customer_name && <p className="font-medium">{order.customer_name}</p>}
              <p>{order.customer_email}</p>
            </div>
          </div>

          {/* Billing address */}
          {order.shipping_address && (
            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold text-zinc-900">Billing Address</h2>
              <div className="space-y-0.5 text-sm text-zinc-700">
                <p>{order.shipping_address.line1}</p>
                {order.shipping_address.line2 && <p>{order.shipping_address.line2}</p>}
                <p>
                  {order.shipping_address.city}, {order.shipping_address.state}{' '}
                  {order.shipping_address.postal_code}
                </p>
                <p>{order.shipping_address.country}</p>
              </div>
            </div>
          )}

          {/* Items */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-zinc-900">Items</h2>
            <ul className="space-y-2">
              {(order.order_items ?? []).map((item) => (
                <li key={item.id} className="flex justify-between text-sm">
                  <span className="text-zinc-700">
                    {item.product_name}
                    <span className="ml-1 text-zinc-400">&times;{item.quantity}</span>
                  </span>
                  <span className="font-medium text-zinc-900">
                    {formatPrice(item.unit_price_cents * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-4 space-y-2 border-t border-zinc-100 pt-4 text-sm">
              <div className="flex justify-between text-zinc-600">
                <span>Subtotal</span>
                <span>{formatPrice(order.subtotal_cents)}</span>
              </div>
              <div className="flex justify-between text-zinc-600">
                <span>Tax</span>
                <span>{formatPrice(order.tax_cents)}</span>
              </div>
              <div className="flex justify-between font-semibold text-zinc-900">
                <span>Total</span>
                <span>{formatPrice(order.total_cents)}</span>
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-zinc-900">Payment</h2>
            <div className="text-sm text-zinc-700 space-y-1">
              <p>
                {providerLabel}
                {order.payment_id?.startsWith('test_') ? (
                  <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                    Test Mode
                  </span>
                ) : (
                  <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                    Live
                  </span>
                )}
              </p>
              {order.payment_id && (
                <p className="font-mono text-xs text-zinc-400 break-all">{order.payment_id}</p>
              )}
            </div>
          </div>

          {/* Email note — we don't actually send confirmation emails yet. */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
            Order details for{' '}
            <span className="font-medium text-zinc-900">{order.customer_email}</span>. Please save
            your order number — automatic email confirmations aren&rsquo;t set up yet.
          </div>

          {/* Continue shopping */}
          <div className="pt-2 text-center">
            <Link
              href={`/${orgSlug}/shop`}
              className="inline-block rounded-lg px-6 py-3 text-sm font-semibold shadow-sm transition-opacity hover:opacity-80"
              style={{
                backgroundColor: 'var(--org-accent)',
                color: 'var(--org-primary)',
              }}
            >
              Continue Shopping &rarr;
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
