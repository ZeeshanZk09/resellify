---
title: 'Resellify (GO Shop) — Complete Project Analysis Report'
subtitle: 'Comprehensive Technical Documentation & Architecture Analysis'
author: 'Project Analysis — Generated March 3, 2026'
date: 'March 3, 2026'
geometry: margin=1in
fontsize: 11pt
toc: true
toc-depth: 3
numbersections: true
header-includes:
  - \usepackage{longtable}
  - \usepackage{booktabs}
  - \usepackage{hyperref}
  - \usepackage{xcolor}
  - \definecolor{linkcolor}{HTML}{2563EB}
  - \hypersetup{colorlinks=true, linkcolor=linkcolor, urlcolor=linkcolor}
  - \usepackage{fancyhdr}
  - \pagestyle{fancy}
  - \fancyhead[L]{Resellify — Project Report}
  - \fancyhead[R]{\thepage}
  - \fancyfoot[C]{Confidential — For Internal Use Only}
  - \renewcommand{\arraystretch}{1.4}
---

\newpage

# Executive Summary

**Resellify** (publicly branded as **GO Shop**) is a full-stack, production-grade e-commerce platform built with modern web technologies. The platform enables an online reselling business model where products are sourced, curated, and sold directly to consumers with transparent pricing.

The application covers the complete e-commerce lifecycle: product catalog management, user authentication, shopping cart, order processing (including COD and Stripe payments), coupon/offer systems, subscription billing, admin dashboard, and analytics.

## Key Highlights

| Metric                  | Value                    |
| ----------------------- | ------------------------ |
| **Total Source Files**  | 314 TypeScript/TSX files |
| **Total Lines of Code** | ~141,783 lines           |
| **Database Models**     | 30+ Prisma models        |
| **API Endpoints**       | 15 REST API routes       |
| **Server Actions**      | 25+ action modules       |
| **Page Routes**         | 29 pages                 |
| **Database Migrations** | 33 migrations            |
| **Enums Defined**       | 14 enum types            |

## Technology Stack

| Layer                | Technology                   | Version    |
| -------------------- | ---------------------------- | ---------- |
| **Framework**        | Next.js                      | 16.1.1     |
| **UI Library**       | React                        | 19.2.1     |
| **Language**         | TypeScript                   | 5.9.3      |
| **ORM**              | Prisma                       | 7.2.0      |
| **Database**         | PostgreSQL (Neon Serverless) | —          |
| **Authentication**   | NextAuth.js (Auth.js)        | v5 beta.30 |
| **Payments**         | Stripe                       | 20.1.2     |
| **Styling**          | Tailwind CSS                 | 4.1.18     |
| **Validation**       | Zod                          | 4.2.0      |
| **Linter/Formatter** | Biome                        | 2.2.0      |
| **Charts**           | Recharts + Chart.js          | Latest     |
| **Search**           | Fuse.js (fuzzy search)       | 7.1.0      |
| **Email**            | Nodemailer                   | 7.0.11     |
| **Cloud Storage**    | AWS S3                       | —          |

\newpage

# Project Architecture

## Directory Structure Overview

The project follows a well-organized domain-driven architecture:

```
resellify/
├── prisma/                    # Database schema, migrations, seed
│   ├── schema.prisma          # 891 lines — 30+ models
│   ├── seed.ts                # Database seeding script
│   └── migrations/            # 33 migration files
├── public/                    # Static assets
│   ├── icons/                 # SVG icons
│   ├── images/                # Static images
│   └── uploads/products/      # Uploaded product images
├── src/
│   ├── auth.ts                # NextAuth configuration entry
│   ├── proxy.ts               # Middleware (route protection)
│   ├── actions/               # Server Actions (7,153 lines)
│   ├── app/                   # Next.js App Router pages (15,702 lines)
│   ├── domains/               # Domain-specific logic (5,858 lines)
│   ├── shared/                # Shared utilities & components (112,056 lines)
│   ├── lib/                   # Core library utilities (776 lines)
│   ├── type/                  # NextAuth type augmentation
│   └── types/                 # Stripe type definitions
├── package.json               # Dependencies & scripts
├── next.config.ts             # Next.js configuration
├── biome.json                 # Linter/formatter config
├── tsconfig.json              # TypeScript configuration
└── prisma.config.ts           # Prisma configuration
```

## Architecture Pattern

The project implements a **layered domain-driven architecture** within the Next.js App Router paradigm:

1. **Presentation Layer** (`src/app/`) — Page routes, layouts, and route-level components
2. **Domain Layer** (`src/domains/`) — Domain-specific business components organized by feature
3. **Action Layer** (`src/actions/`) — Server Actions handling business logic and database operations
4. **API Layer** (`src/app/api/`) — RESTful API endpoints for client-side consumption
5. **Shared Layer** (`src/shared/`) — Reusable components, hooks, utilities, types, and constants
6. **Data Layer** (`prisma/`) — Database schema, migrations, and seeding

\newpage

# Authentication & Authorization

## Authentication System

The application uses **NextAuth.js v5 (Auth.js)** with a dual-provider setup:

### Providers

1. **Google OAuth** — Social login via Google accounts
2. **Credentials** — Email/password authentication with bcryptjs hashing

### Session Strategy

- **JWT-based sessions** — Stateless tokens with `id` and `role` claims
- **PrismaAdapter** — Database-backed session management
- Custom JWT callback injects user `id` and `role` into the token
- Session callback attaches `id` and `role` for client-side access

### Authentication Flow

```
Registration:
  Email + Password → Zod Validation → bcrypt Hash → DB Insert
  → Send OTP (6-digit) via Nodemailer → Verify Email → Auto Login

Login:
  Step 1: Email Check → Verify user exists
  Step 2: Password Verify → bcrypt compare
  → Create Session → Set Cart Cookie → Redirect

Password Reset:
  Send OTP → Verify Code → Update Password (bcrypt hash)
```

### Email Verification

- 6-digit OTP codes generated and stored in `VerificationToken` model
- Sent via Gmail SMTP (Nodemailer) with HTML email templates
- OTP stored with expiration time for security

