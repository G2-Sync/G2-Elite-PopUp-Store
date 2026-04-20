'use client';

import { useCartStore } from '@/stores/cart';
import type { CartItem } from '@/stores/cart';

/**
 * Convenience wrapper around the cart store scoped to a single org.
 * All mutations are automatically namespaced to `orgSlug`.
 */
export function useOrgCart(orgSlug: string) {
  const store = useCartStore();

  return {
    items: store.carts[orgSlug]?.items ?? [],
    itemCount: store.getItemCount(orgSlug),
    subtotalCents: store.getSubtotalCents(orgSlug),
    addItem: (item: Omit<CartItem, 'quantity'>, qty?: number) =>
      store.addItem(orgSlug, item, qty),
    updateQuantity: (productId: string, qty: number) =>
      store.updateQuantity(orgSlug, productId, qty),
    removeItem: (productId: string) => store.removeItem(orgSlug, productId),
    clearCart: () => store.clearCart(orgSlug),
  };
}
