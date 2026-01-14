/**
 * Extended Stripe types for better type safety
 * Eliminates the need for 'as any' type assertions
 */

import type Stripe from "stripe";

/**
 * Extended Subscription type with metadata
 */
export interface StripeSubscriptionExtended extends Stripe.Subscription {
  metadata: {
    userId?: string;
    planType?: string;
    customField?: string;
    [key: string]: string | undefined;
  };
}

/**
 * Extended Invoice type with custom fields
 */
export interface StripeInvoiceExtended extends Stripe.Invoice {
  metadata: {
    orderId?: string;
    userId?: string;
    invoiceType?: string;
    [key: string]: string | undefined;
  };
}

/**
 * Extended Customer type
 */
export interface StripeCustomerExtended extends Stripe.Customer {
  metadata: {
    userId?: string;
    accountType?: string;
    registrationDate?: string;
    [key: string]: string | undefined;
  };
}

/**
 * Extended Checkout Session type
 */
export interface StripeCheckoutSessionExtended extends Stripe.Checkout.Session {
  metadata: {
    orderId?: string;
    userId?: string;
    cartId?: string;
    [key: string]: string | undefined;
  };
}

/**
 * Extended Payment Intent type
 */
export interface StripePaymentIntentExtended extends Stripe.PaymentIntent {
  metadata: {
    orderId?: string;
    userId?: string;
    paymentType?: string;
    [key: string]: string | undefined;
  };
}

/**
 * Webhook event types with proper typing
 */
export type StripeWebhookEvent =
  | Stripe.Event
  | (Stripe.Event & {
      data: {
        object:
          | StripeSubscriptionExtended
          | StripeInvoiceExtended
          | StripePaymentIntentExtended;
      };
    });

/**
 * Type guard to check if subscription is extended type
 */
export function isExtendedSubscription(
  subscription: Stripe.Subscription,
): subscription is StripeSubscriptionExtended {
  return (
    "metadata" in subscription && typeof subscription.metadata === "object"
  );
}

/**
 * Type guard to check if invoice is extended type
 */
export function isExtendedInvoice(
  invoice: Stripe.Invoice,
): invoice is StripeInvoiceExtended {
  return "metadata" in invoice && typeof invoice.metadata === "object";
}

/**
 * Type guard to check if customer is extended type
 */
export function isExtendedCustomer(
  customer: Stripe.Customer | Stripe.DeletedCustomer,
): customer is StripeCustomerExtended {
  return !("deleted" in customer) && "metadata" in customer;
}

/**
 * Safe metadata accessor for Stripe objects
 */
export function getStripeMetadata<T extends Record<string, string | undefined>>(
  object: { metadata?: Stripe.Metadata } | null | undefined,
): T {
  return (object?.metadata || {}) as T;
}
