# Billing System Setup Guide

This guide will help you set up the production-ready billing system with Stripe integration.

## Prerequisites

1. A Stripe account (sign up at https://stripe.com)
2. Stripe API keys (available in Stripe Dashboard)

## Environment Variables

Add the following environment variables to your `.env` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_... # Your Stripe secret key
STRIPE_WEBHOOK_SECRET=whsec_... # Webhook signing secret (get from Stripe Dashboard)
NEXT_PUBLIC_APP_URL=http://localhost:3000 # Your app URL (change for production)
```

## Database Migration

Run the Prisma migration to create the billing tables:

```bash
npm run prisma:migrate:dev
```

This will create:

- `SubscriptionPlan` - Available subscription plans
- `Subscription` - User subscriptions
- `PaymentTransaction` - Payment history

## Setting Up Stripe Products and Prices

1. Go to Stripe Dashboard → Products
2. Create 3 products matching your plans:

   - Basic Plan
   - Pro Plan
   - Enterprise Plan

3. For each product, create a recurring price:

   - Set billing period to "Monthly"
   - Set the price amount
   - Copy the Price ID (starts with `price_...`)

4. Update the database with Stripe Price IDs:

```sql
-- Example: Update Basic plan with Stripe Price ID
UPDATE "SubscriptionPlan"
SET "stripePriceId" = 'price_xxxxx'
WHERE "type" = 'BASIC';
```

Or use Prisma Studio:

```bash
npx prisma studio
```

## Setting Up Stripe Webhooks

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Set endpoint URL to: `https://yourdomain.com/api/stripe/webhook`
4. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the webhook signing secret and add it to `.env` as `STRIPE_WEBHOOK_SECRET`

## Seeding Subscription Plans

Create a seed script or manually insert plans:

```typescript
// Example: src/scripts/seed-plans.ts
import prisma from '@/shared/lib/prisma';

async function seedPlans() {
  await prisma.subscriptionPlan.createMany({
    data: [
      {
        name: 'Basic',
        type: 'BASIC',
        description: 'Perfect for getting started',
        price: 999,
        features: ['Up to 50 products', '5GB storage', 'Basic analytics'],
        maxProducts: 50,
        maxStorage: 5000,
      },
      {
        name: 'Pro',
        type: 'PRO',
        description: 'For growing businesses',
        price: 2499,
        features: ['Up to 500 products', '50GB storage', 'Advanced analytics', 'API access'],
        maxProducts: 500,
        maxStorage: 50000,
        apiAccess: true,
      },
      {
        name: 'Enterprise',
        type: 'ENTERPRISE',
        description: 'For large businesses',
        price: 4999,
        features: ['Unlimited products', 'Unlimited storage', 'All features', 'Priority support'],
        prioritySupport: true,
        analytics: true,
        apiAccess: true,
      },
    ],
  });
}
```

## Testing

### Test Mode

1. Use Stripe test mode keys (start with `sk_test_`)
2. Use test card numbers from Stripe documentation:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - 3D Secure: `4000 0025 0000 3155`

### Production Mode

1. Switch to live keys (start with `sk_live_`)
2. Update webhook endpoint to production URL
3. Test with real cards (small amounts recommended)

## Security Checklist

- ✅ All payment processing happens server-side
- ✅ Webhook signatures are verified
- ✅ User authentication required for all billing actions
- ✅ PCI compliance through Stripe (no card data stored)
- ✅ HTTPS required in production
- ✅ Environment variables secured
- ✅ Database indexes on payment fields

## Features

### For Users

- View pricing plans
- Subscribe to plans
- View billing history
- Manage subscription (via Stripe Customer Portal)
- Cancel subscription

### For Admins

- View all subscriptions
- Monitor payment transactions
- Handle failed payments
- Manage subscription plans

## API Routes

- `POST /api/stripe/checkout` - Create checkout session
- `POST /api/stripe/portal` - Create customer portal session
- `POST /api/stripe/webhook` - Handle Stripe webhooks

## Troubleshooting

### Webhook not receiving events

- Verify webhook URL is accessible
- Check webhook secret matches
- Review Stripe Dashboard → Webhooks → Events for errors

### Payment not processing

- Verify Stripe keys are correct
- Check Stripe Dashboard → Payments for errors
- Ensure webhook events are being received

### Subscription not updating

- Check webhook is configured correctly
- Verify webhook handler is processing events
- Check database for subscription records

## Support

For Stripe-specific issues, refer to:

- Stripe Documentation: https://stripe.com/docs
- Stripe Support: https://support.stripe.com
