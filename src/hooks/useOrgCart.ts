'use client';

import { useCartStore } from '@/stores/cart';
import type { CartItem } from '@/stores/cart';

/**
 * Convenience wrapper around the cart store scoped to a single org.
 * All mutations are automatically namespaced to `orgSlug`.
 *
 * Same product in different sizes counts as separate cart rows, so all
 * mutators identifying a row require both productId and size.
 */
export function useOrgCart(orgSlug: string) {
  const store = useCartStore();

  return {
    items: store.carts[orgSlug]?.items ?? [],
    itemCount: store.getItemCount(orgSlug),
    subtotalCents: store.getSubtotalCents(orgSlug),
    addItem: (item: Omit<CartItem, 'quantity'>, qty?: number) =>
      store.addItem(orgSlug, item, qty),
    updateQuantity: (productId: string, size: string | null, qty: number) =>
      store.updateQuantity(orgSlug, productId, size, qty),
    removeItem: (productId: string, size: string | null) =>
      store.removeItem(orgSlug, productId, size),
    clearCart: () => store.clearCart(orgSlug),
  };
}
