import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Stripe webhook signature verification failed:', message);
    return NextResponse.json({ error: `Webhook error: ${message}` }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      // TODO: Mark order as paid, reduce stock, send confirmation email
      const session = event.data.object as Stripe.Checkout.Session;
      console.log('Stripe checkout completed:', session.id);
      break;
    }
    case 'payment_intent.payment_failed': {
      // TODO: Mark order as failed
      const intent = event.data.object as Stripe.PaymentIntent;
      console.log('Stripe payment failed:', intent.id);
      break;
    }
    default:
      console.log('Unhandled Stripe event type:', event.type);
  }

  return NextResponse.json({ received: true });
}
