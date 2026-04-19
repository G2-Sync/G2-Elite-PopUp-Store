import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Checkout — G2 Elite Pop-Up Store',
};

export default function CheckoutPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
        Checkout
      </h1>
      <p className="mt-4 text-zinc-500 dark:text-zinc-400">
        Checkout with Stripe, PayPal, or Square — coming soon.
      </p>
    </main>
  );
}
