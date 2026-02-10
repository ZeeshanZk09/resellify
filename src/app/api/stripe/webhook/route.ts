import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { handleStripeWebhook } from '@/actions/billing/stripe';

// Read webhook secret at runtime; Stripe client is lazily created to avoid
// throwing during module initialization when env vars are not present.
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: '2025-12-15.clover' });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    const stripe = getStripe();
    if (!signature || !webhookSecret || !stripe) {
      return NextResponse.json(
        { error: 'Missing signature, webhook secret, or Stripe not configured' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      const error = err as Error;
      console.error('Webhook signature verification failed:', error.message);
      return NextResponse.json({ error: `Webhook Error: ${error.message}` }, { status: 400 });
    }

    // Handle the webhook
    await handleStripeWebhook(event);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
