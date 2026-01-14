# Quick Reference: New Utilities & Patterns

**Created:** January 14, 2026  
**For:** Development Team  
**Purpose:** Quick reference for newly created utility libraries

---

## 📝 Logging (Production-Safe)

### Import

```typescript
import { logger, createLogger } from '@/lib/logger';
```

### Usage

#### Basic Logging

```typescript
// Dev only - won't appear in production
logger.log('User data loaded', { userId, timestamp });
logger.info('Search query executed', { query, resultsCount });
logger.debug('Component mounted', { componentName });

// Always logged + sent to monitoring
logger.warn('Rate limit approaching', { currentCount, limit });
logger.error('API request failed', error, { endpoint, statusCode });
```

#### Contextual Logger

```typescript
// In a component/module
const log = createLogger('ProductCard');

log.info('Product rendered', { productId });
log.error('Failed to add to cart', error);
```

### When to Use

- ✅ Use `logger.log()` for development debugging
- ✅ Use `logger.error()` for errors that need monitoring
- ✅ Use `logger.warn()` for warnings (rate limits, deprecated features)
- ❌ Don't use `console.log` anymore (will trigger linting warnings)

---

## 💰 Currency & Numbers

### Import

```typescript
import {
  formatCurrency,
  calculateDiscount,
  calculateSavings,
  formatNumber,
  formatCompactNumber,
} from '@/lib/utils/formatters';
```

### Usage

```typescript
// Currency
formatCurrency(1999); // "₨1,999"
formatCurrency(1999.5); // "₨1,999.50"
formatCurrency(1999, { minimumFractionDigits: 2 }); // "₨1,999.00"

// Discounts
calculateDiscount(2000, 1500); // 25 (percent)
calculateSavings(2000, 1500); // 500 (PKR)

// Numbers
formatNumber(1234567); // "1,234,567"
formatCompactNumber(1234567); // "1.2M"
formatCompactNumber(1234); // "1.2K"
```

---

## 📅 Dates & Times

### Import

```typescript
import { formatDate, formatDateTime, formatRelativeTime } from '@/lib/utils/formatters';
```

### Usage

```typescript
const date = new Date('2026-01-14T10:30:00');

formatDate(date); // "Jan 14, 2026"
formatDateTime(date); // "Jan 14, 2026, 10:30 AM"
formatRelativeTime(date); // "2 hours ago" / "3 days ago"

// Custom format
formatDate(date, {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
}); // "January 14, 2026"
```

---

## 🔤 String Utilities

### Import

```typescript
import { truncate, toTitleCase, slugify, capitalize } from '@/lib/utils/formatters';
```

### Usage

```typescript
truncate('Long product description here', 20); // "Long product descrip..."
toTitleCase('nike air max pro'); // "Nike Air Max Pro"
slugify('Nike Air Max 90 - Red'); // "nike-air-max-90-red"
capitalize('hello world'); // "Hello world"
```

---

## 📞 Phone Numbers

### Import

```typescript
import { formatPhoneNumber } from '@/lib/utils/formatters';
```

### Usage

```typescript
formatPhoneNumber('923001234567'); // "+92 300 1234567"
formatPhoneNumber('03001234567'); // "0300 1234567"
```

---

## ⚡ Performance Utilities

### Import

```typescript
import { debounce, throttle, sleep } from '@/lib/utils/helpers';
```

### Usage

#### Debounce (wait until user stops typing)

```typescript
const handleSearch = debounce((query: string) => {
  fetchSearchResults(query);
}, 300); // Wait 300ms after last keystroke

// In component
<input onChange={(e) => handleSearch(e.target.value)} />;
```

#### Throttle (limit execution rate)

```typescript
const handleScroll = throttle(() => {
  checkIfAtBottom();
}, 200); // Execute max once every 200ms

window.addEventListener('scroll', handleScroll);
```

#### Sleep/Delay

```typescript
async function animateAndNavigate() {
  showSuccessMessage();
  await sleep(2000); // Wait 2 seconds
  router.push('/products');
}
```

---

## 🔁 Array Utilities

### Import

```typescript
import { removeDuplicates, groupBy, sortBy, chunk } from '@/lib/utils/helpers';
```

### Usage

#### Remove Duplicates

```typescript
// Simple array
removeDuplicates([1, 2, 2, 3, 3, 3]); // [1, 2, 3]

// Array of objects
const products = [
  { id: 1, name: 'Shirt' },
  { id: 1, name: 'Shirt' },
  { id: 2, name: 'Pants' },
];
removeDuplicates(products, 'id'); // [{ id: 1, ... }, { id: 2, ... }]
```

