# 🚀 QUICK START GUIDE - Resellify Homepage Redesign

## ✅ What's Been Implemented

### **Phase 1 Components (Ready to Use)**

#### 1. Mobile Bottom Navigation ✓

- **File**: `src/shared/components/mobile/BottomNav.tsx`
- **Features**: 5-tab navigation (Home, Categories, Search, Cart, Account)
- **Cart Badge**: Real-time count with API integration
- **Auto-hides**: On desktop (>768px)

**Integration**: Already added to `src/app/(public)/layout.tsx`

---

#### 2. Trust Badges ✓

- **File**: `src/shared/components/trust/TrustBadges.tsx`
- **Variants**: Default (full), Compact, Inline
- **Usage**:

```tsx
import TrustBadges from '@/shared/components/trust/TrustBadges'

// Full version (homepage)
<TrustBadges />

// Compact version (header/footer)
<TrustBadges variant="compact" />
```

---

#### 3. Live Purchase Notifications ✓

- **File**: `src/shared/components/trust/LivePurchaseNotification.tsx`
- **Polls**: `/api/recent-purchases` every 30 seconds
- **Displays**: Real-time purchase notifications with city
- **Auto-dismisses**: After 5 seconds

**Integration**: Already added to `src/app/(public)/layout.tsx`

**API Endpoint**: `src/app/api/recent-purchases/route.ts` ✓

---

#### 4. Flash Sales Section ✓

- **Files**:
  - `src/domains/store/homePage/components/flashSales/FlashSaleSection.tsx`
  - `src/domains/store/homePage/components/flashSales/FlashSaleTimer.tsx`

**Features**:

- Countdown timer (days, hours, mins, secs)
- Auto-hides when expired
- Responsive grid (mobile/desktop)
- Horizontal scroll on desktop

**Usage**:

```tsx
import { FlashSaleSection } from '@/domains/store/homePage/components';

<FlashSaleSection
  deals={flashSaleProducts}
  endsAt={new Date('2026-01-15T23:59:59')}
  title='⚡ Flash Sale'
/>;
```

---

#### 5. Personalized Recommendations ✓

**A. Recently Viewed**

- **File**: `src/domains/store/homePage/components/recommendations/RecentlyViewed.tsx`
- **Storage**: LocalStorage (client-side)
- **Auto-loads**: Product details from `/api/products/bulk`

**Track Product Views** (add to product detail pages):

```tsx
import { useTrackProductView } from '@/domains/store/homePage/components/recommendations';

function ProductDetailPage({ productId }) {
  useTrackProductView(productId); // Automatically tracks
  // ... rest of component
}
```

**B. Trending in Your City**

- **File**: `src/domains/store/homePage/components/recommendations/TrendingInCity.tsx`
- **Props**: `city` (string), `products` (array)

---

#### 6. Skeleton Loaders ✓

- **File**: `src/shared/components/skeletons/index.tsx`
- **Available**:
  - `ProductCardSkeleton`
  - `ProductGridSkeleton`
  - `HeroSkeleton`
  - `FlashSaleSkeleton`
  - `CategoryListSkeleton`

**Usage**:

```tsx
import { Suspense } from 'react';
import { ProductGridSkeleton } from '@/shared/components/skeletons';

<Suspense fallback={<ProductGridSkeleton count={8} />}>
  <ProductList />
</Suspense>;
```

---

#### 7. Analytics & Tracking ✓

- **File**: `src/shared/lib/analytics.ts`

**Available Functions**:

```tsx
import {
  trackEvent,
  trackAddToCart,
  trackSearch,
  dispatchCartUpdate,
} from '@/shared/lib/analytics';

// Track generic events
trackEvent('flash_sale_click', { product_id: '123' });

// Track add to cart
trackAddToCart({
  id: '123',
  name: 'iPhone 14',
  price: 120000,
  category: 'Electronics',
});

// Track search
trackSearch('iphone 14', 25); // query, resultsCount

// Update cart badge
dispatchCartUpdate(5); // Updates bottom nav badge
```

**API Endpoint**: `src/app/api/analytics/track/route.ts` ✓

---

#### 8. Enhanced CSS Animations ✓

- **File**: `src/app/globals.css`

**Added Animations**:

- `animate-slide-in` - For notifications
- `animate-fade-in` - For lazy-loaded content
- `animate-shimmer` - For skeleton loaders
- `animate-scale-in` - For product cards
- `animate-bounce-in` - For badges
- `scrollbar-hide` - Hide scrollbars in horizontal scroll
- `smooth-scroll` - Smooth scrolling behavior

**Accessibility**: Auto-respects `prefers-reduced-motion`

---

## 🔧 TODO: Data Integration

### **1. Flash Sales Query** (Priority: P0)

**File to modify**: `src/app/(public)/page.tsx` (Line 34-54)

**Replace the mock function with**:

