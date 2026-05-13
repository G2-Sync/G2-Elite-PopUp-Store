import Link from 'next/link';
import { getOrgContext } from '@/lib/org/context';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatPrice } from '@/lib/utils';
import StatusPill from '@/components/admin/StatusPill';
import type { Order } from '@/lib/supabase/types';

interface AdminPageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function AdminDashboardPage({ params }: AdminPageProps) {
  const { orgSlug } = await params;
  const org = await getOrgContext({ orgSlug });
  const supabase = createAdminClient();

  // Parallel data fetches for stats
  const [productRes, orderRes, pendingRes, revenueRes, recentRes] = await Promise.all([
    // Total products (active + inactive)
    supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', org.id),

    // Total orders
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', org.id),

    // Pending orders (status = pending or paid)
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', org.id)
      .in('status', ['pending', 'paid']),

    // Revenue: sum of total_cents for paid/shipped/fulfilled
    supabase
      .from('orders')
      .select('total_cents')
      .eq('organization_id', org.id)
      .in('status', ['paid', 'shipped', 'fulfilled']),

    // Recent 5 orders
    supabase
      .from('orders')
      .select('id, order_number, customer_email, total_cents, status, created_at')
      .eq('organization_id', org.id)
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  const totalProducts = productRes.count ?? 0;
  const totalOrders = orderRes.count ?? 0;
  const pendingOrders = pendingRes.count ?? 0;
  const totalRevenue = (revenueRes.data ?? []).reduce(
    (sum, row) => sum + (row.total_cents ?? 0),
    0
  );
  const recentOrders = (recentRes.data ?? []) as Order[];

  const stats = [
    { label: 'Total Products', value: totalProducts.toString() },
    { label: 'Total Orders', value: totalOrders.toString() },
    { label: 'Pending Orders', value: pendingOrders.toString() },
    { label: 'Total Revenue', value: formatPrice(totalRevenue) },
  ];

  return (
    <div className="px-6 py-8">
      <h1 className="mb-8 text-2xl font-bold tracking-tight text-zinc-900">
        {org.name} Dashboard
      </h1>

      {/* Stats grid */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
          >
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">
              {stat.label}
            </p>
            <p className="mt-1 text-2xl font-bold text-zinc-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="mb-8 flex flex-wrap gap-3">
        <Link
          href={`/${orgSlug}/admin/products/new`}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-80"
        >
          + Add Product
        </Link>
        <Link
          href={`/${orgSlug}/admin/orders`}
          className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50"
        >
          View Orders
        </Link>
        <Link
          href={`/${orgSlug}/admin/settings`}
          className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50"
        >
          Edit Storefront
        </Link>
      </div>

      {/* Recent orders */}
      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-200 px-5 py-4">
          <h2 className="text-sm font-semibold text-zinc-900">Recent Orders</h2>
        </div>

        {recentOrders.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-sm text-zinc-400">No orders yet.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                <th className="px-5 py-3">Order #</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Total</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order, i) => (
                <tr
                  key={order.id}
                  className={i % 2 === 1 ? 'bg-zinc-50' : 'bg-white'}
                >
                  <td className="px-5 py-3 font-mono text-xs text-zinc-700">
                    <Link
                      href={`/${orgSlug}/admin/orders/${order.id}`}
                      className="hover:underline"
                    >
                      {order.order_number}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-zinc-500">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3 text-zinc-700">{order.customer_email}</td>
                  <td className="px-5 py-3 text-zinc-700">
                    {formatPrice(order.total_cents)}
                  </td>
                  <td className="px-5 py-3">
                    <StatusPill status={order.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