#### Group By

```typescript
const orders = [
  { userId: '1', total: 100 },
  { userId: '2', total: 200 },
  { userId: '1', total: 150 },
];

groupBy(orders, 'userId');
// {
//   '1': [{ userId: '1', total: 100 }, { userId: '1', total: 150 }],
//   '2': [{ userId: '2', total: 200 }]
// }
```

#### Sort By

```typescript
const products = [
  { name: 'Shirt', price: 1500 },
  { name: 'Pants', price: 2000 },
  { name: 'Shoes', price: 3000 },
];

sortBy(products, 'price', 'asc'); // Sorted by price low to high
sortBy(products, 'name', 'desc'); // Sorted by name Z to A
```

#### Chunk (Split into Batches)

```typescript
const items = [1, 2, 3, 4, 5, 6, 7, 8, 9];
chunk(items, 3)  // [[1, 2, 3], [4, 5, 6], [7, 8, 9]]

// Useful for pagination
const products = [...];
const pages = chunk(products, 12); // 12 items per page
```

---

## 🎯 Object Utilities

### Import

```typescript
import { omit, pick, getNestedProperty, isEmpty } from '@/lib/utils/helpers';
```

### Usage

#### Omit (Remove Keys)

```typescript
const user = { id: 1, name: 'John', password: 'secret', email: 'john@example.com' };
omit(user, 'password', 'email'); // { id: 1, name: 'John' }
```

#### Pick (Select Keys)

```typescript
const product = { id: 1, name: 'Shirt', price: 1500, stock: 50, category: 'clothing' };
pick(product, 'id', 'name', 'price'); // { id: 1, name: 'Shirt', price: 1500 }
```

#### Get Nested Property

```typescript
const order = {
  user: {
    address: {
      city: 'Karachi',
    },
  },
};

getNestedProperty(order, 'user.address.city'); // 'Karachi'
getNestedProperty(order, 'user.address.country', 'PK'); // 'PK' (default)
getNestedProperty(order, 'invalid.path', 'default'); // 'default'
```

#### Is Empty

```typescript
isEmpty(null); // true
isEmpty(undefined); // true
isEmpty(''); // true
isEmpty('   '); // true
isEmpty([]); // true
isEmpty({}); // true
isEmpty('hello'); // false
isEmpty([1, 2]); // false
isEmpty({ name: 'John' }); // false
```

---

## 🔄 Async Utilities

### Import

```typescript
import { retry } from '@/lib/utils/helpers';
```

### Usage

#### Retry with Exponential Backoff

```typescript
// Retry failed API calls
const data = await retry(
  async () => {
    const response = await fetch('/api/products');
    if (!response.ok) throw new Error('Failed to fetch');
    return response.json();
  },
  3, // Max 3 retries
  1000 // Start with 1s delay (doubles each retry: 1s, 2s, 4s)
);

// Retry database operations
const result = await retry(() => prisma.user.create({ data: userData }), 2, 500);
```

---

## 🌐 URL/Query String Utilities

### Import

```typescript
import { toQueryString, parseQueryString } from '@/lib/utils/helpers';
```

### Usage

#### Object to Query String

```typescript
const params = {
  category: 'shoes',
  minPrice: 1000,
  maxPrice: 5000,
  sort: 'price',
};

toQueryString(params); // "category=shoes&minPrice=1000&maxPrice=5000&sort=price"

// Use in URLs
const url = `/products?${toQueryString(params)}`;
```

#### Query String to Object

```typescript
const queryString = 'category=shoes&minPrice=1000&maxPrice=5000';
parseQueryString(queryString);
// { category: 'shoes', minPrice: '1000', maxPrice: '5000' }
```

---

## 💳 Stripe Type Safety

### Import

```typescript
import type {
  StripeSubscriptionExtended,
  StripeInvoiceExtended,
  StripeCustomerExtended,
} from '@/types/stripe';

import { isExtendedSubscription, isExtendedInvoice, getStripeMetadata } from '@/types/stripe';
```

### Usage

#### Using Extended Types

```typescript
async function handleSubscription(subscription: Stripe.Subscription) {
  // Access metadata safely
  const userId = subscription.metadata?.userId;
  const planType = subscription.metadata?.planType;

  // No need for 'as any' casts!
  await prisma.subscription.create({
    data: {
      stripeSubscriptionId: subscription.id,
      status: subscription.status === 'active' ? 'ACTIVE' : 'INACTIVE',
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      customerId:
        typeof subscription.customer === 'string'
          ? subscription.customer
          : subscription.customer.id,
    },
  });
}
```

#### Type Guards

