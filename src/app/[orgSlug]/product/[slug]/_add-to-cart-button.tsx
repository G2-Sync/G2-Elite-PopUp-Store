'use client';

import { useState } from 'react';
import { useOrgCart } from '@/hooks/useOrgCart';
import { PRODUCT_SIZES, type ProductSize } from '@/lib/supabase/types';

interface AddToCartButtonProps {
  orgSlug: string;
  productId: string;
  productName: string;
  priceCents: number;
  imageUrl: string | null;
  maxStock: number;
  isSoldOut: boolean;
  hasSizes: boolean;
}

export default function AddToCartButton({
  orgSlug,
  productId,
  productName,
  priceCents,
  imageUrl,
  maxStock,
  isSoldOut,
  hasSizes,
}: AddToCartButtonProps) {
  const [flash, setFlash] = useState(false);
  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { addItem } = useOrgCart(orgSlug);

  function handleAddToCart() {
    if (isSoldOut) return;
    if (hasSizes && !selectedSize) {
      setError('Please select a size.');
      return;
    }
    setError(null);
    addItem(
      {
        productId,
        productName,
        priceCents,
        imageUrl,
        maxStock,
        size: hasSizes ? selectedSize : null,
      },
      1
    );
    setFlash(true);
    setTimeout(() => setFlash(false), 1500);
  }

  return (
    <>
      {/* Size picker */}
      {hasSizes && !isSoldOut && (
        <div className="mb-2">
          <p className="mb-2 text-xs font-medium text-zinc-700">
            Size {selectedSize && <span className="text-zinc-400">— {selectedSize}</span>}
          </p>
          <div className="flex flex-wrap gap-2">
            {PRODUCT_SIZES.map((size) => {
              const isActive = selectedSize === size;
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => {
                    setSelectedSize(size);
                    setError(null);
                  }}
                  className={[
                    'rounded-md border px-3 py-1.5 text-xs font-medium transition-colors',
                    isActive
                      ? 'border-zinc-900 bg-zinc-900 text-white'
                      : 'border-zinc-300 bg-white text-zinc-700 hover:border-zinc-500',
                  ].join(' ')}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {error && (
        <p className="mb-2 text-xs font-medium text-red-600">{error}</p>
      )}

      <button
        type="button"
        onClick={handleAddToCart}
        disabled={isSoldOut}
        className="w-full rounded-lg px-6 py-3 text-sm font-semibold shadow-sm transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
        style={{
          backgroundColor: 'var(--org-accent)',
          color: 'var(--org-primary)',
        }}
      >
        {isSoldOut ? 'Sold Out' : flash ? 'Added!' : 'Add to Cart'}
      </button>
      {isSoldOut && (
        <p className="mt-2 text-center text-xs text-zinc-400">
          This product is currently out of stock.
        </p>
      )}
    </>
  );
}
