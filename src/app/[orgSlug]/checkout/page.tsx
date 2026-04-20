'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useOrgCart } from '@/hooks/useOrgCart';
import { formatPrice } from '@/lib/utils';
import { placeOrder } from './_actions';
import SandboxBanner from '@/components/SandboxBanner';
import type { PaymentProvider, ShippingAddress } from '@/lib/supabase/types';

interface CheckoutPageProps {
  params: Promise<{ orgSlug: string }>;
}

type ProviderOption = {
  value: PaymentProvider;
  label: string;
  description: string;
};

const PROVIDERS: ProviderOption[] = [
  { value: 'stripe', label: 'Stripe', description: 'Test Mode' },
  { value: 'paypal', label: 'PayPal', description: 'Test Mode' },
  { value: 'square', label: 'Square', description: 'Test Mode' },
];

export default function CheckoutPage({ params }: CheckoutPageProps) {
  const { orgSlug } = use(params);
  const router = useRouter();
  const { items, subtotalCents, clearCart } = useOrgCart(orgSlug);

  // Customer fields
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');

  // Shipping fields
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('US');

  // Payment
  const [provider, setProvider] = useState<PaymentProvider>('stripe');

  // Submission
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <>
        <SandboxBanner />
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-20 text-center sm:px-6">
          <p className="mb-4 text-zinc-500">Your cart is empty.</p>
          <Link href={`/${orgSlug}/shop`} className="text-sm font-medium text-zinc-700 underline">
            Continue Shopping &rarr;
          </Link>
        </main>
      </>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const shippingAddress: ShippingAddress = {
      line1: line1.trim(),
      line2: line2.trim() || undefined,
      city: city.trim(),
      state: state.trim(),
      postal_code: postalCode.trim(),
      country: country.trim(),
    };

    const result = await placeOrder(orgSlug, {
      customerName,
      customerEmail,
      shippingAddress,
      items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      provider,
    });

    if (!result.ok) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    // Clear cart and redirect
    clearCart();
    router.push(`/${orgSlug}/checkout/confirmation?order=${encodeURIComponent(result.orderNumber)}`);
  }

  return (
    <>
      <SandboxBanner />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-2xl font-bold tracking-tight text-zinc-900">Checkout</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
            {/* Left: Customer + Shipping */}
            <div className="space-y-6 lg:col-span-3">
              {/* Customer info */}
              <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-base font-semibold text-zinc-900">Contact Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-700" htmlFor="name">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="name"
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-400 focus:outline-none"
                      placeholder="Jane Smith"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-700" htmlFor="email">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-400 focus:outline-none"
                      placeholder="jane@example.com"
                    />
                  </div>
                </div>
              </section>

              {/* Shipping address */}
              <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-base font-semibold text-zinc-900">Shipping Address</h2>
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-700" htmlFor="line1">
                      Address Line 1 <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="line1"
                      type="text"
                      required
                      value={line1}
                      onChange={(e) => setLine1(e.target.value)}
                      className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-400 focus:outline-none"
                      placeholder="123 Main St"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-700" htmlFor="line2">
                      Address Line 2
                    </label>
                    <input
                      id="line2"
                      type="text"
                      value={line2}
                      onChange={(e) => setLine2(e.target.value)}
                      className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-400 focus:outline-none"
                      placeholder="Apt 4B (optional)"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-zinc-700" htmlFor="city">
                        City <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="city"
                        type="text"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-400 focus:outline-none"
                        placeholder="Chicago"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-zinc-700" htmlFor="state">
                        State <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="state"
                        type="text"
                        required
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-400 focus:outline-none"
                        placeholder="IL"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-zinc-700" htmlFor="postal_code">
                        Postal Code <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="postal_code"
                        type="text"
                        required
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-400 focus:outline-none"
                        placeholder="60601"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-zinc-700" htmlFor="country">
                        Country <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="country"
                        type="text"
                        required
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-400 focus:outline-none"
                        placeholder="US"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Payment method */}
              <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-base font-semibold text-zinc-900">Payment Method</h2>
                <div className="space-y-3">
                  {PROVIDERS.map((opt) => (
                    <label
                      key={opt.value}
                      className={[
                        'flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors',
                        provider === opt.value
                          ? 'border-zinc-900 bg-zinc-50'
                          : 'border-zinc-200 hover:border-zinc-300',
                      ].join(' ')}
                    >
                      <input
                        type="radio"
                        name="provider"
                        value={opt.value}
                        checked={provider === opt.value}
                        onChange={() => setProvider(opt.value)}
                        className="h-4 w-4 accent-zinc-900"
                      />
                      <div className="flex-1">
                        <span className="text-sm font-semibold text-zinc-900">{opt.label}</span>
                        <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                          {opt.description}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </section>
            </div>

            {/* Right: Order summary + submit */}
            <div className="lg:col-span-2">
              <div className="sticky top-20 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-base font-semibold text-zinc-900">Order Summary</h2>

                <ul className="mb-4 space-y-3 text-sm">
                  {items.map((item) => (
                    <li key={item.productId} className="flex justify-between gap-2">
                      <span className="text-zinc-700 leading-snug">
                        {item.productName}
                        <span className="ml-1 text-zinc-400">&times;{item.quantity}</span>
                      </span>
                      <span className="flex-shrink-0 font-medium text-zinc-900">
                        {formatPrice(item.priceCents * item.quantity)}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="space-y-2 border-t border-zinc-100 pt-4 text-sm">
                  <div className="flex justify-between text-zinc-600">
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotalCents)}</span>
                  </div>
                  <div className="flex justify-between text-zinc-600">
                    <span>Tax</span>
                    <span>&mdash;</span>
                  </div>
                  <div className="flex justify-between pt-2 font-semibold text-zinc-900">
                    <span>Total</span>
                    <span>{formatPrice(subtotalCents)}</span>
                  </div>
                </div>

                {error && (
                  <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-6 w-full rounded-lg px-4 py-3 text-sm font-semibold shadow-sm transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--org-accent)',
                    color: 'var(--org-primary)',
                  }}
                >
                  {submitting ? 'Placing Order...' : 'Place Test Order'}
                </button>

                <p className="mt-3 text-center text-[11px] text-zinc-400">
                  No real charges will be made. This is a simulated transaction.
                </p>
              </div>
            </div>
          </div>
        </form>
      </main>
    </>
  );
}
