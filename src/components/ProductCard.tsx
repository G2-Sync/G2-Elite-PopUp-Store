import Link from 'next/link';
import Image from 'next/image';
import type { Product } from '@/lib/supabase/types';
import { formatPrice } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  primaryImageUrl?: string;
}

export default function ProductCard({ product, primaryImageUrl }: ProductCardProps) {
  const isSoldOut = product.stock === 0;

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
    >
      {/* Image */}
      <div className="relative aspect-square w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        {primaryImageUrl ? (
          <Image
            src={primaryImageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center text-zinc-400"
            aria-label={`No image for ${product.name}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
            </svg>
          </div>
        )}

        {/* Sold Out Overlay */}
        {isSoldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <span className="rounded-full bg-white px-4 py-1 text-sm font-semibold uppercase tracking-wider text-zinc-900">
              Sold Out
            </span>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex flex-1 flex-col gap-1 p-4">
        {product.categories?.name && (
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            {product.categories.name}
          </span>
        )}
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-2 leading-snug">
          {product.name}
        </h3>
        <p className="mt-auto pt-2 text-base font-bold text-zinc-900 dark:text-zinc-100">
          {formatPrice(product.price_cents)}
        </p>
      </div>
    </Link>
  );
}