## Authorization

### Role-Based Access Control (RBAC)

Three user roles defined:

| Role        | Access Level                                               |
| ----------- | ---------------------------------------------------------- |
| **USER**    | Public storefront, cart, orders, profile, favourites       |
| **ADMIN**   | Full admin panel, product/order/user management, analytics |
| **SUPPORT** | Support-level access (extendable)                          |

### Route Protection

The middleware (`src/proxy.ts`) implements route-level protection:

- **Public Routes** — Homepage, shop, categories, pricing (accessible to all)
- **Auth Routes** — Sign-in, sign-up (redirects logged-in users)
- **Protected Routes** — Dashboard, admin panel (requires authentication)
- **API Auth Prefix** — `/api/auth/*` bypasses middleware

### Admin Authorization

Admin access is validated through:

- `authAdmin()` utility function — checks user role AND hardcoded admin email list
- API routes individually verify admin status before processing

\newpage

# Database Design

## Overview

The database uses **PostgreSQL** via **Neon Serverless** with the Prisma ORM. The schema contains **30+ models** organized into logical domains.

## Entity-Relationship Summary

### Core Entities

```
User ──┬── Address (1:N)
       ├── Cart (1:1) ── CartItem (1:N) ── Product
       ├── Order (1:N) ── OrderItem (1:N) ── Product
       ├── Favourite (M:N with Product)
       ├── Review (1:N)
       ├── Session (1:N)
       ├── Subscription (1:N) ── SubscriptionPlan
       └── PaymentTransaction (1:N)

Product ──┬── Upload/Images (1:N)
          ├── ProductVariant (1:N) ── VariantOption (M:N with Option)
          ├── ProductCategory (M:N with Category)
          ├── ProductTag (M:N with Tag)
          ├── ProductSpec (M:N with SpecGroup)
          ├── ProductOffer (M:N with Offer/Coupon)
          ├── Review (1:N)
          ├── StockLog (1:N)
          ├── Waitlist (1:N)
          └── Visit (1:N)

Category ──┬── Children Categories (self-referencing)
           ├── CategoryOptionSet (M:N with OptionSet)
           ├── Coupon (1:N)
           └── Offer (1:N)
```

## Enum Definitions

| Enum                     | Values                                                                                     | Purpose                         |
| ------------------------ | ------------------------------------------------------------------------------------------ | ------------------------------- |
| **OrderStatus**          | CREATED, PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED, RETURNED, REFUNDED | Order lifecycle management      |
| **PaymentMethod**        | JAZZCASH, COD, STRIPE, CARD                                                                | Supported payment methods       |
| **PaymentStatus**        | PENDING, SUCCEEDED, FAILED, REFUNDED                                                       | Payment state tracking          |
| **Role**                 | USER, ADMIN, SUPPORT                                                                       | User access control             |
| **ProductStatus**        | DRAFT, PUBLISHED, ARCHIVED, SCHEDULED                                                      | Product publishing workflow     |
| **Visibility**           | PUBLIC, PRIVATE, UNLISTED                                                                  | Product visibility control      |
| **CouponType**           | PERCENT, FIXED                                                                             | Coupon discount calculation     |
| **DiscountType**         | PERCENT, FLAT                                                                              | Discount type for offers        |
| **OptionType**           | TEXT, COLOR, NUMBER, SIZE, MEASURE, RANGE, BOOLEAN                                         | Product variant option types    |
| **OfferTarget**          | ALL_PRODUCTS, CATEGORY, PRODUCT                                                            | Offer scope definition          |
| **SubscriptionPlanType** | BASIC, PRO, ENTERPRISE                                                                     | Billing tier levels             |
| **SubscriptionStatus**   | ACTIVE, CANCELLED, EXPIRED, PAST_DUE, TRIALING                                             | Subscription lifecycle          |
| **PaymentProvider**      | STRIPE, JAZZCASH, COD                                                                      | Payment provider identification |
| **TwitterCard**          | SUMMARY, SUMMARY_LARGE_IMAGE, APP, PLAYER                                                  | SEO Twitter card types          |

## Key Data Models

### User Model

The User model is the central entity supporting:

- **Profile** — name, email, phone number, password (hashed)
- **Roles** — USER, ADMIN, SUPPORT with `isActive` and `isBlocked` flags
- **Plus Membership** — `isPlusMember` boolean with `plusUntil` expiry date for premium benefits
- **Relations** — Published products/brands, favourites, addresses, carts, orders, reviews, sessions, subscriptions

### Product Model

Comprehensive product entity with:

- **Core Fields** — title, description, basePrice, salePrice, slug (unique), SKU (unique)
- **Status Management** — DRAFT → PUBLISHED → ARCHIVED lifecycle with visibility control
- **Inventory** — stock count with low-stock threshold alerts
- **SEO Metadata** — metaTitle, metaDescription, Open Graph fields, Twitter Card, Schema.org structured data, canonical URL
- **Variant System** — ProductVariant with VariantOption mapping to Option/OptionSet
- **Social Proof** — averageRating, reviewCount, featured flag

### Order System

- **Order** — Links user, address, items with financial snapshots (subTotal, shipping, discount, tax, total)
- **OrderItem** — Snapshots product name, price, quantity at time of purchase (historical accuracy)
- **Payment** — Separate entity supporting JazzCash, COD, Stripe, Card
- **OrderLog** — Audit trail for status changes and admin actions

### Cart System

- Cart per user with `CartItem` snapshots storing price at time of addition
- Prevents price change issues between cart addition and checkout

### Coupon & Offer System

- **Coupons** — Global or product/category specific, PERCENT or FIXED, usage limits, per-user limits, first-order-only, minimum order value, stackable with priority
- **Offers** — Admin-created promotions targeting ALL_PRODUCTS, CATEGORY, or PRODUCT with date ranges
- **Loss Prevention** — `maxDiscount` field caps maximum discount amount

### Subscription & Billing

- **SubscriptionPlan** — BASIC, PRO, ENTERPRISE tiers with feature flags (maxProducts, maxStorage, prioritySupport, analytics, apiAccess)
- **Subscription** — User subscriptions with Stripe integration (subscriptionId, customerId, priceId)
- **PaymentTransaction** — Individual payment records with Stripe payment intent tracking

