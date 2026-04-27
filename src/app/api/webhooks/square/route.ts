import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyWebhookSignature } from '@/lib/payments/square';

/**
 * POST /api/webhooks/square
 *
 * Receives webhook events from Square. Square retries on non-200, so we
 * always return 200 unless the signature fails verification (401).
 *
 * Currently handled events:
 *  - payment.updated  → ensure order is paid (idempotent; usually a no-op
 *    since Phase 4's placeOrder marks orders paid synchronously)
 *  - refund.created   → mark the matching order's status to 'refunded'
 *
 * Other events are accepted (200) but ignored.
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get('x-square-hmacsha256-signature') ?? '';

  const signatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
  if (!signatureKey) {
    console.error('[square/webhook] SQUARE_WEBHOOK_SIGNATURE_KEY not configured');
    return new NextResponse('Webhook key not configured', { status: 500 });
  }

  // The notification URL Square will use must match what we verify against.
  // In production this comes from request URL; for sandbox configure your
  // tunnel/public URL in Square dashboard to match.
  const notificationUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin}/api/webhooks/square`;

  if (!verifyWebhookSignature(rawBody, signature, signatureKey, notificationUrl)) {
    return new NextResponse('Invalid signature', { status: 401 });
  }

  let event: { type?: string; data?: { object?: Record<string, unknown> } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new NextResponse('Invalid JSON', { status: 400 });
  }

  const admin = createAdminClient();

  switch (event.type) {
    case 'payment.updated': {
      const payment = event.data?.object as
        | { payment?: { id?: string; status?: string } }
        | undefined;
      const paymentId = payment?.payment?.id;
      const status = payment?.payment?.status;

      if (paymentId && status === 'COMPLETED') {
        // Idempotent: if order already paid, no-op
        await admin
          .from('orders')
          .update({ status: 'paid' })
          .eq('payment_id', paymentId)
          .eq('status', 'pending');
      }
      break;
    }

    case 'refund.created':
    case 'refund.updated': {
      const refund = event.data?.object as
        | { refund?: { payment_id?: string; status?: string } }
        | undefined;
      const paymentId = refund?.refund?.payment_id;
      const status = refund?.refund?.status;

      if (paymentId && status === 'COMPLETED') {
        await admin
          .from('orders')
          .update({ status: 'refunded' })
          .eq('payment_id', paymentId);
      }
      break;
    }

    default:
      // Accepted but unhandled
      break;
  }

  return NextResponse.json({ ok: true });
}