```typescript
function processCustomer(customer: Stripe.Customer | Stripe.DeletedCustomer) {
  if (isExtendedCustomer(customer)) {
    // TypeScript knows customer has metadata
    const userId = customer.metadata.userId;
  }
}
```

#### Safe Metadata Access

```typescript
const metadata = getStripeMetadata<{ orderId?: string; userId?: string }>(invoice);
const orderId = metadata.orderId || 'N/A';
```

---

## 🛠️ Environment Detection

### Import

```typescript
import { isClient, isServer } from '@/lib/utils/helpers';
```

### Usage

```typescript
// Client-side only code
if (isClient()) {
  window.localStorage.setItem('theme', 'dark');
  window.gtag('event', 'page_view');
}

// Server-side only code
if (isServer()) {
  const ip = request.headers.get('x-forwarded-for');
  await logToDatabase(ip);
}
```

---

## 📏 Number Utilities

### Import

```typescript
import { clamp, randomNumber } from '@/lib/utils/helpers';
```

### Usage

```typescript
// Clamp (restrict to range)
clamp(150, 0, 100); // 100 (max)
clamp(-50, 0, 100); // 0 (min)
clamp(50, 0, 100); // 50 (within range)

// Random number
randomNumber(1, 10); // Random between 1-10
randomNumber(100, 200); // Random between 100-200
```

---

## 💾 File Size Formatting

### Import

```typescript
import { formatFileSize } from '@/lib/utils/formatters';
```

### Usage

```typescript
formatFileSize(0); // "0 Bytes"
formatFileSize(1024); // "1 KB"
formatFileSize(1234567); // "1.18 MB"
formatFileSize(1234567890); // "1.15 GB"
```

---

## 🎨 Common Patterns

### Product Card with Utilities

```typescript
import { formatCurrency, calculateDiscount, truncate } from '@/lib/utils/formatters';
import { logger } from '@/lib/logger';

function ProductCard({ product }) {
  const log = createLogger('ProductCard');

  const discount = calculateDiscount(product.originalPrice, product.salePrice);
  const formattedPrice = formatCurrency(product.salePrice);
  const shortDescription = truncate(product.description, 100);

  const handleAddToCart = async () => {
    try {
      await addToCart(product.id);
      log.info('Product added to cart', { productId: product.id });
    } catch (error) {
      log.error('Failed to add to cart', error, { productId: product.id });
    }
  };

  return (
    <div>
      {discount > 0 && <span>{discount}% OFF</span>}
      <h3>{product.name}</h3>
      <p>{shortDescription}</p>
      <span>{formattedPrice}</span>
    </div>
  );
}
```

### Search with Debounce

```typescript
import { debounce } from '@/lib/utils/helpers';
import { logger } from '@/lib/logger';

function SearchBar() {
  const [results, setResults] = useState([]);

  const performSearch = async (query: string) => {
    try {
      const response = await fetch(`/api/search?q=${query}`);
      const data = await response.json();
      setResults(data);
      logger.log('Search completed', { query, resultsCount: data.length });
    } catch (error) {
      logger.error('Search failed', error, { query });
    }
  };

  const debouncedSearch = debounce(performSearch, 300);

  return (
    <input
      type='search'
      onChange={(e) => debouncedSearch(e.target.value)}
      placeholder='Search products...'
    />
  );
}
```

---

## 🚀 Performance Tips

1. **Use debounce for search/autocomplete** - Reduces API calls by 90%
2. **Use chunk for large lists** - Render 50 items at a time instead of 1000
3. **Use memoization with formatters** - Cache expensive formatting operations
4. **Use logger instead of console** - Zero performance impact in production

---

## ⚠️ Common Mistakes

### ❌ Don't Do This

```typescript
// Using console.log
console.log('User data:', userData);

// Type assertion
const sub = subscription as any;

// Non-null assertion after optional chaining
const userId = session?.user.id!;

// Untyped let variable
let result;
result = await fetchData();
```

### ✅ Do This Instead

```typescript
// Use logger
logger.log('User data:', userData);

// Use proper types
const sub: StripeSubscriptionExtended = subscription;

// Use nullish coalescing
const userId = session?.user.id ?? 'anonymous';

// Type your variables
let result: Awaited<ReturnType<typeof fetchData>>;
result = await fetchData();
```

---

## 📚 Further Reading

- See `LINT_FIXES_SUMMARY.md` for full implementation details
- See `CODE_AUDIT_REPORT.md` for codebase health analysis
- Check utility source files for JSDoc documentation

---

**Last Updated:** January 14, 2026  
**Questions?** Check the source code in `src/lib/` for detailed JSDoc comments