## Database Indexes

Strategic indexes are applied for query performance:

- User lookups: email (unique), phone (unique)
- Product search: title, status + visibility composite
- Order queries: userId, status
- Cart: userId (unique per user)
- Favourites: userId + productId composite unique
- Category: slug (unique)
- All foreign key relationships indexed

\newpage

# API Layer

## REST API Endpoints

The application exposes 15 API endpoints organized by domain:

### Authentication API

| Endpoint                  | Method    | Description                                                              |
| ------------------------- | --------- | ------------------------------------------------------------------------ |
| `/api/auth/[...nextauth]` | GET, POST | NextAuth.js catch-all handler for OAuth callbacks and session management |

### Product & Search APIs

| Endpoint             | Method | Auth | Description                                                                                                    |
| -------------------- | ------ | ---- | -------------------------------------------------------------------------------------------------------------- |
| `/api/products/bulk` | POST   | No   | Fetch multiple products by ID array, returns transformed ProductCard data with images, categories, and ratings |
| `/api/search`        | GET    | No   | Full-text fuzzy search using Fuse.js across products and categories                                            |

### Cart API

| Endpoint          | Method | Auth     | Description                                                            |
| ----------------- | ------ | -------- | ---------------------------------------------------------------------- |
| `/api/cart/count` | GET    | Optional | Returns cart item count for authenticated user (0 for unauthenticated) |

### Analytics & Social Proof

| Endpoint                | Method | Auth | Description                                                                |
| ----------------------- | ------ | ---- | -------------------------------------------------------------------------- |
| `/api/analytics/track`  | POST   | No   | Receives frontend analytics events for tracking                            |
| `/api/recent-purchases` | GET    | No   | Returns anonymized recent orders (last 24h) for social proof notifications |

### Stripe Billing APIs

| Endpoint               | Method | Auth             | Description                                                                                    |
| ---------------------- | ------ | ---------------- | ---------------------------------------------------------------------------------------------- |
| `/api/stripe/checkout` | POST   | Yes              | Creates Stripe checkout session for subscription plans                                         |
| `/api/stripe/portal`   | POST   | Yes              | Creates Stripe billing portal session for subscription management                              |
| `/api/stripe/webhook`  | POST   | Stripe Signature | Webhook handler for Stripe events (checkout completed, subscription updates, invoice payments) |

### Admin APIs

| Endpoint                | Method           | Auth  | Description                                                                       |
| ----------------------- | ---------------- | ----- | --------------------------------------------------------------------------------- |
| `/api/admin/users`      | GET              | Admin | Paginated user listing with search, role, active/blocked filters                  |
| `/api/admin/orders`     | GET              | Admin | Order management — single order detail or paginated list with status/date filters |
| `/api/admin/invoices`   | GET              | Admin | Invoice listing — order data formatted as invoices                                |
| `/api/admin/coupons`    | GET              | Admin | Coupon CRUD with search, type/active filters, pagination                          |
| `/api/admin/offers`     | GET              | Admin | Offer management with search, offType, active filters                             |
| `/api/admin/categories` | GET, PUT, DELETE | Admin | Category CRUD — list all, update by ID, delete by ID                              |

\newpage

# Server Actions (Business Logic)

## Overview

Server Actions are the primary business logic layer, handling data mutations and complex operations. Total: **7,153 lines** across **25+ modules**.

## Authentication Actions

| Module                    | Functions                                                       | Description                                                                                                                         |
| ------------------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `auth/login.ts`           | `checkEmail()`, `login()`                                       | Two-step login: email verification → password authentication. Manages sessions, carts, cookies. Triggers OTP for unverified emails. |
| `auth/register.ts`        | `registerUser()`, `verifyEmail()`                               | Registration with Zod validation, OTP email verification, password hashing (bcryptjs), session + cart creation, auto-login          |
| `auth/resset-password.ts` | `sendCodeForPasswordReset()`, `verifyCode()`, `resetPassword()` | Complete password reset flow: send OTP → verify → update                                                                            |
| `send-verification.ts`    | `sendVerification()`                                            | Generates 6-digit OTP, stores in DB, sends via Gmail SMTP with HTML template                                                        |

## Product Management Actions

| Module                     | Functions                                                                                                                                                                         | Lines | Description                                                                                           |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | ----------------------------------------------------------------------------------------------------- |
| `product/product.ts`       | `addProduct()`, `getAllProducts()`, `getProductBySlug()`, `getRelatedProducts()`, `getInitialProducts()`, `loadMoreProducts()`, `getCategoryProducts()`, `searchProductByQuery()` | 1,906 | Core product CRUD with image handling, variant management, SEO metadata, pagination, and fuzzy search |
| `product/product-image.ts` | `uploadImage()`                                                                                                                                                                   | 231   | Image upload with Sharp processing for products and brands. Admin-only. Saves to public/uploads/      |

## Cart Actions

| Module    | Functions                                                                                                            | Description                                                                                            |
| --------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `cart.ts` | `createCart()`, `getCartByUserId()`, `addItemToCart()`, `updateCartItem()`, `removeItemFromCart()`, `getCartItems()` | Full cart CRUD. Cookie-based cart identification. Auto-increment for duplicate items. Price snapshots. |

## Order Actions

| Module     | Functions                                                 | Lines | Description                                                                                                                                                               |
| ---------- | --------------------------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `order.ts` | `createOrder()`, `getMyOrders()`, `generateOrderNumber()` | 450   | Order creation for "Buy Now" and cart checkout. Unique order number generation (ORD-YYYYMMDD-XXXX). Address ownership validation. Prisma transactions for data integrity. |

## Billing & Subscription Actions

| Module                    | Functions                                                                                            | Lines | Description                                                                     |
| ------------------------- | ---------------------------------------------------------------------------------------------------- | ----- | ------------------------------------------------------------------------------- |
| `billing/stripe.ts`       | `createCheckoutSession()`, `createPortalSession()`, `handleStripeWebhook()`                          | 317   | Full Stripe integration: checkout, portal, webhook processing for subscriptions |
| `billing/subscription.ts` | `getSubscriptionPlans()`, `getUserSubscription()`, `getUserBillingHistory()`, `cancelSubscription()` | —     | Subscription lifecycle management                                               |

