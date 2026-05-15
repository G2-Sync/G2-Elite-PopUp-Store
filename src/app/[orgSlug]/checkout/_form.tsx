'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import { useOrgCart } from '@/hooks/useOrgCart';
import { formatPrice } from '@/lib/utils';
import { placeOrder } from './_actions';
import SandboxBanner from '@/components/SandboxBanner';
import type { PaymentProvider, ShippingAddress } from '@/lib/supabase/types';

// Minimal types for the Square Web Payments SDK (we don't import the npm
// package — the SDK is loaded as a <script> tag at runtime).
interface SquareCardInstance {
  attach: (selector: string) => Promise<void>;
  destroy: () => Promise<void>;
  tokenize: () => Promise<{
    status: 'OK' | 'ERROR';
    token?: string;
    errors?: { message: string }[];
  }>;
}
interface SquarePaymentsInstance {
  card: () => Promise<SquareCardInstance>;
}
interface SquareGlobal {
  payments: (appId: string, locationId: string) => SquarePaymentsInstance;
}

declare global {
  interface Window {
    Square?: SquareGlobal;
  }
}

interface CheckoutFormProps {
  orgSlug: string;
  squareReal: boolean;
  squareEnv: 'sandbox' | 'production';
  squareAppId: string | null;
  squareLocationId: string | null;
}

type ProviderOption = {
  value: PaymentProvider;
  label: string;
  description: string;
};

const SQUARE_SDK_URL_SANDBOX = 'https://sandbox.web.squarecdn.com/v1/square.js';
const SQUARE_SDK_URL_PRODUCTION = 'https://web.squarecdn.com/v1/square.js';

export default function CheckoutForm({
  orgSlug,
  squareReal,
  squareEnv,
  squareAppId,
  squareLocationId,
}: CheckoutFormProps) {
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
  const [provider, setProvider] = useState<PaymentProvider>('square');

  // Submission
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Square SDK state
  const [squareReady, setSquareReady] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const cardRef = useRef<SquareCardInstance | null>(null);

  const PROVIDERS: ProviderOption[] = [
    {
      value: 'square',
      label: 'Square',
      description: squareReal ? `${squareEnv === 'sandbox' ? 'Sandbox' : 'Live'}` : 'Test Mode',
    },
    { value: 'stripe', label: 'Stripe', description: 'Test Mode' },
    { value: 'paypal', label: 'PayPal', description: 'Test Mode' },
  ];

  // Initialize Square Web Payments SDK once script + provider are ready
  useEffect(() => {
    if (provider !== 'square') {
      // Tear down existing card form if user switches away
      if (cardRef.current) {
        cardRef.current.destroy().catch(() => {});
        cardRef.current = null;
      }
      setSquareReady(false);
      return;
    }
    if (!squareReal || !squareAppId || !squareLocationId) return;
    if (cardRef.current) return; // already initialized

    let cancelled = false;

    // Wait for window.Square to become available (handles the race where
    // the <Script> tag hasn't finished loading yet on first render)
    async function waitForSquareSDK(timeoutMs = 8000): Promise<boolean> {
      const start = Date.now();
      while (Date.now() - start < timeoutMs) {
        if (typeof window !== 'undefined' && window.Square) return true;
        await new Promise((r) => setTimeout(r, 100));
      }
      return false;
    }

    (async () => {
      const sdkAvailable = await waitForSquareSDK();
      if (cancelled) return;
      if (!sdkAvailable) {
        setError(
          'Square card form failed to load. Check your network connection (or any ad-blockers) and refresh.'
        );
        return;
      }
      try {
        const payments = window.Square!.payments(squareAppId, squareLocationId);
        const card = await payments.card();
        if (cancelled) {
          await card.destroy().catch(() => {});
          return;
        }
        await card.attach('#square-card-container');
        cardRef.current = card;
        setSquareReady(true);
      } catch (err) {
        console.error('[checkout] Square SDK init failed:', err);
        setError('Failed to load card form. Refresh and try again.');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [provider, squareReal, squareAppId, squareLocationId, scriptLoaded]);

  if (items.length === 0) {
    return (
      <>
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

    let squareCardToken: string | undefined;

    // For real Square, tokenize the card before submitting
    if (provider === 'square' && squareReal) {
      if (!cardRef.current) {
        setError('Card form not ready yet. Please wait a moment and try again.');
        setSubmitting(false);
        return;
      }
      try {
        const result = await cardRef.current.tokenize();
        if (result.status !== 'OK' || !result.token) {
          const msg = result.errors?.[0]?.message ?? 'Card tokenization failed.';
          setError(msg);
          setSubmitting(false);
          return;
        }
        squareCardToken = result.token;
      } catch (err) {
        console.error('[checkout] tokenize failed:', err);
        setError('Could not process card. Please try again.');
        setSubmitting(false);
        return;
      }
    }

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
      squareCardToken,
    });

    if (!result.ok) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    clearCart();
    router.push(`/${orgSlug}/checkout/confirmation?order=${encodeURIComponent(result.orderNumber)}`);
  }

  const showSquareCardForm = provider === 'square' && squareReal && squareAppId && squareLocationId;
  const sdkUrl = squareEnv === 'production' ? SQUARE_SDK_URL_PRODUCTION : SQUARE_SDK_URL_SANDBOX;

  return (
    <>
      {/* Load Square Web Payments SDK only when we'll actually use it */}
      {squareReal && squareAppId && squareLocationId && (
        <Script
          src={sdkUrl}
          strategy="afterInteractive"
          onLoad={() => setScriptLoaded(true)}
          onError={() =>
            setError(
              'Could not load the Square card form (network or ad-blocker). Refresh to try again.'
            )
          }
        />
      )}

      <SandboxBanner
        variant={showSquareCardForm ? 'square' : 'mock'}
        environment={squareEnv}
      />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-2xl font-bold tracking-tight text-zinc-900">Checkout</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
            {/* Left: Customer + Shipping + Payment */}
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
                <h2 className="mb-4 text-base font-semibold text-zinc-900">Billing Address</h2>
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
                  {PROVIDERS.map((opt) => {
                    const isSquareLive = opt.value === 'square' && squareReal;
                    return (
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
                          <span
                            className={[
                              'ml-2 rounded-full px-2 py-0.5 text-[10px] font-medium',
                              isSquareLive
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-amber-100 text-amber-700',
                            ].join(' ')}
                          >
                            {opt.description}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>

                {/* Square Web Payments SDK card form */}
                {showSquareCardForm && (
                  <div className="mt-5 rounded-lg border border-zinc-200 p-4">
                    <p className="mb-3 text-xs font-medium text-zinc-700">Card Details</p>
                    <div id="square-card-container" className="min-h-[90px]" />
                    {!squareReady && (
                      <p className="mt-2 text-xs text-zinc-400">Loading card form…</p>
                    )}
                  </div>
                )}
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
                  {submitting
                    ? 'Placing Order…'
                    : showSquareCardForm
                      ? 'Pay & Place Order'
                      : 'Place Test Order'}
                </button>

                <p className="mt-3 text-center text-[11px] text-zinc-400">
                  {showSquareCardForm
                    ? `Real Square ${squareEnv} transaction. ${squareEnv === 'sandbox' ? 'No actual money will move.' : ''}`
                    : 'No real charges will be made. This is a simulated transaction.'}
                </p>
              </div>
            </div>
          </div>
        </form>
      </main>
    </>
  );
}
