/**
 * Analytics and Event Tracking Utilities
 * Supports Google Analytics 4 and custom analytics endpoints
 */

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

export interface TrackingEvent {
  category: "engagement" | "conversion" | "performance" | "error";
  label?: string;
  value?: number | string;
  [key: string]: any;
}

const TRACKING_EVENTS = {
  // Homepage
  homepage_view: { category: "engagement" },
  hero_slide_click: { category: "engagement", label: "slide_index" },
  flash_sale_view: { category: "engagement" },
  flash_sale_click: { category: "conversion", label: "product_id" },

  // Product Interactions
  product_card_click: { category: "engagement", label: "product_id" },
  quick_view_open: { category: "engagement", label: "product_id" },
  add_to_cart: { category: "conversion", label: "product_id", value: "price" },
  add_to_wishlist: { category: "engagement", label: "product_id" },

  // Search
  search_query: { category: "engagement", label: "query_term" },
  search_suggestion_click: { category: "engagement", label: "suggestion" },

  // Navigation
  mega_menu_open: { category: "engagement", label: "category" },
  bottom_nav_click: { category: "engagement", label: "destination" },
  category_click: { category: "engagement", label: "category_name" },

  // Trust & Social Proof
  trust_badge_click: { category: "engagement", label: "badge_type" },
  live_notification_click: { category: "engagement" },

  // Plus Membership
  plus_banner_click: { category: "conversion" },
  plus_signup_start: { category: "conversion" },

  // Performance
  lcp: { category: "performance", value: "milliseconds" },
  fid: { category: "performance", value: "milliseconds" },
  cls: { category: "performance", value: "score" },
} as const;

export type TrackingEventName = keyof typeof TRACKING_EVENTS;

/**
 * Track an event with Google Analytics and custom backend
 */
export function trackEvent(
  eventName: TrackingEventName,
  params?: Record<string, any>,
) {
  // Google Analytics 4
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", eventName, {
      ...TRACKING_EVENTS[eventName],
      ...params,
      timestamp: new Date().toISOString(),
    });
  }

  // Custom analytics endpoint
  if (typeof window !== "undefined") {
    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: eventName,
        ...TRACKING_EVENTS[eventName],
        ...params,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        referrer: document.referrer,
      }),
    }).catch((error) => {
      console.error("Analytics tracking failed:", error);
    });
  }
}

/**
 * Track page view
 */
export function trackPageView(path?: string) {
  const pagePath =
    path || (typeof window !== "undefined" ? window.location.pathname : "/");

  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "page_view", {
      page_path: pagePath,
      page_title: document.title,
    });
  }

  trackEvent("homepage_view", { path: pagePath });
}

/**
 * Track Core Web Vitals
 */
export function trackWebVitals(metric: {
  name: string;
  value: number;
  rating: string;
  delta: number;
  id: string;
}) {
  const eventMap: Record<string, TrackingEventName> = {
    LCP: "lcp",
    FID: "fid",
    CLS: "cls",
  };

  const eventName = eventMap[metric.name];
  if (eventName) {
    trackEvent(eventName, {
      value: Math.round(metric.value),
      rating: metric.rating,
      delta: Math.round(metric.delta),
      id: metric.id,
    });
  }
}

/**
 * Track ecommerce events
 */
export function trackAddToCart(product: {
  id: string;
  name: string;
  price: number;
  category?: string;
  quantity?: number;
}) {
  trackEvent("add_to_cart", {
    product_id: product.id,
    product_name: product.name,
    value: product.price,
    currency: "PKR",
    category: product.category,
    quantity: product.quantity || 1,
  });

  // GA4 ecommerce event
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "add_to_cart", {
      currency: "PKR",
      value: product.price,
      items: [
        {
          item_id: product.id,
          item_name: product.name,
          price: product.price,
          quantity: product.quantity || 1,
        },
      ],
    });
  }
}

/**
 * Track search queries
 */
export function trackSearch(query: string, resultsCount?: number) {
  trackEvent("search_query", {
    query_term: query,
    results_count: resultsCount,
  });

  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "search", {
      search_term: query,
    });
  }
}

/**
 * Dispatch custom cart update event
 */
export function dispatchCartUpdate(count: number) {
  if (typeof window !== "undefined") {
    const event = new CustomEvent("cart-updated", {
      detail: { count },
    });
    window.dispatchEvent(event);
  }
}
