'use client';

import { useState } from 'react';
import { useOrgCart } from '@/hooks/useOrgCart';

interface AddToCartButtonProps {
  orgSlug: string;
  productId: string;
  productName: string;
  priceCents: number;
  imageUrl: string | null;
  maxStock: number;
  isSoldOut: boolean;
}

export default function AddToCartButton({
  orgSlug,
  productId,
  productName,
  priceCents,
  imageUrl,
  maxStock,
  isSoldOut,
}: AddToCartButtonProps) {
  const [flash, setFlash] = useState(false);
  const { addItem } = useOrgCart(orgSlug);

  function handleAddToCart() {
    if (isSoldOut) return;
    addItem({ productId, productName, priceCents, imageUrl, maxStock }, 1);
    setFlash(true);
    setTimeout(() => setFlash(false), 1500);
  }

  return (
    <>
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