```typescript
async function getFlashSales() {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const flashSales = await prisma.product.findMany({
    where: {
      status: 'PUBLISHED',
      visibility: 'PUBLIC',
      productOffers: {
        some: {
          offer: {
            isActive: true,
            endsAt: {
              gte: now,
              lte: tomorrow, // Only shows sales ending in next 24 hours
            },
          },
        },
      },
    },
    select: {
      id: true,
      title: true,
      slug: true,
      basePrice: true,
      salePrice: true,
      images: {
        select: { path: true },
        take: 1,
      },
      productOffers: {
        where: {
          offer: { isActive: true, endsAt: { gte: now } },
        },
        select: {
          offer: {
            select: {
              endsAt: true,
              value: true,
              type: true,
            },
          },
        },
        take: 1,
      },
    },
    take: 12,
  });

  // Get the earliest end time for the timer
  const earliestEnd = flashSales.reduce((earliest, product) => {
    const offerEnd = product.productOffers[0]?.offer?.endsAt;
    if (!offerEnd) return earliest;
    return !earliest || offerEnd < earliest ? offerEnd : earliest;
  }, null as Date | null);

  return {
    deals: flashSales.map((p) => ({
      id: p.id,
      name: p.title,
      slug: p.slug,
      basePrice: p.basePrice,
      dealPrice: p.salePrice || p.basePrice,
      images: p.images,
    })),
    endsAt: earliestEnd || tomorrow,
  };
}
```

---

### **2. Trending in City Query** (Priority: P1)

**File to modify**: `src/app/(public)/page.tsx` (Line 56-72)

**Replace with**:

```typescript
async function getTrendingInCity(city: string) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Products with most visits from the specified city in last 7 days
  const trending = await prisma.product.findMany({
    where: {
      status: 'PUBLISHED',
      visibility: 'PUBLIC',
      visits: {
        some: {
          createdAt: { gte: sevenDaysAgo },
          // Assuming Visit model has city field
          // If not, you may need to join through User
        },
      },
    },
    select: {
      id: true,
      title: true,
      slug: true,
      basePrice: true,
      salePrice: true,
      images: {
        select: { path: true },
        take: 1,
      },
      categories: {
        select: {
          category: {
            select: { name: true },
          },
        },
        take: 1,
      },
      visits: {
        where: {
          createdAt: { gte: sevenDaysAgo },
        },
        select: { id: true },
      },
      reviews: {
        select: { rating: true },
      },
    },
    orderBy: {
      visits: { _count: 'desc' },
    },
    take: 10,
  });

  return trending.map((product) => ({
    id: product.id,
    name: product.title,
    slug: product.slug,
    basePrice: product.basePrice,
    dealPrice: product.salePrice || undefined,
    images: product.images,
    category: product.categories[0]?.category.name,
    rating: product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length || 0,
    reviewCount: product.reviews.length,
    visibility: 'PUBLIC' as const,
  }));
}
```

---

### **3. User City Detection** (Priority: P1)

**Install package**:

```bash
npm install @vercel/edge
```

**Create**: `src/shared/lib/geolocation.ts`

```typescript
import { geolocation } from '@vercel/edge';

export function getUserCity(request: Request): string {
  const geo = geolocation(request);

  // Return city if available, fallback to default
  return geo.city || 'Karachi';
}
```

**Or use IP-based solution**:

```typescript
// src/shared/lib/geolocation.ts
export async function getUserCityByIP(ip: string): Promise<string> {
  try {
    // Using ipapi.co (free tier: 1000 req/day)
    const response = await fetch(`https://ipapi.co/${ip}/json/`);
    const data = await response.json();

    const city = data.city;

    // Map to your supported cities
    if (['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi'].includes(city)) {
      return city;
    }

    return 'Karachi'; // Default
  } catch (error) {
    console.error('Geolocation error:', error);
    return 'Karachi';
  }
}
```

---

## 📊 Performance Optimizations

### **1. Image Optimization** (CRITICAL)

**Already configured** in your Next.js setup. Ensure all product images use Next.js `<Image>` component:

```tsx
import Image from 'next/image';

<Image
  src={product.image}
  alt={product.name}
  width={300}
  height={300}
  loading='lazy'
  quality={75}
  placeholder='blur'
  blurDataURL='/placeholder.jpg'
/>;
```

---

### **2. Convert Images to WebP** (CRITICAL)

**Run this script** to convert existing images:

```bash
npm install sharp
```

**Create**: `scripts/convert-to-webp.js`

```javascript
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const inputDir = './public/uploads/products';
const outputDir = './public/uploads/products/webp';

fs.mkdirSync(outputDir, { recursive: true });

