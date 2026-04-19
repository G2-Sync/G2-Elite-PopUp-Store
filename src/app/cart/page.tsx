import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Cart — G2 Elite Pop-Up Store',
};

export default function CartPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
        Your Cart
      </h1>
      <p className="mt-4 text-zinc-500 dark:text-zinc-400">
        Cart functionality coming soon.
      </p>
      <Link
        href="/shop"
        className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-zinc-900 underline underline-offset-4 hover:text-zinc-600 dark:text-zinc-100 dark:hover:text-zinc-400"
      >
        Continue Shopping
      </Link>
    </main>
  );
}