## Category & Taxonomy Actions

| Module                        | Functions                                                                                             | Lines | Description                                                                        |
| ----------------------------- | ----------------------------------------------------------------------------------------------------- | ----- | ---------------------------------------------------------------------------------- |
| `category/category.ts`        | `getCategories()`, `addCategory()`, `updateCategory()`, `deleteCategory()`, `getCategoryBySlugPath()` | 445   | Full category CRUD with hierarchical parent/child relationships and Zod validation |
| `category/categoryOptions.ts` | `getOptionSetByCatID()` + option set/spec group CRUD                                                  | 513   | Option set management (Size, Color, Fabric, Fit) linked to categories              |
| `category/specifications.ts`  | `getCategorySpecs()`                                                                                  | —     | Traverses category hierarchy to collect specification groups                       |

## Other Business Actions

| Module                           | Functions                                                                              | Description                                                                |
| -------------------------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `favourite.ts`                   | `toggleFavProduct()`, `getFavProduct()`, `getFavProducts()`                            | Wishlist toggle with upsert pattern                                        |
| `address.ts`                     | `getAddress()`, `createAddressAction()`, `deleteAddressAction()`                       | Address CRUD with FormData support and default address handling            |
| `brands/brands.ts`               | `addBrand()`, `getAllBrands()`, `deleteBrand()`, `updateBrand()`                       | Brand management with logo upload                                          |
| `reviews/review.ts`              | `createReview()`, `getReviews()`                                                       | Product reviews with automatic rating recalculation                        |
| `admin/dashboard.ts`             | `getAdminDashboard()`, `getStoreDashboard()`                                           | Dashboard data aggregation: orders, revenue, products, ratings             |
| `admin/users.ts`                 | `getUsers()`, `toggleUserActive()`                                                     | Admin user management: listing, search, activation control                 |
| `profile/*.ts`                   | `updateProfile()`, `updateEmail()`, `updatePassword()`, `deleteAccount()`, `getUser()` | Complete profile management suite                                          |
| `pageVisit/pageVisitServices.ts` | `addVisit()`                                                                           | Analytics tracking with user/IP deduplication                              |
| `landing-dashboard/dashboard.ts` | `getHome()`                                                                            | Homepage data: category offers, flash deals, featured products (571 lines) |
| `global-search.ts`               | `globalSearch()`                                                                       | Server-side fuzzy search across products and categories                    |

\newpage

# Frontend Architecture

## Page Routes

The application has **29 page routes** organized into four route groups:

### Public Storefront (14 pages)

| Route                                        | Description                                                                                  |
| -------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `/`                                          | Homepage — hero slider, flash sales, category showcases, product recommendations, deal cards |
| `/shop`                                      | Product listing page with filters, sorting, pagination                                       |
| `/shop/[slug]`                               | Single product detail — gallery, specs, reviews, related products, add-to-cart               |
| `/category/[categorySlug]`                   | Category product listing with filters                                                        |
| `/category/[categorySlug]/[subcategorySlug]` | Subcategory product listing                                                                  |
| `/bag`                                       | Shopping bag/cart page                                                                       |
| `/checkout`                                  | Checkout with address selection, payment method, order summary                               |
| `/order-confirmation`                        | Order confirmation and receipt                                                               |
| `/my-orders`                                 | User order history and tracking                                                              |
| `/favourites`                                | Wishlist/favourites page                                                                     |
| `/address`                                   | Address management (add, edit, delete, set default)                                          |
| `/pricing`                                   | Subscription plans and pricing display                                                       |
| `/pricing/checkout`                          | Subscription checkout via Stripe                                                             |
| `/pricing/success`                           | Subscription success confirmation                                                            |

### Authentication (6 pages)

| Route                          | Description                                 |
| ------------------------------ | ------------------------------------------- |
| `/auth/sign-in`                | Login page (email → password two-step flow) |
| `/auth/sign-in/factor-one`     | OTP verification during login               |
| `/auth/sign-in/reset-password` | Password reset with OTP                     |
| `/auth/sign-up`                | Registration page                           |
| `/auth/sign-up/verify-email`   | Email verification after registration       |
| `/auth/error`                  | Authentication error display                |

### Admin Panel (8 pages)

| Route                      | Description                                                       |
| -------------------------- | ----------------------------------------------------------------- |
| `/admin`                   | Admin dashboard overview — orders, revenue, product stats, charts |
| `/admin/add-product`       | Product creation form with variants, specs, images, SEO           |
| `/admin/manage-product`    | Product listing and management                                    |
| `/admin/manage-categories` | Category tree management                                          |
| `/admin/users`             | User listing with search, filter, activate/block                  |
| `/admin/orders`            | Order management with status updates                              |
| `/admin/coupons`           | Coupon creation and management                                    |
| `/admin/invoices`          | Invoice listing and details                                       |

### User Dashboard (1 page)

| Route        | Description              |
| ------------ | ------------------------ |
| `/dashboard` | Protected user dashboard |

## Domain Components

The application organizes UI components into **three domains** (5,858 lines total):

### Admin Domain (`src/domains/admin/`)

- **AdminSidebar** — Navigation sidebar with links to Categories, Products, Brands, Traffic View
- **Product Forms** — Multi-step product creation/editing with variant configuration
- **Product List Items** — Admin product row display with status badges
- **Category Management** — Add/edit category groups with row display

### Product Domain (`src/domains/product/`)

- **ProductCard** — Full-featured card with favourite toggle, add-to-cart, discount badges, rating stars, image preview
- **Gallery** — Product image gallery with thumbnail sidebar, main image display, and zoom overlay
- **ProductBoard** — Product detail panel with price display, star ratings, quantity selector, add-to-cart, wishlist toggle

### Store Domain (`src/domains/store/`)

Homepage components (11 sections):

