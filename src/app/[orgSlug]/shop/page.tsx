import { createClient } from '@/lib/supabase/server';
import { getOrgContext } from '@/lib/org/context';
import { formatPrice } from '@/lib/utils';
import type { Product, ProductImage } from '@/lib/supabase/types';

interface ShopPageProps {
  params: Promise<{ orgSlug: string }>;
}

type ProductWithImages = Product & { product_images: ProductImage[] };

/**
 * Org shop page — /[orgSlug]/shop
 *
 * Fetches active products for the org and renders a responsive product grid.
 * Product detail pages (Phase 2) will be at /[orgSlug]/shop/[productSlug].
 */
export default async function ShopPage({ params }: ShopPageProps) {
  const { orgSlug } = await params;
  const org = await getOrgContext({ orgSlug });

  const supabase = await createClient();
  const { data: products } = await supabase
    .from('products')
    .select('*, product_images(*)')
    .eq('organization_id', org.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  const items = (products ?? []) as ProductWithImages[];

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-2xl font-bold tracking-tight text-zinc-900">
        Shop
      </h1>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-zinc-500">
            No products available yet. Check back soon!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((product) => {
            const primaryImage = product.product_images.find((img) => img.is_primary)
              ?? product.product_images[0];
            const isSoldOut = product.stock === 0;

            return (
              <div
                key={product.id}
                className="group relative flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                {/* Product image */}
                <div className="aspect-square w-full overflow-hidden bg-zinc-100">
                  {primaryImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={primaryImage.url}
                      alt={product.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-zinc-400">
                      <span className="text-xs uppercase tracking-widest">No image</span>
                    </div>
                  )}
                </div>

                {/* Product info */}
                <div className="flex flex-1 flex-col gap-1 p-4">
                  <h2 className="text-sm font-semibold text-zinc-900">
                    {product.name}
                  </h2>

                  <div className="mt-auto flex items-center justify-between pt-3">
                    <span className="text-sm font-medium text-zinc-700">
                      {formatPrice(product.price_cents)}
                    </span>

                    {isSoldOut && (
                      <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-500">
                        Sold Out
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
