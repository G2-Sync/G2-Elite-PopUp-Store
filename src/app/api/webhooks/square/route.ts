import { NextRequest, NextResponse } from 'next/server';

/**
 * Square webhook handler (placeholder).
 * TODO: Verify webhook signature and process Square payment events.
 * Reference: https://developer.squareup.com/docs/webhooks
 */
export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const event = body as { type?: string; event_id?: string };

  switch (event.type) {
    case 'payment.completed': {
      // TODO: Mark order as paid, reduce stock, send confirmation email
      console.log('Square payment completed:', event.event_id);
      break;
    }
    case 'payment.failed': {
      // TODO: Mark order as failed
      console.log('Square payment failed:', event.event_id);
      break;
    }
    default:
      console.log('Unhandled Square event type:', event.type);
  }

  return NextResponse.json({ received: true });
}
