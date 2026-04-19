import { NextRequest, NextResponse } from 'next/server';

/**
 * PayPal webhook handler (placeholder).
 * TODO: Verify webhook signature using PayPal's SDK and process events.
 * Reference: https://developer.paypal.com/docs/api/webhooks/
 */
export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const event = body as { event_type?: string; id?: string };

  switch (event.event_type) {
    case 'PAYMENT.CAPTURE.COMPLETED': {
      // TODO: Mark order as paid, reduce stock, send confirmation email
      console.log('PayPal payment captured:', event.id);
      break;
    }
    case 'PAYMENT.CAPTURE.DENIED': {
      // TODO: Mark order as failed
      console.log('PayPal payment denied:', event.id);
      break;
    }
    default:
      console.log('Unhandled PayPal event type:', event.event_type);
  }

  return NextResponse.json({ received: true });
}
