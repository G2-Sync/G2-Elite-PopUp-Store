import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { getOrgContext } from '@/lib/org/context';
import { formatPrice } from '@/lib/utils';
import type { Product, ProductImage, Category } from '@/lib/supabase/types';
import SortSelect from './_sort-select';

interface ShopPageProps {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<{ category?: string; sort?: string }>;
}

type ProductWithImages = Product & { product_images: ProductImage[]; categories: Category | null };

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
] as const;

type SortValue = (typeof SORT_OPTIONS)[number]['value'];

export default async function ShopPage({ params, searchParams }: ShopPageProps) {
  const { orgSlug } = await params;
  const { category: categorySlug, sort } = await searchParams;

  const org = await getOrgContext({ orgSlug });
  const supabase = await createClient();

  // Fetch categories
  const { data: categoriesData } = await supabase
    .from('categories')
    .select('id, name, slug, sort_order, created_at, organization_id')
    .eq('organization_id', org.id)
    .order('sort_order', { ascending: true });

  const categories = (categoriesData ?? []) as Category[];

  // Resolve category filter
  const activeCategory = categories.find((c) => c.slug === categorySlug) ?? null;

  // Build products query
  let query = supabase
    .from('products')
    .select('*, product_images(*), categories(*)')
    .eq('organization_id', org.id)
    .eq('is_active', true);

  if (activeCategory) {
    query = query.eq('category_id', activeCategory.id);
  }

  // Sort
  const sortVal = (sort ?? 'newest') as SortValue;
  if (sortVal === 'price_asc') {
    query = query.order('price_cents', { ascending: true });
  } else if (sortVal === 'price_desc') {
    query = query.order('price_cents', { ascending: false });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  const { data: productsData } = await query;
  const products = (productsData ?? []) as unknown as ProductWithImages[];

  const base = `/${orgSlug}/shop`;

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-zinc-900">Shop</h1>

      {/* Filter + sort bar */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        {/* Category chips */}
        <div className="flex flex-wrap gap-2">
          <Link
            href={sort ? `${base}?sort=${sort}` : base}
            className={[
              'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              !activeCategory
                ? 'border-zinc-900 bg-zinc-900 text-white'
                : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400',
            ].join(' ')}
          >
            All
          </Link>
          {categories.map((cat) => {
            const href = sort
              ? `${base}?category=${cat.slug}&sort=${sort}`
              : `${base}?category=${cat.slug}`;
            return (
              <Link
                key={cat.id}
                href={href}
                className={[
                  'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                  activeCategory?.id === cat.id
                    ? 'border-zinc-900 bg-zinc-900 text-white'
                    : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400',
                ].join(' ')}
              >
                {cat.name}
              </Link>
            );
          })}
        </div>

        {/* Sort dropdown (client component) */}
        <SortSelect value={sortVal} options={SORT_OPTIONS} />
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-zinc-500">
            {activeCategory
              ? `No products in "${activeCategory.name}" yet.`
              : 'No products available yet. Check back soon!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => {
            const primaryImage =
              product.product_images.find((img) => img.is_primary) ??
              product.product_images[0] ??
              null;
            const isSoldOut = product.stock === 0;

            return (
              <Link
                key={product.id}
                href={`/${orgSlug}/product/${product.slug}`}
                className="group flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                {/* Product image */}
                <div className="relative aspect-square w-full overflow-hidden bg-zinc-100">
                  {primaryImage ? (
                    <Image
                      src={primaryImage.url}
                      alt={product.name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-zinc-400">
                      <span className="text-xs uppercase tracking-widest">No image</span>
                    </div>
                  )}
                  {isSoldOut && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                      <span className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-semibold text-white">
                        Sold Out
                      </span>
                    </div>
                  )}
                </div>

                {/* Product info */}
                <div className="flex flex-1 flex-col gap-1 p-4">
                  {product.categories?.name && (
                    <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                      {product.categories.name}
                    </span>
                  )}
                  <h2 className="text-sm font-semibold text-zinc-900">{product.name}</h2>
                  <div className="mt-auto pt-3">
                    <span className="text-sm font-medium text-zinc-700">
                      {formatPrice(product.price_cents)}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