- **Slider** — Hero banner carousel
- **Flash Sales** — Time-limited deal section
- **Categories** — Category showcase with icons
- **Recommendations** — Personalized product recommendations
- **Collection Cards** — Curated collection displays
- **Today Deal Card** — Daily deal highlight
- **Top Selling Products** — Best seller listing
- **Wide Card Row** — Full-width promotional cards
- **Marketing** — Marketing banner sections
- **Company Logo** — Partner/brand logo display

Shopping components:

- **Add To Cart Button** — Interactive cart button
- **Quantity Selector** — Increment/decrement quantity control
- **Shopping Cart** — Cart sidebar/page with item management

Shared store components:

- **Navbar** — Main navigation with search, cart count, user menu
- **Footer** — Site footer with links and information
- **Add Visit** — Visitor tracking component
- **Warning** — Alert/warning message display

## Shared Components Library

### shadcn/ui Components (19 components)

Based on Radix UI primitives with Tailwind CSS styling:

AlertDialog, Avatar, Badge, Button, Card, Dialog, DropdownMenu, ErrorAlert, Form, InputOTP, Input, Label, Select, Separator, Sonner (Toast), SuccessAlert, Switch, Tabs, Textarea

### Custom UI v2 Components (10 components)

Custom-designed component library:

Button, Checkbox, Dropdown, Input, LineList, Popup, PriceSlider, RadioButton, Skeleton, Table

### Utility Components

- **OrdersAreaChart** — Admin orders visualization (Recharts)
- **SearchInput** — Global search with autocomplete
- **AuthProvider** — NextAuth SessionProvider wrapper
- **ThemeProvider** — next-themes dark/light mode provider
- **ThemeSwitch** — Dark/light mode toggle
- **Skeletons** — Loading skeleton components for various content types

\newpage

# Styling & Theming

## CSS Architecture

- **Tailwind CSS v4** with PostCSS integration
- **tw-animate-css** for animation utilities
- Custom CSS variables using **oklch color space** for precise color control
- Dark theme by default with CSS custom properties

## Theme System

The application uses a comprehensive design token system:

- **Colors** — Background, foreground, card, popover, muted, border, primary, secondary, destructive, accent
- **Shadows** — Three shadow levels (sm, md, lg) using oklch transparency
- **Radius** — Configurable border radius scale (sm through 4xl)
- **Typography** — Inter font family with system fallbacks

## Color Palette

The default theme uses a dark color scheme:

- Background: `oklch(0.14 0.005 270)` (near black)
- Foreground: `oklch(0.98 0.003 270)` (near white)
- Primary: `oklch(0.922 0 0)` (light gray)
- Accent colors: Green (`#0b6b2e` dark, `#7be08a` light)

\newpage

# Configuration & Build

## Next.js Configuration

```typescript
const nextConfig: NextConfig = {
  experimental: { globalNotFound: true },
  reactCompiler: true, // React Compiler enabled
  typescript: { ignoreBuildErrors: true },
};
```

Key features:

- **React Compiler** — Automatic memoization (no manual useMemo/useCallback needed)
- **Global Not Found** — Custom 404 handling via `global-not-found.tsx`
- **TypeScript build errors ignored** — Allows deployment with type warnings

## TypeScript Configuration

- **Target:** ES2017
- **Module Resolution:** Bundler (modern Next.js style)
- **Strict Mode:** Enabled
- **Path Aliases:** `@/*` maps to `./src/*`
- **JSX:** react-jsx (automatic runtime)

## Biome Configuration

Linting and formatting with:

- **Indentation:** 2 spaces
- **Rules enforced:**
  - No unused imports (error)
  - No unused variables (error)
  - No explicit any (error)
  - No console (warn)
  - Use template literals (warn)
- **Domain rules:** Next.js and React recommended rules enabled

## Package Scripts

| Script               | Command                  | Description              |
| -------------------- | ------------------------ | ------------------------ |
| `dev`                | `next dev`               | Start development server |
| `build`              | `next build`             | Production build         |
| `start`              | `next start`             | Start production server  |
| `lint`               | `biome check`            | Run linter               |
| `format`             | `biome format --write`   | Auto-format code         |
| `prisma:migrate:dev` | `npx prisma migrate dev` | Run database migrations  |
| `prisma:generate`    | `npx prisma generate`    | Generate Prisma client   |

\newpage

# Payment & Billing System

## Payment Methods

The platform supports multiple payment methods:

| Method                     | Implementation                                       | Status  |
| -------------------------- | ---------------------------------------------------- | ------- |
| **Stripe**                 | Full integration (checkout, webhooks, subscriptions) | Active  |
| **COD (Cash on Delivery)** | Order placed with PENDING payment status             | Active  |
| **JazzCash**               | Enum defined, integration ready                      | Planned |
| **Card**                   | Via Stripe payment gateway                           | Active  |

## Stripe Integration

### Checkout Flow

1. User selects subscription plan → Frontend calls `/api/stripe/checkout`
2. Server creates Stripe Checkout Session with plan's `stripePriceId`
3. User redirected to Stripe Checkout → completes payment
4. Stripe sends webhook to `/api/stripe/webhook`
5. Server processes `checkout.session.completed` event
6. Subscription and PaymentTransaction records created in database

### Webhook Events Handled

| Event                           | Action                                            |
| ------------------------------- | ------------------------------------------------- |
| `checkout.session.completed`    | Create subscription, update user status           |
| `customer.subscription.updated` | Update subscription details, plan changes         |
| `customer.subscription.deleted` | Mark subscription cancelled, update user          |
| `invoice.payment_succeeded`     | Record successful payment transaction             |
| `invoice.payment_failed`        | Record failed payment, update subscription status |

### Billing Portal

Users can manage subscriptions through Stripe's hosted billing portal, accessed via `/api/stripe/portal`.

## Subscription Plans

Three tiers with configurable features:

| Feature          | Basic   | Pro    | Enterprise |
| ---------------- | ------- | ------ | ---------- |
| Max Products     | Limited | Higher | Unlimited  |
| Max Storage      | Limited | Higher | Unlimited  |
| Priority Support | No      | Yes    | Yes        |
| Analytics        | No      | Yes    | Yes        |
| API Access       | No      | No     | Yes        |

