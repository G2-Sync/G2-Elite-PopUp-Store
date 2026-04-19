import type { Product } from '@/lib/supabase/types';
import ProductCard from './ProductCard';

interface ProductGridProps {
  products: Product[];
}

export default function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-lg font-medium text-zinc-500 dark:text-zinc-400">
          No products match your filters.
        </p>
        <p className="mt-1 text-sm text-zinc-400 dark:text-zinc-500">
          Try selecting a different category or clearing your filters.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => {
        const primaryImage = product.product_images?.find((img) => img.is_primary);
        const firstImage = product.product_images?.[0];
        const imageUrl = primaryImage?.url ?? firstImage?.url;

        return (
          <ProductCard
            key={product.id}
            product={product}
            primaryImageUrl={imageUrl}
          />
        );
      })}
    </div>
  );
}
