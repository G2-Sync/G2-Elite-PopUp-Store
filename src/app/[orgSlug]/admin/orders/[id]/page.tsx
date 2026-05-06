import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getOrgContext } from '@/lib/org/context';
import { createClient } from '@/lib/supabase/server';
import { formatPrice } from '@/lib/utils';
import StatusPill from '@/components/admin/StatusPill';
import OrderActions from './_actions-client';
import type { Order, OrderItem, OrderStatus } from '@/lib/supabase/types';

interface OrderDetailPageProps {
  params: Promise<{ orgSlug: string; id: string }>;
}

type OrderWithItems = Order & { order_items: OrderItem[] };

const NEXT_STATUS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['cancelled'],
  paid: ['shipped', 'refunded'],
  shipped: ['fulfilled', 'refunded'],
  fulfilled: [],
  cancelled: [],
  refunded: [],
};

const TRANSITION_LABELS: Partial<Record<OrderStatus, string>> = {
  shipped: 'Mark as Shipped',
  fulfilled: 'Mark as Fulfilled',
  refunded: 'Mark as Refunded',
  cancelled: 'Cancel Order',
};

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { orgSlug, id } = await params;
  const org = await getOrgContext({ orgSlug });
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', id)
    .eq('organization_id', org.id)
    .single();

  if (error || !data) notFound();

  const order = data as unknown as OrderWithItems;
  const nextStatuses = NEXT_STATUS[order.status] ?? [];

  return (
    <div className="px-6 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-zinc-500">
        <Link href={`/${orgSlug}/admin/orders`} className="hover:text-zinc-900">
          Orders
        </Link>
        <span>/</span>
        <span className="text-zinc-900 font-mono">{order.order_number}</span>
      </nav>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Order {order.order_number}
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Placed {new Date(order.created_at).toLocaleString()}
          </p>
        </div>
        <StatusPill status={order.status} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column: items + totals */}
        <div className="space-y-6 lg:col-span-2">
          {/* Line items */}
          <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
            <div className="border-b border-zinc-100 px-5 py-4">
              <h2 className="text-sm font-semibold text-zinc-900">Items</h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                  <th className="px-5 py-3">Product</th>
                  <th className="px-5 py-3">Qty</th>
                  <th className="px-5 py-3">Unit price</th>
                  <th className="px-5 py-3 text-right">Line total</th>
                </tr>
              </thead>
              <tbody>
                {(order.order_items ?? []).map((item, i) => (
                  <tr key={item.id} className={i % 2 === 1 ? 'bg-zinc-50' : 'bg-white'}>
                    <td className="px-5 py-3 font-medium text-zinc-900">{item.product_name}</td>
                    <td className="px-5 py-3 text-zinc-600">{item.quantity}</td>
                    <td className="px-5 py-3 text-zinc-600">{formatPrice(item.unit_price_cents)}</td>
                    <td className="px-5 py-3 text-right font-medium text-zinc-900">
                      {formatPrice(item.unit_price_cents * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="border-t border-zinc-100 px-5 py-4 space-y-2">
              <div className="flex justify-between text-sm text-zinc-600">
                <span>Subtotal</span>
                <span>{formatPrice(order.subtotal_cents)}</span>
              </div>
              <div className="flex justify-between text-sm text-zinc-600">
                <span>Tax</span>
                <span>{formatPrice(order.tax_cents)}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold text-zinc-900">
                <span>Total</span>
                <span>{formatPrice(order.total_cents)}</span>
              </div>
            </div>
          </div>

          {/* Status actions */}
          {nextStatuses.length > 0 && (
            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold text-zinc-900">Actions</h2>
              <OrderActions
                orgId={org.id}
                orderId={order.id}
                nextStatuses={nextStatuses}
                transitionLabels={TRANSITION_LABELS}
              />
            </div>
          )}
        </div>

        {/* Right column: customer info + payment */}
        <div className="space-y-4">
          {/* Customer */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-zinc-900">Customer</h2>
            <div className="space-y-1 text-sm text-zinc-700">
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

          {/* Payment */}
          {order.payment_provider && (
            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold text-zinc-900">Payment</h2>
              <div className="space-y-1 text-sm text-zinc-700">
                <p className="capitalize">{order.payment_provider}</p>
                {order.payment_id && (
                  <p className="font-mono text-xs text-zinc-400 break-all">{order.payment_id}</p>
                )}
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-zinc-900">Timestamps</h2>
            <div className="space-y-1 text-xs text-zinc-500">
              <div className="flex justify-between">
                <span>Created</span>
                <span>{new Date(order.created_at).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Updated</span>
                <span>{new Date(order.updated_at).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
