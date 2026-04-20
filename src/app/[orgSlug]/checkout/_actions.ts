'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import type { ShippingAddress, PaymentProvider } from '@/lib/supabase/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PlaceOrderInput {
  customerName: string;
  customerEmail: string;
  shippingAddress: ShippingAddress;
  items: { productId: string; quantity: number }[];
  provider: PaymentProvider;
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

  // 3. Re-fetch products for authoritative price + stock
  const productIds = input.items.map((i) => i.productId);
  const { data: productsData, error: productsError } = await admin
    .from('products')
    .select('id, name, price_cents, stock, is_active')
    .in('id', productIds)
    .eq('organization_id', orgId);

  if (productsError || !productsData) {
    return { ok: false, error: 'Failed to load product data.' };
  }

  const productMap = new Map(productsData.map((p) => [p.id, p]));

  // 4. Stock check
  for (const lineItem of input.items) {
    const product = productMap.get(lineItem.productId);
    if (!product || !product.is_active) {
      return { ok: false, error: `Product not found or unavailable.` };
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

  // 6. Generate order number (with one collision retry)
  let orderNumber = generateOrderNumber(orgSlug);
  const { data: existing } = await admin
    .from('orders')
    .select('id')
    .eq('order_number', orderNumber)
    .maybeSingle();

  if (existing) {
    orderNumber = generateOrderNumber(orgSlug);
  }

  // 7. Insert order
  const paymentId = 'test_' + crypto.randomUUID();

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

  // 8. Insert order items
  const orderItemInserts = input.items.map((lineItem) => {
    const product = productMap.get(lineItem.productId)!;
    return {
      order_id: orderId,
      product_id: lineItem.productId,
      product_name: product.name,
      quantity: lineItem.quantity,
      unit_price_cents: product.price_cents,
    };
  });

  const { error: itemsError } = await admin.from('order_items').insert(orderItemInserts);

  if (itemsError) {
    // Order exists but items failed — still return success, admin can reconcile
    console.error('[placeOrder] order_items insert failed:', itemsError);
  }

  // 9. Decrement stock for each product
  for (const lineItem of input.items) {
    const product = productMap.get(lineItem.productId)!;
    const newStock = Math.max(0, product.stock - lineItem.quantity);
    await admin
      .from('products')
      .update({ stock: newStock })
      .eq('id', lineItem.productId);
  }

  return { ok: true, orderNumber };
}
