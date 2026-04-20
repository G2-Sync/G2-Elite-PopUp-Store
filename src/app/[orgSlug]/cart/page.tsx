'use client';

import { use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useOrgCart } from '@/hooks/useOrgCart';
import { formatPrice } from '@/lib/utils';
import SandboxBanner from '@/components/SandboxBanner';

interface CartPageProps {
  params: Promise<{ orgSlug: string }>;
}

export default function CartPage({ params }: CartPageProps) {
  const { orgSlug } = use(params);
  const { items, subtotalCents, updateQuantity, removeItem } = useOrgCart(orgSlug);

  return (
    <>
      <SandboxBanner />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-2xl font-bold tracking-tight text-zinc-900">Your Cart</h1>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-200 bg-white py-24 text-center">
            <p className="mb-4 text-zinc-500">Your cart is empty.</p>
            <Link
              href={`/${orgSlug}/shop`}
              className="text-sm font-medium text-zinc-700 underline underline-offset-2 hover:text-zinc-900"
            >
              Continue Shopping &rarr;
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Cart items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <div
                  key={item.productId}
                  className="flex gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
                >
                  {/* Image */}
                  <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-zinc-100">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.productName}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-zinc-400">
                        <span className="text-[10px] uppercase tracking-widest">No img</span>
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex flex-1 flex-col justify-between">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-semibold text-zinc-900 leading-snug">
                        {item.productName}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeItem(item.productId)}
                        className="flex-shrink-0 text-zinc-400 hover:text-red-500 transition-colors"
                        aria-label={`Remove ${item.productName}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      {/* Qty stepper */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-zinc-200 text-zinc-600 transition-colors hover:border-zinc-400 hover:text-zinc-900 disabled:opacity-40"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-6 text-center text-sm font-medium text-zinc-900">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          disabled={item.quantity >= item.maxStock}
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-zinc-200 text-zinc-600 transition-colors hover:border-zinc-400 hover:text-zinc-900 disabled:opacity-40"
                          aria-label="Increase quantity"
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      {/* Line total */}
                      <span className="text-sm font-semibold text-zinc-900">
                        {formatPrice(item.priceCents * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order summary */}
            <div className="lg:col-span-1">
              <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-base font-semibold text-zinc-900">Order Summary</h2>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-zinc-600">
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotalCents)}</span>
                  </div>
                  <div className="flex justify-between text-zinc-600">
                    <span>Tax</span>
                    <span>&mdash;</span>
                  </div>
                  <div className="mt-3 flex justify-between border-t border-zinc-100 pt-3 font-semibold text-zinc-900">
                    <span>Total</span>
                    <span>{formatPrice(subtotalCents)}</span>
                  </div>
                </div>

                <Link
                  href={`/${orgSlug}/checkout`}
                  className="mt-6 block w-full rounded-lg px-4 py-3 text-center text-sm font-semibold shadow-sm transition-opacity hover:opacity-80"
                  style={{
                    backgroundColor: 'var(--org-accent)',
                    color: 'var(--org-primary)',
                  }}
                >
                  Proceed to Checkout
                </Link>

                <Link
                  href={`/${orgSlug}/shop`}
                  className="mt-3 block text-center text-xs text-zinc-500 hover:text-zinc-700"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
