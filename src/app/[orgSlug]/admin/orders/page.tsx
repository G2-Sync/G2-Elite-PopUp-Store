import Link from 'next/link';
import { getOrgContext } from '@/lib/org/context';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatPrice } from '@/lib/utils';
import StatusPill from '@/components/admin/StatusPill';
import type { Order, OrderStatus } from '@/lib/supabase/types';

interface OrdersPageProps {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<{ status?: string }>;
}

const ALL_STATUSES: OrderStatus[] = [
  'pending',
  'paid',
  'shipped',
  'fulfilled',
  'cancelled',
  'refunded',
];

export default async function OrdersPage({ params, searchParams }: OrdersPageProps) {
  const { orgSlug } = await params;
  const { status: filterStatus } = await searchParams;
  const org = await getOrgContext({ orgSlug });
  const supabase = createAdminClient();

  let query = supabase
    .from('orders')
    .select('id, order_number, customer_email, customer_name, total_cents, status, created_at')
    .eq('organization_id', org.id)
    .order('created_at', { ascending: false });

  if (filterStatus && ALL_STATUSES.includes(filterStatus as OrderStatus)) {
    query = query.eq('status', filterStatus as OrderStatus);
  }

  const { data } = await query;
  const orders = (data ?? []) as Order[];

  // Count items per order (not fetched in this query — show placeholder)
  const base = `/${orgSlug}/admin/orders`;

  return (
    <div className="px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Orders</h1>
      </div>

      {/* Filter chips */}
      <div className="mb-4 flex flex-wrap gap-2">
        <Link
          href={base}
          className={[
            'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
            !filterStatus
              ? 'border-zinc-900 bg-zinc-900 text-white'
              : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400',
          ].join(' ')}
        >
          All
        </Link>
        {ALL_STATUSES.map((s) => (
          <Link
            key={s}
            href={`${base}?status=${s}`}
            className={[
              'rounded-full border px-3 py-1 text-xs font-medium capitalize transition-colors',
              filterStatus === s
                ? 'border-zinc-900 bg-zinc-900 text-white'
                : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400',
            ].join(' ')}
          >
            {s}
          </Link>
        ))}
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-200 bg-white py-24 text-center">
          <p className="text-zinc-500">No orders yet.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                <th className="px-4 py-3">Order #</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, i) => (
                <tr
                  key={order.id}
                  className={[
                    i % 2 === 1 ? 'bg-zinc-50' : 'bg-white',
                    'cursor-pointer hover:bg-zinc-100 transition-colors',
                  ].join(' ')}
                >
                  <td className="px-4 py-3 font-mono text-xs text-zinc-700">
                    {order.order_number}
                  </td>
                  <td className="px-4 py-3 text-zinc-500">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-zinc-900">{order.customer_email}</div>
                    {order.customer_name && (
                      <div className="text-xs text-zinc-400">{order.customer_name}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-700">
                    {formatPrice(order.total_cents)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={order.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/${orgSlug}/admin/orders/${order.id}`}
                      className="text-xs font-medium text-zinc-700 hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