\newpage

# Analytics & Monitoring

## Page Visit Tracking

- **Server-side tracking** via `addVisit()` action called from root layout
- **Deduplication** — Tracks by userId (authenticated) or IP address (anonymous)
- **Data captured:** path, referrer, IP, user agent, country, city, timestamp, metadata
- **Product visits** — Tracks visits to specific product pages for popularity metrics

## Client-Side Analytics

- **GA4-style event tracking** via `trackEvent()` and `trackPageView()`
- **Typed event names** covering engagement, conversion, and performance categories
- Custom analytics endpoint at `/api/analytics/track`

## Social Proof

- **Recent Purchases API** (`/api/recent-purchases`) — Returns anonymized orders from last 24 hours
- Used for live "Someone just bought..." notification popups

## Admin Dashboard Data

- **Order count and revenue** aggregation
- **Product statistics** — total products, average ratings
- **Orders area chart** — Visual order trends over time (Recharts)
- **User management metrics** — Active/blocked user counts

\newpage

# Search System

## Implementation

The application implements **fuzzy search** using **Fuse.js**:

### Server-Side Search (`globalSearch()`)

- Searches across **products** and **categories** simultaneously
- Weighted fields: title, description, slug, category names
- Returns ranked results with relevance scoring

### API Search Endpoint (`/api/search`)

- GET endpoint with query parameter
- Returns best matching products and categories
- Client-accessible for real-time search

### Product Search (`searchProductByQuery()`)

- Server action for product-specific search
- Returns `SearchProductResult` type with transformed data

\newpage

# Security Considerations

## Authentication Security

- **Password hashing** — bcryptjs with salt rounds
- **JWT sessions** — Stateless, server-validated tokens
- **OTP verification** — 6-digit codes with expiration for email verification and password reset
- **Route protection** — Middleware-level authentication checks
- **CSRF protection** — Built-in via NextAuth.js

## Authorization Security

- **Role-based access** — USER, ADMIN, SUPPORT roles enforced at action and API level
- **Admin verification** — Double-checked via role AND hardcoded admin email list
- **User status** — `isActive` and `isBlocked` flags for account control

## Data Security

- **Price snapshots** — CartItem and OrderItem store prices at time of action (prevents manipulation)
- **Address ownership** — Orders validate address belongs to the user
- **Coupon limits** — Usage limits, per-user limits, maxDiscount cap for loss prevention
- **Stripe webhook verification** — Signature validation for all webhook events

## Input Validation

- **Zod schemas** — Server-side validation for all form inputs
- **Type safety** — Full TypeScript coverage with strict mode
- **SQL Injection prevention** — Prisma ORM parameterized queries

\newpage

# SEO Implementation

## Metadata Configuration

The application implements comprehensive SEO:

### Global Metadata (Root Layout)

- **Title template:** `%s | GO Shop` with default homepage title
- **Description:** Product-focused meta description
- **Keywords:** E-commerce related keywords for Pakistan market
- **Open Graph:** Full OG tags with image, locale (en_PK), site name
- **Twitter Card:** summary_large_image with dedicated title and description
- **Robots:** index, follow with Google Bot specific directives
- **Canonical URL:** Configured via metadataBase

### Product-Level SEO

Each product supports:

- Custom metaTitle, metaDescription, metaKeywords
- Canonical URL override
- Open Graph title, description, and image
- Twitter Card configuration
- **Schema.org Structured Data** — JSON-LD product schema via `generateProductStructuredData()`
- Locale and translation support fields

## Structured Data

Product structured data generation includes:

- Schema.org Product type
- Name, description, image, SKU
- Brand and category
- Price with currency (PKR)
- Availability based on inventory
- Aggregate rating from reviews

\newpage

# Database Migration History

The project has undergone **33 migrations** documenting the schema evolution:

| Date       | Migration                                    | Description                                            |
| ---------- | -------------------------------------------- | ------------------------------------------------------ |
| 2025-12-15 | `auth_management`                            | Initial auth models (User, Session, VerificationToken) |
| 2025-12-15 | (unnamed)                                    | Schema refinements                                     |
| 2025-12-15 | `added_columns`                              | Additional user/session columns                        |
| 2025-12-15 | `cuid_added`                                 | Switch to CUID for IDs                                 |
| 2025-12-15 | `product_schema_added`                       | Product, Category, Tag, Cart, Order models             |
| 2025-12-16 | `identifer_will_be_unique`                   | Unique constraint on identifier                        |
| 2025-12-16 | `user_updated`                               | User model enhancements                                |
| 2025-12-17 | `new_columns_added`                          | Additional columns across models                       |
| 2025-12-17 | `verfication_token`                          | Verification token model                               |
| 2025-12-17 | `identifier_will_be_unique`                  | Identifier uniqueness enforcement                      |
| 2025-12-18 | `brand_added`                                | Brand model introduction                               |
| 2025-12-18 | `brand_schema_improved`                      | Brand schema refinements                               |
| 2025-12-18 | `brand_relate_with_upload_model`             | Brand-Upload relationship                              |
| 2025-12-20 | `is_expired_column_added`                    | Session expiry tracking                                |
| 2025-12-20 | `brand_name_will_be_unique`                  | Unique brand names                                     |
| 2025-12-20 | `brand_logo_is_optional`                     | Logo field made optional                               |
| 2025-12-20 | `visit_table_related_with_product_id`        | Product visit tracking                                 |
| 2025-12-23 | `product_filter_and_offers_coupons_improved` | Filter system + coupon/offer models                    |
| 2025-12-25 | `changes_in_offer_coupon`                    | Offer/coupon improvements                              |
| 2025-12-26 | `sku_is_not_optional`                        | SKU made required                                      |
| 2025-12-26 | `visibility_default_status_changed`          | Default visibility changed                             |
| 2025-12-27 | `product_id_is_optional`                     | ProductId optional in some relations                   |
| 2026-01-02 | `user_is_optional`                           | User made optional in some models                      |
| 2026-01-02 | `favourite_a_product_is_toggle_able`         | Favourite toggle functionality                         |
| 2026-01-02 | `product_and_user_ids_will_be_unique_in_fav` | Unique constraint on favourites                        |
| 2026-01-02 | `userid_will_be_unique_in_cart`              | Cart per user enforcement                              |
| 2026-01-02 | `user_id_will_not_be_unique`                 | Cart ID uniqueness adjustment                          |
| 2026-01-02 | (unnamed)                                    | Schema adjustment                                      |
| 2026-01-02 | `user_is_optional_in_address`                | Address without user support                           |
| 2026-01-05 | `remove_unique_constraint_on_product_id`     | Product ID constraint removal                          |
| 2026-01-13 | `billing_added`                              | Subscription, Plan, PaymentTransaction models          |

