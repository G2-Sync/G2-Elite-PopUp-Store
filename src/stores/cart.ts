'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CartItem = {
  productId: string;
  productName: string;
  priceCents: number;
  imageUrl: string | null;
  quantity: number;
  maxStock: number;
  /** Selected size, or null if the product doesn't have sizes. */
  size: string | null;
};

export type OrgCart = { items: CartItem[] };

/** Build a stable key for a cart row. Same product in different sizes
 * counts as separate rows. */
function rowKey(productId: string, size: string | null): string {
  return `${productId}::${size ?? ''}`;
}

type CartStore = {
  carts: Record<string, OrgCart>; // keyed by orgSlug
  addItem: (orgSlug: string, item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  updateQuantity: (
    orgSlug: string,
    productId: string,
    size: string | null,
    quantity: number
  ) => void;
  removeItem: (orgSlug: string, productId: string, size: string | null) => void;
  clearCart: (orgSlug: string) => void;
  getCart: (orgSlug: string) => OrgCart;
  getItemCount: (orgSlug: string) => number;
  getSubtotalCents: (orgSlug: string) => number;
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      carts: {},

      addItem(orgSlug, item, quantity = 1) {
        set((state) => {
          const existing = state.carts[orgSlug]?.items ?? [];
          const key = rowKey(item.productId, item.size);
          const idx = existing.findIndex(
            (i) => rowKey(i.productId, i.size) === key
          );

          let nextItems: CartItem[];
          if (idx !== -1) {
            // Increment, capped at maxStock
            nextItems = existing.map((i, index) =>
              index === idx
                ? { ...i, quantity: Math.min(i.quantity + quantity, i.maxStock) }
                : i
            );
          } else {
            const clampedQty = Math.min(quantity, item.maxStock);
            nextItems = [...existing, { ...item, quantity: clampedQty }];
          }

          return {
            carts: {
              ...state.carts,
              [orgSlug]: { items: nextItems },
            },
          };
        });
      },

      updateQuantity(orgSlug, productId, size, quantity) {
        set((state) => {
          const existing = state.carts[orgSlug]?.items ?? [];
          const key = rowKey(productId, size);
          let nextItems: CartItem[];

          if (quantity <= 0) {
            nextItems = existing.filter(
              (i) => rowKey(i.productId, i.size) !== key
            );
          } else {
            nextItems = existing.map((i) =>
              rowKey(i.productId, i.size) === key
                ? { ...i, quantity: Math.min(quantity, i.maxStock) }
                : i
            );
          }

          return {
            carts: {
              ...state.carts,
              [orgSlug]: { items: nextItems },
            },
          };
        });
      },

      removeItem(orgSlug, productId, size) {
        set((state) => {
          const existing = state.carts[orgSlug]?.items ?? [];
          const key = rowKey(productId, size);
          return {
            carts: {
              ...state.carts,
              [orgSlug]: {
                items: existing.filter(
                  (i) => rowKey(i.productId, i.size) !== key
                ),
              },
            },
          };
        });
      },

      clearCart(orgSlug) {
        set((state) => ({
          carts: {
            ...state.carts,
            [orgSlug]: { items: [] },
          },
        }));
      },

      getCart(orgSlug) {
        return get().carts[orgSlug] ?? { items: [] };
      },

      getItemCount(orgSlug) {
        const cart = get().carts[orgSlug];
        if (!cart) return 0;
        return cart.items.reduce((sum, i) => sum + i.quantity, 0);
      },

      getSubtotalCents(orgSlug) {
        const cart = get().carts[orgSlug];
        if (!cart) return 0;
        return cart.items.reduce((sum, i) => sum + i.priceCents * i.quantity, 0);
      },
    }),
    {
      // Bumped key so old carts (without size) don't crash the new format.
      name: 'popup-cart-v2',
      partialize: (state) => ({ carts: state.carts }),
    }
  )
);
