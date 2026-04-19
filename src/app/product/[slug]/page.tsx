import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Product } from '@/lib/supabase/types';
import { formatPrice } from '@/lib/utils';
import ProductCard from '@/components/ProductCard';

interface Props {
  params: Promise<{ slug: string }>;
}

async function getProduct(slug: string): Promise<Product | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(*), product_images(*)')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error || !data) return null;
    return data as Product;
  } catch {
    return null;
  }
}

async function getRelatedProducts(
  categoryId: string | null,
  excludeId: string
): Promise<Product[]> {
  if (!categoryId) return [];
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('products')
      .select('*, categories(*), product_images(*)')
      .eq('category_id', categoryId)
      .eq('is_active', true)
      .neq('id', excludeId)
      .limit(3);
    return (data as Product[]) ?? [];
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: 'Product Not Found' };
  return {
    title: `${product.name} — G2 Elite Pop-Up Store`,
    description: product.description ?? undefined,
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    notFound();
  }

  const related = await getRelatedProducts(product.category_id, product.id);

  const primaryImage =
    product.product_images?.find((img) => img.is_primary) ??
    product.product_images?.[0];
  const galleryImages = product.product_images ?? [];

  const isSoldOut = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-8 flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400" aria-label="Breadcrumb">
        <Link href="/shop" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
          Shop
        </Link>
        <span aria-hidden="true">/</span>
        {product.categories?.name && (
          <>
            <span>{product.categories.name}</span>
            <span aria-hidden="true">/</span>
          </>
        )}
        <span className="text-zinc-900 dark:text-zinc-100 font-medium truncate max-w-[200px]">
          {product.name}
        </span>
      </nav>

      {/* Product layout */}
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
        {/* Image Gallery */}
        <div className="flex flex-col gap-4">
          {/* Primary image */}
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800">
            {primaryImage ? (
              <Image
                src={primaryImage.url}
                alt={product.name}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-zinc-300 dark:text-zinc-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="64"
                  height="64"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-label="No product image available"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="9" cy="9" r="2" />
                  <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                </svg>
              </div>
            )}
          </div>

          {/* Thumbnail strip (only when multiple images) */}
          {galleryImages.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {galleryImages.map((img) => (
                <div
                  key={img.id}
                  className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800"
                >
                  <Image
                    src={img.url}
                    alt={`${product.name} thumbnail`}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="flex flex-col">
          {product.categories?.name && (
            <span className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              {product.categories.name}
            </span>
          )}

          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
            {product.name}
          </h1>

          <p className="mt-4 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {formatPrice(product.price_cents)}
          </p>

          {/* Stock indicator */}
          <div className="mt-3">
            {isSoldOut && (
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600 dark:text-red-400">
                <span className="h-2 w-2 rounded-full bg-red-500" aria-hidden="true" />
                Sold Out
              </span>
            )}
            {isLowStock && (
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-600 dark:text-amber-400">
                <span className="h-2 w-2 rounded-full bg-amber-500" aria-hidden="true" />
                Only {product.stock} left
              </span>
            )}
            {!isSoldOut && !isLowStock && (
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
                In Stock
              </span>
            )}
          </div>

          {product.description && (
            <p className="mt-6 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
              {product.description}
            </p>
          )}

          {/* Add to Cart */}
          <div className="mt-8">
            <button
              type="button"
              disabled={isSoldOut}
              className="w-full rounded-full bg-zinc-900 px-8 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300 dark:focus:ring-zinc-100 dark:disabled:bg-zinc-700 dark:disabled:text-zinc-400 sm:w-auto sm:min-w-[220px]"
              aria-label={isSoldOut ? 'Product is sold out' : `Add ${product.name} to cart`}
            >
              {isSoldOut ? 'Sold Out' : 'Add to Cart'}
            </button>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <section className="mt-20" aria-labelledby="related-heading">
          <h2
            id="related-heading"
            className="mb-6 text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50"
          >
            More from {product.categories?.name ?? 'the Store'}
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((rel) => {
              const img =
                rel.product_images?.find((i) => i.is_primary) ??
                rel.product_images?.[0];
              return (
                <ProductCard key={rel.id} product={rel} primaryImageUrl={img?.url} />
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