\newpage

# Database Seeding

The seed script (`prisma/seed.ts`) populates the database with essential reference data:

## Option Sets

| Option Set | Type  | Values                                                                                           |
| ---------- | ----- | ------------------------------------------------------------------------------------------------ |
| **Size**   | SIZE  | XXS, XS, S, M, L, XL, 2XL, 3XL                                                                   |
| **Color**  | COLOR | Black, White, Red, Green, Blue, Yellow, Orange, Purple, Pink, Grey, Brown, Navy (with hex codes) |
| **Fabric** | TEXT  | Cotton, Polyester, Silk, Linen, Denim, Wool, Fleece, Nylon, Rayon, Satin                         |
| **Fit**    | TEXT  | Slim Fit, Regular Fit, Loose Fit, Oversized                                                      |

## Category Hierarchy

```
Clothing
├── Men's Clothing
│   ├── T-Shirts
│   ├── Formal Shirts
│   ├── Casual Shirts
│   ├── Polo Shirts
│   ├── Jeans
│   ├── Trousers
│   ├── Shorts
│   ├── Hoodies
│   ├── Jackets
│   └── Sweatshirts
└── Women's Clothing
    ├── T-Shirts
    ├── Blouses
    ├── Dresses
    ├── Skirts
    ├── Jeans
    ├── Trousers
    ├── Leggings
    ├── Hoodies
    ├── Jackets
    └── Cardigans
```

Each category is linked to all four option sets for filtering capabilities.

\newpage

# Type System

## NextAuth Type Augmentation (`src/type/next-auth.ts`)

Extends default NextAuth types to include:

- **User** — Maps to full Prisma User model
- **Session** — Adds `id`, `role`, and `cartId` fields
- **JWT** — Adds `id` and `role` claims

## Stripe Types (`src/types/stripe.ts`)

Extended Stripe types for type-safe webhook handling:

- `StripeSubscriptionExtended` — Subscription with typed metadata
- `StripeInvoiceExtended` — Invoice with typed metadata
- `StripeCustomerExtended` — Customer with typed metadata
- `StripeCheckoutSessionExtended` — Session with typed metadata
- `StripePaymentIntentExtended` — Payment intent with typed metadata
- `StripeWebhookEvent` — Webhook event with typed data
- Type guard functions: `isExtendedSubscription()`, `isExtendedInvoice()`

## Shared Types (`src/shared/types/`)

Comprehensive type definitions for:

- **Product types** — TProduct, TProductBoard, TProductCard, TProductListItem, TAddProductFormValues
- **Cart types** — TCartItem, TCartItemData, TCartListItemDB
- **UI types** — TSlide, TBlogCard, TDropDown, TSingleOption
- **Category types** — TCategory (Prisma alias)
- **Brand types** — TBrand (Prisma alias)
- **Specification types** — TSpecGroup, TSingleSpec, TProductSpec

\newpage

# Dependencies Analysis

## Production Dependencies (48 packages)

### Core Framework

| Package           | Version | Purpose              |
| ----------------- | ------- | -------------------- |
| next              | 16.1.1  | React meta-framework |
| react / react-dom | 19.2.1  | UI library           |
| typescript        | 5.9.3   | Type-safe JavaScript |

### Database & ORM

| Package                  | Version | Purpose                 |
| ------------------------ | ------- | ----------------------- |
| @prisma/client           | 7.2.0   | Database ORM client     |
| @prisma/adapter-neon     | 7.1.0   | Neon serverless adapter |
| @prisma/adapter-pg       | 7.1.0   | PostgreSQL adapter      |
| @neondatabase/serverless | 1.0.2   | Neon serverless driver  |
| pg                       | 8.16.3  | PostgreSQL client       |

### Authentication

| Package                   | Version       | Purpose                    |
| ------------------------- | ------------- | -------------------------- |
| next-auth                 | 5.0.0-beta.30 | Authentication framework   |
| @auth/prisma-adapter      | 2.11.1        | Prisma adapter for Auth.js |
| @next-auth/prisma-adapter | 1.0.7         | Legacy Prisma adapter      |
| bcryptjs                  | 3.0.3         | Password hashing           |

### Payments

| Package           | Version | Purpose           |
| ----------------- | ------- | ----------------- |
| stripe            | 20.1.2  | Stripe server SDK |
| @stripe/stripe-js | 8.6.1   | Stripe client SDK |

### UI & Styling

| Package                  | Version | Purpose                             |
| ------------------------ | ------- | ----------------------------------- |
| tailwind-merge           | 3.4.0   | Tailwind class merging              |
| class-variance-authority | 0.7.1   | Variant-based styling               |
| clsx                     | 2.1.1   | Conditional class names             |
| lucide-react             | 0.561.0 | Icon library                        |
| @radix-ui/\*             | Various | Headless UI primitives (8 packages) |
| @mui/material            | 7.3.6   | Material UI components              |
| @emotion/react           | 11.14.0 | CSS-in-JS (MUI dependency)          |
| sonner                   | 2.0.7   | Toast notifications                 |
| next-themes              | 0.4.6   | Dark/light mode                     |
| react-loading-skeleton   | 3.5.0   | Loading skeletons                   |
| input-otp                | 1.4.2   | OTP input component                 |

### Data & Validation

