'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import type { ShippingAddress, PaymentProvider } from '@/lib/supabase/types';
import { resolveSquareForOrg } from '@/lib/payments/routing';
import { createPayment } from '@/lib/payments/square';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PlaceOrderInput {
  customerName: string;
  customerEmail: string;
  shippingAddress: ShippingAddress;
  items: { productId: string; quantity: number; size: string | null }[];
  provider: PaymentProvider;
  /**
   * Card token from the Square Web Payments SDK (only required when
   * provider === 'square' AND a real Square account is configured —
   * either platform sandbox or org-connected).
   */
  squareCardToken?: string;
}

type PlaceOrderResult =
  | { ok: true; orderNumber: string }
  | { ok: false; error: string };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateOrderNumber(orgSlug: string): string {
  const prefix = orgSlug.slice(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, 'X');
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = String(Math.floor(Math.random() * 9000) + 1000);
  return `${prefix}-${date}-${rand}`;
}

// ---------------------------------------------------------------------------
// Action
// ---------------------------------------------------------------------------

export async function placeOrder(
  orgSlug: string,
  input: PlaceOrderInput
): Promise<PlaceOrderResult> {
  const admin = createAdminClient();

  // 1. Resolve org
  const { data: orgData, error: orgError } = await admin
    .from('organizations')
    .select('id')
    .eq('slug', orgSlug)
    .eq('is_active', true)
    .single();

  if (orgError || !orgData) {
    return { ok: false, error: 'Organization not found.' };
  }

  const orgId = orgData.id;

  // 2. Validate basic inputs
  if (!input.customerName.trim()) return { ok: false, error: 'Name is required.' };
  if (!input.customerEmail.trim() || !input.customerEmail.includes('@')) {
    return { ok: false, error: 'A valid email is required.' };
  }
  if (!input.shippingAddress.line1.trim()) return { ok: false, error: 'Address line 1 is required.' };
  if (!input.shippingAddress.city.trim()) return { ok: false, error: 'City is required.' };
  if (!input.shippingAddress.state.trim()) return { ok: false, error: 'State is required.' };
  if (!input.shippingAddress.postal_code.trim()) return { ok: false, error: 'Postal code is required.' };
  if (!input.shippingAddress.country.trim()) return { ok: false, error: 'Country is required.' };
  if (!input.items || input.items.length === 0) return { ok: false, error: 'Cart is empty.' };

  // 3. Re-fetch products for authoritative price + stock + size requirement
  const productIds = input.items.map((i) => i.productId);
  const { data: productsData, error: productsError } = await admin
    .from('products')
    .select('id, name, price_cents, stock, is_active, has_sizes')
    .in('id', productIds)
    .eq('organization_id', orgId);

  if (productsError || !productsData) {
    return { ok: false, error: 'Failed to load product data.' };
  }

  const productMap = new Map(productsData.map((p) => [p.id, p]));

  // 4. Stock + size check
  for (const lineItem of input.items) {
    const product = productMap.get(lineItem.productId);
    if (!product || !product.is_active) {
      return { ok: false, error: 'Product not found or unavailable.' };
    }
    if (product.has_sizes && !lineItem.size) {
      return {
        ok: false,
        error: `Please select a size for "${product.name}".`,
      };
    }
    if (lineItem.quantity > product.stock) {
      return {
        ok: false,
        error: `Only ${product.stock} of "${product.name}" available.`,
      };
    }
  }

  // 5. Calculate subtotal from DB prices
  let subtotalCents = 0;
  for (const lineItem of input.items) {
    const product = productMap.get(lineItem.productId)!;
    subtotalCents += product.price_cents * lineItem.quantity;
  }

  // 6. Process payment based on provider
  // Stripe and PayPal are still mock. Square goes through the routing helper
  // which picks: connected | platform_sandbox | mock automatically.
  let paymentId = `test_${crypto.randomUUID()}`;

  if (input.provider === 'square') {
    const square = await resolveSquareForOrg(orgId);

    if (square.mode !== 'mock') {
      // Real Square sandbox or connected account — must have a card token
      if (!input.squareCardToken) {
        return {
          ok: false,
          error: 'Card information is required to complete payment.',
        };
      }
      try {
        const payment = await createPayment({
          accessToken: square.accessToken,
          locationId: square.locationId,
          amountCents: subtotalCents,
          sourceId: input.squareCardToken,
          idempotencyKey: crypto.randomUUID(),
          buyerEmailAddress: input.customerEmail.trim().toLowerCase(),
        });
        paymentId = payment.id;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Payment failed. Please try again.';
        return { ok: false, error: message };
      }
    }
    // mode === 'mock' — paymentId stays as test_... (existing behavior)
  }

  // 7. Generate order number (with one collision retry)
  let orderNumber = generateOrderNumber(orgSlug);
  const { data: existing } = await admin
    .from('orders')
    .select('id')
    .eq('order_number', orderNumber)
    .maybeSingle();

  if (existing) {
    orderNumber = generateOrderNumber(orgSlug);
  }

  // 8. Insert order
  const { data: orderData, error: orderError } = await admin
    .from('orders')
    .insert({
      organization_id: orgId,
      order_number: orderNumber,
      customer_name: input.customerName.trim(),
      customer_email: input.customerEmail.trim().toLowerCase(),
      shipping_address: input.shippingAddress,
      subtotal_cents: subtotalCents,
      tax_cents: 0,
      total_cents: subtotalCents,
      status: 'paid',
      payment_provider: input.provider,
      payment_id: paymentId,
    })
    .select('id')
    .single();

  if (orderError || !orderData) {
    return { ok: false, error: 'Failed to create order. Please try again.' };
  }

  const orderId = orderData.id;

  // 9. Insert order items
  const orderItemInserts = input.items.map((lineItem) => {
    const product = productMap.get(lineItem.productId)!;
    return {
      order_id: orderId,
      product_id: lineItem.productId,
      product_name: product.name,
      quantity: lineItem.quantity,
      unit_price_cents: product.price_cents,
      size: lineItem.size,
    };
  });

  const { error: itemsError } = await admin.from('order_items').insert(orderItemInserts);

  if (itemsError) {
    console.error('[placeOrder] order_items insert failed:', itemsError);
  }

  // 10. Decrement stock for each product
  for (const lineItem of input.items) {
    const product = productMap.get(lineItem.productId)!;
    const newStock = Math.max(0, product.stock - lineItem.quantity);
    await admin.from('products').update({ stock: newStock }).eq('id', lineItem.productId);
  }

  return { ok: true, orderNumber };
}

// ---------------------------------------------------------------------------
// Server-only helper for the checkout page to know if Square is "real"
// ---------------------------------------------------------------------------

/**
 * Returns true if a real Square account (connected OR platform sandbox) is
 * configured for this org. The checkout page uses this to decide whether to
 * render the Square Web Payments SDK card form or just a mock button.
 */
export async function squareIsLive(orgSlug: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data: orgData } = await admin
    .from('organizations')
    .select('id')
    .eq('slug', orgSlug)
    .maybeSingle();
  const org = orgData as { id: string } | null;
  if (!org) return false;
  const square = await resolveSquareForOrg(org.id);
  return square.mode !== 'mock';
}
