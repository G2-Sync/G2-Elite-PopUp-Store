'use client';

import { useEffect } from 'react';
import { useCartStore } from '@/stores/cart';

interface CartClearerProps {
  orgSlug: string;
}

/**
 * Client component that clears the org cart on mount.
 * Rendered by the server-side confirmation page after a successful order.
 */
export default function CartClearer({ orgSlug }: CartClearerProps) {
  const clearCart = useCartStore((s) => s.clearCart);

  useEffect(() => {
    clearCart(orgSlug);
  }, [orgSlug, clearCart]);

  return null;
}
