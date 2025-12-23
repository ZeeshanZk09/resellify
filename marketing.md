// ---------- Coupons & Offers ----------
model Coupon {
id String @id @default(cuid())
code String @unique
description String?
type CouponType
value Decimal // percent (0-100) for PERCENT or amount for FIXED
isActive Boolean @default(true)
startsAt DateTime?
endsAt DateTime?
usageLimit Int? // total uses across users
perUserLimit Int? // uses per user
firstOrderOnly Boolean @default(false)
minOrderValue Decimal?
createdAt DateTime @default(now())
updatedAt DateTime? @updatedAt

    // optional relation to specific products (if not present, coupon is global)
    products       CouponProduct[]
    redemptions    CouponRedemption[]
    productOffers  ProductOffer[]
    productOfferId String?

    @@index([code])

}

model CouponProduct {
id String @id @default(cuid())
couponId String
productId String

    coupon  Coupon  @relation(fields: [couponId], references: [id], onDelete: Cascade)
    product Product @relation(fields: [productId], references: [id], onDelete: Cascade)

    @@unique([couponId, productId])
    @@index([productId])

}

model CouponRedemption {
id String @id @default(cuid())
couponId String
userId String
orderId String?
usedAt DateTime @default(now())

    coupon Coupon @relation(fields: [couponId], references: [id], onDelete: Cascade)
    user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
    order  Order? @relation(fields: [orderId], references: [id])

    @@index([couponId])
    @@index([userId])

}

// Product-level direct offers/promotions
model Offer {
id String @id @default(cuid())
title String
description String?
type CouponType
value Decimal
startsAt DateTime?
endsAt DateTime?
isActive Boolean @default(true)
appliesToAll Boolean @default(false) // if true apply to all products
createdAt DateTime @default(now())
updatedAt DateTime? @updatedAt

    productOffers ProductOffer[]

}

model ProductOffer {
id String @id @default(cuid())
productId String
offerId String?
couponId String?

    product Product @relation(fields: [productId], references: [id], onDelete: Cascade)
    offer   Offer?  @relation(fields: [offerId], references: [id], onDelete: Cascade)
    coupons Coupon? @relation(fields: [couponId], references: [id], onDelete: Cascade)

    @@unique([productId, offerId])
    @@index([offerId])

}

1️⃣ Tumhara Coupons / Offers schema – developer logic kya hai?
🟢 Coupon

👉 User-triggered discount
User code enter karta hai (e.g. MARKAZ10)

Iska purpose:

Orders barhana

New users ko convert karna

Cart abandonment kam karna

Important fields ka matlab:

code → user jo type karega

type → % ya fixed amount

value → kitna discount

usageLimit → maximum total uses (loss control)

perUserLimit → same user abuse na kare

firstOrderOnly → sirf new customers

minOrderValue → choti order pe loss se bachao

products → coupon sirf selected products pe chale

redemptions → audit trail (kis ne kab use kiya)

👉 Yeh sab fields loss prevent karne ke liye hi hain

🟢 Offer (Product promotion)

👉 System-applied discount
User ko code enter nahi karna hota

Example:

“Flat 20% OFF on Men Shirts”

“Rs. 300 OFF on this product”

Fields:

appliesToAll → sab products ya selected

startsAt / endsAt → time-boxed promotions

value + type → discount amount

🟢 ProductOffer (bridge)

👉 yeh decide karta hai:

kaunsa product

kis offer / kis coupon se linked hai

Is se tum ye kar sakte ho:

ek product pe offer

doosre product pe coupon

dono alag control

2️⃣ Real e-commerce examples (Markaz jaisa)
Example 1: Variant-based product (no loss)

Product: Men T-Shirt

Base price: 2000

Variants:

Red → 2000

Black → 2200

Offer:

10% OFF

Final:

Red → 1800

Black → 1980

👉 Offer variant price pe apply ho rahi hai — sahi

Example 2: Coupon with safety

Coupon: WELCOME500

type: FIXED

value: 500

minOrderValue: 3000

firstOrderOnly: true

usageLimit: 5000

User cart total: 2800 ❌
👉 coupon reject (loss prevent)

User cart total: 3500 ✅
👉 discount = 500
👉 payable = 3000

Example 3: Category-based promotion

Offer:

15% OFF

Category: “Men Clothing”

Time: 3 days

Logic:

Only products linked via ProductOffer

Auto apply on product page

3️⃣ ⚠️ REAL LOSS RISKS (important)

Aksar apps yahan loss karti hain 👇

❌ Risk 1: Cost price ignore karna

Agar:

Tum product Markaz se 1800 mein le rahe ho

Tumhari selling price 2000 hai

Tum 15% OFF de do

Calculation:

2000 − 300 = 1700
👉 Direct loss

❌ Risk 2: Coupon + Offer stacking

User:

Product already 20% OFF

Coupon bhi 10% laga diya

Total:

30% discount ❌

❌ Risk 3: Unlimited usage

Aik banda:

Multiple fake accounts

Coupon reuse

4️⃣ ✅ Production-grade LOSS-SAFE RULES (VERY IMPORTANT)

Ab main tumhe exact rules deta hoon jo tum backend mein enforce karna zaroori hai.

RULE 1️⃣: Cost-aware pricing (MOST IMPORTANT)

👉 Har ProductVariant mein yeh add karo:

costPrice Decimal // Markaz se tumhe kitne mein mil rahi hai

Golden rule:
finalPrice >= costPrice + minimumProfit

Agar discount is rule ko todta ho → reject offer/coupon

RULE 2️⃣: Discount calculation order (STRICT)

👉 Always follow this order:

Variant price OR base price

Product-level Offer (auto)

Coupon (manual)

Final validation (loss check)

RULE 3️⃣: Max discount cap (lifesaver)

Coupon / Offer mein add karo:

maxDiscount Decimal?

Example:

20% OFF

maxDiscount = 500

Agar cart 10,000 ka ho:

20% = 2000 ❌

cap → 500 ✅

RULE 4️⃣: Never allow stacking (unless intentional)

👉 Backend rule:

❌ Product Offer + Coupon = NOT allowed
OR

✅ Allow only ONE with higher priority

Tum already priority field rakh sakte ho (good design).

RULE 5️⃣: Redemption tracking (tumhara schema already perfect)

Before applying coupon:

Check usageLimit

Check perUserLimit

Check firstOrderOnly

Check minOrderValue

Check startsAt / endsAt

Agar koi bhi fail ho → coupon reject

RULE 6️⃣: Snapshot prices in OrderItem (VERY IMPORTANT)

Tum already yeh kar rahe ho 👍

priceEach
totalPrice

👉 Is se future price change ya coupon delete hone se old orders safe rehte hain

FINAL SIMPLE FLOW (Tumhare app ke liye)

User selects product variant

System shows:

variant price

product offer (if any)

User applies coupon

Backend:

validates coupon rules

calculates discount

checks costPrice safety

Final price locked

Order placed

Coupon redemption recorded

TL;DR (one-line conclusion)

👉 Tumhara coupons/offers schema bilkul production-ready hai,
loss tab hota hai jab calculation rules enforce na hon —
schema se zyada business rules important hotay hain.
