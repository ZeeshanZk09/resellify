'use server';

import Stripe from 'stripe';
import { auth } from '@/auth';
import { PaymentProvider, PaymentStatus } from '@/shared/lib/generated/prisma/enums';
import prisma from '@/shared/lib/prisma';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-12-15.clover',
});

export async function createCheckoutSession(planId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session?.user?.email) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get the plan
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan || !plan.isActive) {
      return { success: false, error: 'Plan not found or inactive' };
    }

    // Get or create Stripe customer
    let customerId: string;
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        subscriptions: {
          where: { status: 'ACTIVE' },
          take: 1,
        },
      },
    });

    if (user?.subscriptions?.[0]?.stripeCustomerId) {
      customerId = user.subscriptions[0].stripeCustomerId;
    } else {
      // Create Stripe customer
      const customer = await stripe.customers.create({
        email: session.user.email,
        name: session.user.name || undefined,
        metadata: {
          userId: session.user.id,
        },
      });
      customerId = customer.id;
    }

    // Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: plan.stripePriceId || undefined,
          quantity: 1,
        },
      ],
      success_url: `${
        process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      }/pricing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${
        process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      }/pricing?canceled=true`,
      metadata: {
        userId: session.user.id,
        planId: plan.id,
      },
      subscription_data: {
        metadata: {
          userId: session.user.id,
          planId: plan.id,
        },
      },
    });

    return {
      success: true,
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return { success: false, error: 'Failed to create checkout session' };
  }
}

export async function createPortalSession() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get user's Stripe customer ID
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: session.user.id,
        stripeCustomerId: { not: null },
      },
    });

    if (!subscription?.stripeCustomerId) {
      return { success: false, error: 'No active subscription found' };
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/pricing`,
    });

    return { success: true, url: portalSession.url };
  } catch (error) {
    console.error('Error creating portal session:', error);
    return { success: false, error: 'Failed to create portal session' };
  }
}

// Webhook handler (to be called from API route)
export async function handleStripeWebhook(event: Stripe.Event) {
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(invoice);
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }
    }
    return { success: true };
  } catch (error) {
    console.error('Error handling webhook:', error);
    return { success: false, error: 'Webhook handling failed' };
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const planId = session.metadata?.planId;

  if (!userId || !planId) {
    throw new Error('Missing metadata in checkout session');
  }

  const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

  // Create or update subscription in database
  const subData = subscription as any;
  await prisma.subscription.upsert({
    where: { stripeSubscriptionId: subscription.id },
    update: {
      status: subData.status === 'active' ? 'ACTIVE' : 'TRIALING',
      currentPeriodStart: new Date(subData.current_period_start * 1000),
      currentPeriodEnd: new Date(subData.current_period_end * 1000),
      stripeCustomerId: subData.customer as string,
    },
    create: {
      userId,
      planId,
      status: subData.status === 'active' ? 'ACTIVE' : 'TRIALING',
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: subData.customer as string,
      stripePriceId: subData.items.data[0]?.price.id,
      currentPeriodStart: new Date(subData.current_period_start * 1000),
      currentPeriodEnd: new Date(subData.current_period_end * 1000),
      startDate: new Date(),
    },
  });

  // Create payment transaction
  if (session.payment_intent) {
    const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent as string);
    await prisma.paymentTransaction.create({
      data: {
        userId,
        amount: paymentIntent.amount / 100, // Convert from cents
        currency: paymentIntent.currency.toUpperCase(),
        provider: PaymentProvider.STRIPE,
        status: PaymentStatus.SUCCEEDED,
        stripePaymentIntentId: paymentIntent.id,
        stripeCustomerId: subscription.customer as string,
        description: `Subscription payment for ${planId}`,
        paidAt: new Date(),
      },
    });
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  // Note: Stripe subscription object has dynamic properties not fully typed
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sub = subscription as any;
  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: sub.status === 'active' ? 'ACTIVE' : 'CANCELLED',
      currentPeriodStart: new Date(sub.current_period_start * 1000),
      currentPeriodEnd: new Date(sub.current_period_end * 1000),
      cancelAtPeriodEnd: sub.cancel_at_period_end,
    },
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
      endDate: new Date(),
    },
  });
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  // Note: Stripe invoice object has dynamic properties not fully typed
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const inv = invoice as any;
  const subscriptionId =
    typeof inv.subscription === 'string' ? inv.subscription : inv.subscription?.id;
  if (!subscriptionId) return;

  const subscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscriptionId },
  });

  if (subscription && inv.payment_intent) {
    await prisma.paymentTransaction.create({
      data: {
        userId: subscription.userId,
        subscriptionId: subscription.id,
        amount: (inv.amount_paid || 0) / 100,
        currency: (inv.currency || 'PKR').toUpperCase(),
        provider: PaymentProvider.STRIPE,
        status: PaymentStatus.SUCCEEDED,
        stripePaymentIntentId:
          typeof inv.payment_intent === 'string' ? inv.payment_intent : inv.payment_intent.id,
        stripeChargeId: typeof inv.charge === 'string' ? inv.charge : inv.charge?.id || null,
        stripeCustomerId:
          typeof inv.customer === 'string' ? inv.customer : inv.customer?.id || null,
        description: `Subscription renewal payment`,
        paidAt: new Date(),
      },
    });
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  // Note: Stripe invoice object has dynamic properties not fully typed
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const inv = invoice as any;
  const subscriptionId =
    typeof inv.subscription === 'string' ? inv.subscription : inv.subscription?.id;
  if (!subscriptionId) return;

  const subscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscriptionId },
  });

  if (subscription && inv.payment_intent) {
    await prisma.paymentTransaction.create({
      data: {
        userId: subscription.userId,
        subscriptionId: subscription.id,
        amount: (inv.amount_due || 0) / 100,
        currency: (inv.currency || 'PKR').toUpperCase(),
        provider: PaymentProvider.STRIPE,
        status: PaymentStatus.FAILED,
        stripePaymentIntentId:
          typeof inv.payment_intent === 'string' ? inv.payment_intent : inv.payment_intent.id,
        stripeCustomerId:
          typeof inv.customer === 'string' ? inv.customer : inv.customer?.id || null,
        description: `Failed subscription payment`,
        failedAt: new Date(),
      },
    });
  }
}
