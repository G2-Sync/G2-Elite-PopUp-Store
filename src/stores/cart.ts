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
};

export type OrgCart = { items: CartItem[] };

type CartStore = {
  carts: Record<string, OrgCart>; // keyed by orgSlug
  addItem: (orgSlug: string, item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  updateQuantity: (orgSlug: string, productId: string, quantity: number) => void;
  removeItem: (orgSlug: string, productId: string) => void;
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
          const idx = existing.findIndex((i) => i.productId === item.productId);

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

      updateQuantity(orgSlug, productId, quantity) {
        set((state) => {
          const existing = state.carts[orgSlug]?.items ?? [];
          let nextItems: CartItem[];

          if (quantity <= 0) {
            nextItems = existing.filter((i) => i.productId !== productId);
          } else {
            nextItems = existing.map((i) =>
              i.productId === productId
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

      removeItem(orgSlug, productId) {
        set((state) => {
          const existing = state.carts[orgSlug]?.items ?? [];
          return {
            carts: {
              ...state.carts,
              [orgSlug]: { items: existing.filter((i) => i.productId !== productId) },
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
      name: 'popup-cart-v1',
      // Only persist carts; computed selectors re-derive from state
      partialize: (state) => ({ carts: state.carts }),
    }
  )
);
