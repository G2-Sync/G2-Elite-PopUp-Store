import { getOrgContext } from '@/lib/org/context';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatPrice } from '@/lib/utils';

interface ReportsPageProps {
  params: Promise<{ orgSlug: string }>;
}

type OrderStatusKey =
  | 'pending'
  | 'paid'
  | 'shipped'
  | 'fulfilled'
  | 'cancelled'
  | 'refunded';

const STATUSES: { key: OrderStatusKey; label: string }[] = [
  { key: 'pending', label: 'Pending' },
  { key: 'paid', label: 'Paid' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'fulfilled', label: 'Fulfilled' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'refunded', label: 'Refunded' },
];

type OrderItemJoinRow = {
  quantity: number;
  unit_price_cents: number;
  product_id: string | null;
  product_name: string;
  orders: { status: OrderStatusKey } | null;
  products:
    | {
        id: string;
        name: string;
        categories: { name: string } | null;
      }
    | null;
};

type ProductStats = {
  productId: string | null;
  productName: string;
  categoryName: string;
  perStatus: Record<OrderStatusKey, { orders: Set<string>; units: number }>;
  totalOrders: Set<string>;
  totalUnits: number;
  totalRevenueCents: number;
};

/**
 * Reports page — /[orgSlug]/admin/reports
 *
 * Aggregates order data per product. Each product row shows, for each order
 * status, (orders / units) where:
 *   - orders  = count of distinct orders that include this product at this status
 *   - units   = sum of quantity across all order_items for this product at this status
 *
 * Revenue is computed from paid/shipped/fulfilled statuses only (cancelled +
 * refunded are excluded) using the unit price captured at purchase time.
 */