| Package             | Version | Purpose                   |
| ------------------- | ------- | ------------------------- |
| zod                 | 4.2.0   | Schema validation         |
| @hookform/resolvers | 5.2.2   | Form validation resolvers |
| react-hook-form     | 7.70.0  | Form state management     |

### Charts & Analytics

| Package         | Version | Purpose                |
| --------------- | ------- | ---------------------- |
| recharts        | 3.6.0   | React charting library |
| chart.js        | 4.5.1   | Chart library          |
| react-chartjs-2 | 5.3.1   | React Chart.js wrapper |

### Utilities

| Package            | Version | Purpose                 |
| ------------------ | ------- | ----------------------- |
| fuse.js            | 7.1.0   | Fuzzy search            |
| date-fns           | 4.1.0   | Date manipulation       |
| nodemailer         | 7.0.11  | Email sending           |
| @aws-sdk/client-s3 | 3.948.0 | AWS S3 file uploads     |
| libphonenumber-js  | 1.12.31 | Phone number validation |
| ws                 | 8.18.3  | WebSocket support       |
| dotenv             | 17.2.3  | Environment variables   |

## Dev Dependencies (12 packages)

| Package                     | Version | Purpose                                  |
| --------------------------- | ------- | ---------------------------------------- |
| @biomejs/biome              | 2.2.0   | Linter and formatter                     |
| prisma                      | 7.2.0   | Prisma CLI                               |
| @tailwindcss/postcss        | 4.1.18  | Tailwind PostCSS plugin                  |
| tailwindcss                 | 4.1.18  | CSS framework                            |
| tsx                         | 4.21.0  | TypeScript execution                     |
| tw-animate-css              | 1.4.0   | Tailwind animations                      |
| babel-plugin-react-compiler | 1.0.0   | React Compiler babel plugin              |
| @types/\*                   | Various | TypeScript type definitions (6 packages) |

\newpage

# Identified Observations & Recommendations

## Strengths

1. **Modern Technology Stack** — Uses latest versions of Next.js 16, React 19, Prisma 7, and TypeScript 5.9
2. **Comprehensive Schema Design** — Well-normalized database with proper indexes, constraints, and audit logging
3. **Domain-Driven Organization** — Clear separation of concerns across domains, actions, and shared modules
4. **Type Safety** — Full TypeScript with strict mode, Zod validation, and custom type definitions
5. **SEO Implementation** — Complete SEO setup with structured data, Open Graph, and Twitter Cards
6. **Security Features** — Role-based access, price snapshots, input validation, webhook signature verification
7. **Scalable Architecture** — Serverless database (Neon), JWT sessions, modular design
8. **Developer Experience** — Biome for fast linting/formatting, path aliases, React Compiler

## Areas for Improvement

1. **TypeScript Build Errors** — `ignoreBuildErrors: true` in next.config.ts may hide type issues in production
2. **Duplicate Utilities** — `cn()` function exists in both `src/shared/lib/utils.ts` and `src/shared/utils/styling.ts`
3. **Hardcoded Admin Emails** — Admin verification includes hardcoded email list (should be database-driven)
4. **Console Logging** — Middleware logs `req.auth` to console (should be removed in production)
5. **Analytics Persistence** — `/api/analytics/track` endpoint has TODO for database persistence
6. **Legacy Code** — Some files contain commented-out code (e.g., `list/listServices.ts`)
7. **Dual Auth Adapters** — Both `@auth/prisma-adapter` and `@next-auth/prisma-adapter` are installed
8. **Dual UI Libraries** — Both shadcn/ui (Radix) and Material UI (@mui) are dependencies, increasing bundle size
9. **Test Coverage** — No test files or testing framework detected in the project
10. **Error Monitoring** — No error tracking service (Sentry, etc.) integration detected

## Recommended Next Steps

1. Enable TypeScript build error checking for production safety
2. Add unit and integration tests (Vitest + React Testing Library recommended)
3. Integrate error monitoring (Sentry or similar)
4. Remove duplicate utility functions
5. Move admin email configuration to database or environment variables
6. Consolidate on a single UI component library
7. Complete analytics persistence implementation
8. Remove console.log statements and commented-out code
9. Add rate limiting to public API endpoints
10. Implement CSP (Content Security Policy) headers

\newpage

# Appendix

## Environment Variables Required

The application requires the following environment variables:

| Variable                             | Purpose                              |
| ------------------------------------ | ------------------------------------ |
| `DATABASE_URL`                       | PostgreSQL (Neon) connection string  |
| `NEXTAUTH_SECRET`                    | NextAuth.js encryption secret        |
| `NEXTAUTH_URL`                       | Application base URL                 |
| `GOOGLE_CLIENT_ID`                   | Google OAuth client ID               |
| `GOOGLE_CLIENT_SECRET`               | Google OAuth client secret           |
| `STRIPE_SECRET_KEY`                  | Stripe API secret key                |
| `STRIPE_WEBHOOK_SECRET`              | Stripe webhook endpoint secret       |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (client-side) |
| `AWS_ACCESS_KEY_ID`                  | AWS S3 access key                    |
| `AWS_SECRET_ACCESS_KEY`              | AWS S3 secret key                    |
| `AWS_REGION`                         | AWS S3 region                        |
| `AWS_S3_BUCKET`                      | AWS S3 bucket name                   |
| `GMAIL_USER`                         | Gmail address for sending OTP emails |
| `GMAIL_APP_PASSWORD`                 | Gmail app password for SMTP          |

## Project Statistics Summary

| Metric                     | Value         |
| -------------------------- | ------------- |
| Total TypeScript/TSX files | 314           |
| Total lines of code        | ~141,783      |
| Server Actions code        | 7,153 lines   |
| App Router pages code      | 15,702 lines  |
| Domain components code     | 5,858 lines   |
| Shared library code        | 112,056 lines |
| Prisma schema              | 891 lines     |
| Database migrations        | 33            |
| Database models            | 30+           |
| Enum types                 | 14            |
| API endpoints              | 15            |
| Page routes                | 29            |
| Production dependencies    | 48            |
| Dev dependencies           | 12            |

---

_This report was generated through comprehensive static analysis of the Resellify project codebase on March 3, 2026._
