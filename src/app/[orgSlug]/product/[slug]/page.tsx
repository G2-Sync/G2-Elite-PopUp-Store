import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getOrgContext } from '@/lib/org/context';
import { formatPrice } from '@/lib/utils';
import type { Product, ProductImage, Category } from '@/lib/supabase/types';
import AddToCartButton from './_add-to-cart-button';

interface ProductDetailPageProps {
  params: Promise<{ orgSlug: string; slug: string }>;
}

type ProductWithRelations = Product & {
  product_images: ProductImage[];
  categories: Category | null;
};

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { orgSlug, slug } = await params;
  const org = await getOrgContext({ orgSlug });
  const supabase = await createClient();

  // Fetch product
  const { data: productData, error } = await supabase
    .from('products')
    .select('*, product_images(*), categories(*)')
    .eq('organization_id', org.id)
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error || !productData) notFound();

  const product = productData as unknown as ProductWithRelations;

  // Sort images: primary first
  const images = [...(product.product_images ?? [])].sort(
    (a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0)
  );

  const primaryImage = images[0] ?? null;
  const thumbnails = images.slice(1);
  const isSoldOut = product.stock === 0;

  // Related products from same category
  let relatedProducts: ProductWithRelations[] = [];
  if (product.category_id) {
    const { data: relatedData } = await supabase
      .from('products')
      .select('*, product_images(*), categories(*)')
      .eq('organization_id', org.id)
      .eq('category_id', product.category_id)
      .eq('is_active', true)
      .neq('id', product.id)
      .limit(3);

    relatedProducts = (relatedData ?? []) as unknown as ProductWithRelations[];
  }

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-zinc-500">
        <Link href={`/${orgSlug}/shop`} className="hover:text-zinc-900">
          Shop
        </Link>
        {product.categories && (
          <>
            <span>/</span>
            <Link
              href={`/${orgSlug}/shop?category=${product.categories.slug}`}
              className="hover:text-zinc-900"
            >
              {product.categories.name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-zinc-900">{product.name}</span>
      </nav>

      {/* Product layout */}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        {/* Image gallery */}
        <div className="space-y-3">
          {/* Primary image */}
          <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-zinc-100">
            {primaryImage ? (
              <Image
                src={primaryImage.url}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-zinc-400">
                <span className="text-xs uppercase tracking-widest">No image</span>
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {thumbnails.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {thumbnails.map((img) => (
                <div
                  key={img.id}
                  className="relative aspect-square overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100"
                >
                  <Image
                    src={img.url}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="25vw"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product details */}
        <div className="flex flex-col gap-5">
          {product.categories?.name && (
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">
              {product.categories.name}
            </span>
          )}

          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">{product.name}</h1>

          <p className="text-2xl font-semibold text-zinc-900">
            {formatPrice(product.price_cents)}
          </p>

          {/* Stock indicator */}
          <div>
            {isSoldOut ? (
              <span className="inline-flex items-center rounded-full bg-zinc-100 px-3 py-1 text-sm font-medium text-zinc-500">
                Sold out
              </span>
            ) : product.stock <= 5 ? (
              <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700">
                Only {product.stock} left
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-sm font-medium text-green-700">
                In stock
              </span>
            )}
          </div>

          {product.description && (
            <p className="text-sm leading-relaxed text-zinc-600">{product.description}</p>
          )}

          {/* Add to Cart */}
          <div className="mt-2">
            <AddToCartButton
              orgSlug={orgSlug}
              productId={product.id}
              productName={product.name}
              priceCents={product.price_cents}
              imageUrl={primaryImage?.url ?? null}
              maxStock={product.stock}
              isSoldOut={isSoldOut}
            />
          </div>
        </div>
      </div>

      {/* Related products */}
      {relatedProducts.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-xl font-bold text-zinc-900">
            More from {product.categories?.name ?? 'the store'}
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {relatedProducts.map((related) => {
              const relPrimaryImg =
                related.product_images.find((img) => img.is_primary) ??
                related.product_images[0] ??
                null;

              return (
                <Link
                  key={related.id}
                  href={`/${orgSlug}/product/${related.slug}`}
                  className="group flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="relative aspect-square w-full overflow-hidden bg-zinc-100">
                    {relPrimaryImg ? (
                      <Image
                        src={relPrimaryImg.url}
                        alt={related.name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-zinc-400">
                        <span className="text-xs uppercase tracking-widest">No image</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-semibold text-zinc-900">{related.name}</h3>
                    <p className="mt-1 text-sm text-zinc-600">{formatPrice(related.price_cents)}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