export default async function ReportsPage({ params }: ReportsPageProps) {
  const { orgSlug } = await params;
  const org = await getOrgContext({ orgSlug });
  const admin = createAdminClient();

  // Pull all order_items for this org, joined to orders (for status + id)
  // and products (for current name + category).
  //
  // We also store `product_name` at the order_item level so historical orders
  // are correct even after a product is renamed or deleted. We use that
  // snapshot when products.id is null (product deleted).
  const { data, error } = await admin
    .from('order_items')
    .select(
      `
      quantity,
      unit_price_cents,
      product_id,
      product_name,
      orders!inner ( id, status, organization_id ),
      products ( id, name, categories ( name ) )
    `
    )
    .eq('orders.organization_id', org.id);

  if (error) {
    return (
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-10">
        <h1 className="mb-4 text-2xl font-bold text-zinc-900">Reports</h1>
        <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Failed to load report data: {error.message}
        </p>
      </main>
    );
  }

  type RawRow = {
    quantity: number;
    unit_price_cents: number;
    product_id: string | null;
    product_name: string;
    orders: { id: string; status: OrderStatusKey } | { id: string; status: OrderStatusKey }[] | null;
    products:
      | { id: string; name: string; categories: { name: string } | null | { name: string }[] }
      | { id: string; name: string; categories: { name: string } | null | { name: string }[] }[]
      | null;
  };
  const rows = (data ?? []) as unknown as RawRow[];

  // Aggregate into per-product stats
  const byProduct = new Map<string, ProductStats>();

  function emptyStats(productId: string | null, productName: string, categoryName: string): ProductStats {
    const perStatus = {} as ProductStats['perStatus'];
    for (const { key } of STATUSES) {
      perStatus[key] = { orders: new Set<string>(), units: 0 };
    }
    return {
      productId,
      productName,
      categoryName,
      perStatus,
      totalOrders: new Set<string>(),
      totalUnits: 0,
      totalRevenueCents: 0,
    };
  }

  for (const row of rows) {
    // The Supabase join can type these as either a single object or an array.
    const order = Array.isArray(row.orders) ? row.orders[0] : row.orders;
    const product = Array.isArray(row.products) ? row.products[0] : row.products;

    if (!order) continue;

    // Prefer the live product record if it still exists; otherwise fall back
    // to the snapshot in order_items.product_name. Group deleted products
    // together under a synthetic key.
    const productId = product?.id ?? row.product_id ?? null;
    const productName = product?.name ?? row.product_name ?? '(deleted product)';
    const rawCat = product?.categories;
    const cat = Array.isArray(rawCat) ? rawCat[0] : rawCat;
    const categoryName = cat?.name ?? '—';

    const key = productId ?? `name:${productName}`;

    if (!byProduct.has(key)) {
      byProduct.set(key, emptyStats(productId, productName, categoryName));
    }
    const stats = byProduct.get(key)!;

    const statusBucket = stats.perStatus[order.status];
    statusBucket.orders.add(order.id);
    statusBucket.units += row.quantity;

    stats.totalOrders.add(order.id);
    stats.totalUnits += row.quantity;

    // Only count revenue from payment-realized statuses
    if (order.status === 'paid' || order.status === 'shipped' || order.status === 'fulfilled') {
      stats.totalRevenueCents += row.quantity * row.unit_price_cents;
    }
  }

  const productStats = Array.from(byProduct.values()).sort((a, b) => {
    // Sort by total units desc, then by name
    if (b.totalUnits !== a.totalUnits) return b.totalUnits - a.totalUnits;
    return a.productName.localeCompare(b.productName);
  });

  // Totals row
  const grand = {
    perStatus: {} as Record<OrderStatusKey, { orders: number; units: number }>,
    totalOrders: new Set<string>(),
    totalUnits: 0,
    totalRevenueCents: 0,
  };
  for (const { key } of STATUSES) grand.perStatus[key] = { orders: 0, units: 0 };
  for (const stats of productStats) {
    for (const { key } of STATUSES) {
      grand.perStatus[key].orders += stats.perStatus[key].orders.size;
      grand.perStatus[key].units += stats.perStatus[key].units;
    }
    for (const id of stats.totalOrders) grand.totalOrders.add(id);
    grand.totalUnits += stats.totalUnits;
    grand.totalRevenueCents += stats.totalRevenueCents;
  }

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Reports</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Order activity by product. Each cell shows{' '}
          <span className="font-mono text-zinc-700">orders / units</span> — distinct orders
          containing this product and total units sold at that status.
        </p>
      </div>

      {productStats.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white py-16 text-center">
          <p className="text-sm text-zinc-500">
            No orders yet. Place a test order from the storefront to populate this report.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-xs uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Product</th>
                {STATUSES.map(({ key, label }) => (
                  <th key={key} className="px-4 py-3 text-right font-semibold">
                    {label}
                  </th>
                ))}
                <th className="px-4 py-3 text-right font-semibold">Total</th>
                <th className="px-4 py-3 text-right font-semibold">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {productStats.map((p) => (
                <tr key={p.productId ?? p.productName} className="border-b border-zinc-100 even:bg-zinc-50/30">
                  <td className="px-4 py-3 text-zinc-600">{p.categoryName}</td>
                  <td className="px-4 py-3 font-medium text-zinc-900">{p.productName}</td>
                  {STATUSES.map(({ key }) => {
                    const bucket = p.perStatus[key];
                    const empty = bucket.orders.size === 0 && bucket.units === 0;
                    return (
                      <td
                        key={key}
                        className={`px-4 py-3 text-right font-mono text-xs ${
                          empty ? 'text-zinc-300' : 'text-zinc-700'
                        }`}
                      >
                        {bucket.orders.size} / {bucket.units}
                      </td>
                    );
                  })}
                  <td className="px-4 py-3 text-right font-mono text-xs font-semibold text-zinc-900">
                    {p.totalOrders.size} / {p.totalUnits}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-zinc-900">
                    {formatPrice(p.totalRevenueCents)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-zinc-300 bg-zinc-50 font-semibold">
              <tr>
                <td className="px-4 py-3 text-zinc-500" colSpan={2}>
                  Total
                </td>
                {STATUSES.map(({ key }) => {
                  const b = grand.perStatus[key];
                  const empty = b.orders === 0 && b.units === 0;
                  return (
                    <td
                      key={key}
                      className={`px-4 py-3 text-right font-mono text-xs ${
                        empty ? 'text-zinc-400' : 'text-zinc-900'
                      }`}
                    >
                      {b.orders} / {b.units}
                    </td>
                  );
                })}
                <td className="px-4 py-3 text-right font-mono text-xs text-zinc-900">
                  {grand.totalOrders.size} / {grand.totalUnits}
                </td>
                <td className="px-4 py-3 text-right text-sm text-zinc-900">
                  {formatPrice(grand.totalRevenueCents)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <p className="mt-4 text-xs text-zinc-400">
        Revenue counts only orders at <strong>paid</strong>, <strong>shipped</strong>, or{' '}
        <strong>fulfilled</strong> status (excludes cancelled + refunded).
      </p>
    </main>
  );
}