fs.readdirSync(inputDir).forEach(async (file) => {
  if (file.match(/\.(jpg|jpeg|png)$/i)) {
    const input = path.join(inputDir, file);
    const output = path.join(outputDir, file.replace(/\.(jpg|jpeg|png)$/i, '.webp'));

    await sharp(input).webp({ quality: 80 }).toFile(output);

    console.log(`Converted: ${file}`);
  }
});
```

**Run**: `node scripts/convert-to-webp.js`

---

### **3. Dynamic Imports** (Already implemented in homepage)

For other pages, use:

```tsx
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <ComponentSkeleton />,
  ssr: false, // If client-side only
});
```

---

## 🎯 A/B Testing Setup

### **Install Optimizely or Vercel A/B Testing**

**Using Vercel Edge Config** (recommended):

```bash
npm install @vercel/edge-config
```

**Create**: `src/shared/lib/abtest.ts` (already created)

**Usage**:

```tsx
'use client';
import { useABTest } from '@/shared/lib/abtest';

export default function FlashSaleSection() {
  const variant = useABTest('flash_sale_layout', ['grid', 'carousel']);

  if (variant === 'grid') {
    return <GridLayout />;
  }

  return <CarouselLayout />;
}
```

---

## 📱 Mobile-Specific Testing Checklist

- [ ] Bottom navigation displays on mobile (<768px)
- [ ] Bottom navigation hides on desktop (>768px)
- [ ] Cart badge updates in real-time
- [ ] Touch gestures work in carousel
- [ ] Horizontal scroll works smoothly
- [ ] Trust badges stack properly on mobile
- [ ] Flash sale timer readable on small screens
- [ ] Product cards fit 2 columns on mobile

**Test Devices**: iPhone SE (375px), Android (360px), iPad (768px)

---

## 🔐 Security Considerations

### **1. Rate Limiting** (Add to API routes)

**Install**:

```bash
npm install @upstash/ratelimit @upstash/redis
```

**Add to `/api/recent-purchases/route.ts`**:

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '60 s'),
});

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'anonymous';
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  // ... rest of handler
}
```

---

### **2. Sanitize Analytics Data**

In `src/app/api/analytics/track/route.ts`, validate input:

```typescript
import { z } from 'zod';

const eventSchema = z.object({
  event: z.string().max(50),
  category: z.enum(['engagement', 'conversion', 'performance', 'error']),
  label: z.string().max(100).optional(),
  value: z.union([z.number(), z.string()]).optional(),
});

export async function POST(request: NextRequest) {
  const body = await request.json();

  // Validate
  const result = eventSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: 'Invalid event data' }, { status: 400 });
  }

  // ... continue
}
```

---

## 🚀 Deployment Checklist

### **Before Going Live**:

1. **Environment Variables** (.env.production)

   ```
   NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
   NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
   ```

2. **Build Check**

   ```bash
   npm run build
   npm run start # Test production build locally
   ```

3. **Lighthouse Audit** (Target scores)

   - Performance: >90
   - Accessibility: >95
   - Best Practices: >90
   - SEO: >90

4. **Core Web Vitals** (Target)

   - LCP: <2.5s
   - FID: <100ms
   - CLS: <0.1

5. **Test Flash Sale Timer**

   - Set test offer expiring in 5 minutes
   - Verify countdown accuracy
   - Check auto-hide when expired

6. **Test Social Proof Notifications**

   - Create test order
   - Verify notification appears
   - Check auto-dismiss timing

7. **Mobile Testing**

   - Test on real devices (not just Chrome DevTools)
   - Verify touch interactions
   - Check bottom navigation click targets

8. **Analytics Verification**
   - Open Google Analytics Real-Time
   - Trigger events (add to cart, search, click)
   - Verify events appear in GA

---

## 📞 Support & Next Steps

### **Week 1 Priorities** (This Week):

1. Integrate flash sales query with your Offer system
2. Set up geolocation for "Trending in City"
3. Convert existing product images to WebP
4. Test on mobile devices
5. Set up Google Analytics events

### **Week 2 Priorities** (Next Week):

1. Build mega-menu for header
2. Implement predictive search
3. Add quick-view modal to ProductCard
4. Set up A/B testing framework

### **Week 3 Priorities**:

1. Video commerce zone
2. Plus membership promotion banner
3. Advanced recommendations (ML-based)

---

## 🐛 Common Issues & Solutions

### **Issue: Bottom nav not showing**

**Solution**: Check browser width. It only shows on <768px. Use Chrome DevTools mobile view.

### **Issue: Cart badge not updating**

**Solution**: Ensure you're calling `dispatchCartUpdate(count)` after cart modifications.

### **Issue: Flash sale timer shows "Sale Ended" immediately**

**Solution**: Check `endsAt` date format. Must be valid Date object or ISO string.

### **Issue: Images not lazy loading**

**Solution**: Ensure using Next.js `<Image>` component, not `<img>` tag.

### **Issue: Analytics events not firing**

**Solution**: Check browser console. Install Google Tag Assistant Chrome extension.

---

## 📚 Additional Resources

- [Next.js Image Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/images)
- [Core Web Vitals](https://web.dev/vitals/)
- [Google Analytics 4 Events](https://developers.google.com/analytics/devguides/collection/ga4/events)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

**Questions?** Check the main implementation plan: `REDESIGN_IMPLEMENTATION_PLAN.md`

**Last Updated**: January 14, 2026
