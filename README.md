### Key design decisions & notes

1. Explicit join models (Favourite, CouponProduct, ProductOffer, CouponRedemption, ProductCategory, ProductTag) let you store extra metadata (timestamps, limits, reasons). This makes admin features (blocking users, seeing who favourited, waitlist notifications) simpler.

2. Cart snapshot fields — CartItem.price stores the price when the item was added (prevents later product price changes from affecting the cart).

3. Order snapshot — OrderItem contains name, price, lineTotal so historical orders remain accurate.

4. Coupons + product-level offers — Coupon supports global and product-specific coupons. Offer is a separate entity to allow admin-created offers (e.g., site-wide sale or single-product temporary discount).

5. Membership / Plus — isPlusMember + plusUntil fields let you implement free-shipping or other privileges for plus members.

6. Stock & Waitlist — inventory on Product plus StockLog and Waitlist let you update inventory and notify users who subscribed for restock.

7. Payment & Order flow — Payment and Order separation allows JazzCash integration: capture payment, then set paymentStatus and order.status. COD uses Payment with method COD and PENDING/SUCCEEDED as you require.

8. Admin actions & audit — OrderLog and AuditLog give you a trail for changes and allow the admin to record confirmations (like call-confirm) and block users.

9. Analytics — basic Visit events for counting visits, locations, and deriving where to market; you can expand this later by shipping event collector or using an external analytics service.

10. Indexes & unique constraints — added where lookup speed matters and to enforce constraints (e.g., orderNumber, coupon code, join uniqueness).

Neeche main **poora schema step-by-step, simple Roman Urdu me** explain kar raha hoon. Main **har model ka purpose**, phir **har important column ka role** bataunga, aur saath-saath ye bhi clear karunga ke **ye aapki requirements ko kaise fulfill karta hai**.
Is explanation ko aap **business + technical dono angle** se samajh sakte ho.

---

# 1️⃣ USER MODEL (Sab se important)

```prisma
model User {
```

### User ka role

Ye model **har insaan** ko represent karta hai jo system use karta hai:

- normal customer
- admin (you)
- support staff

### Columns explaination

- **id**
  → Har user ka unique system ID

- **name**
  → User ka naam (profile me show hoga)

- **email**
  → Login ke liye + unique (duplicate email allowed nahi)

- **emailVerified**
  → Email verify hui ya nahi (security & trust)

- **password**
  → Encrypted password

- **phoneNumber**
  → Order confirmation calls / COD ke liye
  → Unique is liye taake aik hi number se fraud na ho

---

### Roles & Control (Admin powers)

- **role (USER / ADMIN / SUPPORT)**
  → Aap admin ho
  → Admin panel access isi se control hoga

- **isActive**
  → User temporarily disable (misuse ho to)

- **isBlocked**
  → Completely block user (illegal activity)

✔️ Ye directly aapki requirement fulfill karta hai:

> “admin kisi bhi user ko inactive ya block kar sakay”

---

### Plus Membership System

- **isPlusMember**
  → True ho to free shipping waghera

- **plusUntil**
  → Membership kab expire hogi

✔️ Ye is requirement ke liye:

> “plus members ke liye shipping free hogi”

---

### Relations (User kya kya kar sakta hai)

- **favourites**
  → User ne kaunse products favourite kiye

- **addresses**
  → Multiple addresses save kar sakta hai

- **carts**
  → Cart system

- **orders**
  → User ke tamam orders

- **reviews**
  → Product rating & feedback

- **visits**
  → Analytics (kis user ne kya dekha)

---

# 2️⃣ ADDRESS MODEL (Shipping system)

```prisma
model Address {
```

### Purpose

User **multiple addresses** save kar sakta hai aur checkout par select kar sakta hai.

### Important columns

- **label**
  → Home / Office

- **fullName, phone**
  → Receiver details

- **line1, line2**
  → Full address

- **city, state, postalCode, country**
  → Delivery calculation & logistics

- **isDefault**
  → Checkout me auto select

✔️ Ye fulfill karta hai:

> “user address add bhi kar sakay aur dropdown se select bhi”

---

# 3️⃣ PRODUCT MODEL (Aapka core business)

```prisma
model Product {
```

### Product ka matlab

Ye wo product hai jo aap **resell** kar rahe ho
(Ye multi-store nahi hai, sirf aapka centralized platform)

---

### Basic Info

- **name**
  → Product title

- **slug**
  → SEO friendly URL (`/shop/iphone-14-pro`)

- **sku**
  → Internal tracking code (admin ke liye)

- **description / shortDescription**
  → Product detail page & listings

---

### Pricing

- **price**
  → Base price

- **currency**
  → PKR (future proof)

---

### Status & Visibility

- **status**
  → Draft / Published / Archived

- **visibility**
  → Public / Private / Unlisted

✔️ Is se aap:

- product hide
- schedule
- archive
  sab kar sakte ho

---

### Inventory / Stock

- **inventory**
  → Stock quantity

- **lowStockThreshold**
  → Admin alert ke liye

✔️ Ye fulfill karta hai:

> “products ka stock update karna”

---

### SEO (Google ranking)

- **metaTitle, metaDescription**
- **ogTitle, ogDescription**
- **twitterCard**
- **structuredData**

✔️ Ye aapko help karega:

- Google rich results
- better organic traffic

---

### Relations

- **categories, tags**
  → Filters & search

- **favouritedBy**
  → Kaunse products popular hain

- **productOffers**
  → Per-product discount

✔️ Ye fulfill karta hai:

> “top selling products dekhna + offers lagana”

---

# 4️⃣ PRODUCT IMAGE MODEL

Product ke multiple images, order ke sath:

- **isPrimary**
  → Main image

- **order**
  → Gallery order

- **altText**
  → SEO ke liye

---

# 5️⃣ CATEGORY & TAG SYSTEM

### Category

- Mobile
- Accessories
- Electronics

### Tag

- iPhone
- Gaming
- New Arrival

✔️ Ye fulfill karta hai:

> “user category / tag se search kar sakay”

---

# 6️⃣ FAVOURITE MODEL ❤️

```prisma
model Favourite {
```

### Purpose

User product ko **save** kar sakta hai.

✔️ Use cases:

- Stock ka wait
- Baad me order
- Admin dekh sakta hai kaunse products popular hain

---

# 7️⃣ CART & CART ITEM

### Cart

User ka temporary basket

### CartItem

- **price snapshot**
  → Agar product price change ho jaye, cart effect na ho

- **quantity**

✔️ Ye fulfill karta hai:

> “user cart me select kare ke kaunse products checkout karne hain”

---

# 8️⃣ ORDER SYSTEM (Real business flow)

```prisma
model Order {
```

### Order lifecycle

- CREATED
- PENDING (call confirm)
- CONFIRMED
- SHIPPED
- DELIVERED

✔️ Ye bilkul aapke process ke mutabiq hai:

> “call kar ke confirm → approve → deliver”

---

### Order fields

- **orderNumber**
  → Human readable

- **subTotal**

- **shippingFee**

- **discountAmount**

- **totalAmount**

✔️ Ye fulfill karta hai:

> “price calculation + offers + shipping rules”

---

# 9️⃣ PAYMENT MODEL (JazzCash / COD)

- **method**
  → JAZZCASH / COD

- **status**
  → Pending / Success / Failed

- **providerTxId**
  → JazzCash transaction ID

✔️ Ye fulfill karta hai:

> “JazzCash payment ke baad order place”

---

# 🔟 COUPONS & OFFERS 🎯

### Coupon

- First order discount
- Global discount
- Per product discount

### Offer

- Admin manually lagaye
- Sale / promotion

✔️ Ye fulfill karta hai:

> “coupons generate karna + offers lagana”

---

# 1️⃣1️⃣ REVIEWS & RATINGS ⭐

User delivery ke baad:

- rating
- comment

✔️ Ye fulfill karta hai:

> “user apna experience share kar sakay”

---

# 1️⃣2️⃣ ANALYTICS (Visits & Growth)

```prisma
model Visit {
```

Track karta hai:

- kis path par user gaya
- kis city / country se
- marketing analysis

✔️ Ye fulfill karta hai:

> “locations ke basis par promotion plan karna”

---

# ✅ FINAL SUMMARY

Ye schema:

✔️ **Multi-store nahi**, sirf centralized reselling
✔️ **Admin full control** (users, products, orders, stock, offers)
✔️ **Professional checkout system**
✔️ **COD + JazzCash**
✔️ **Plus membership**
✔️ **Analytics & growth tracking**
✔️ **Future-proof & scalable**

Agar aap chaho, next step me main:

- admin panel ka **exact feature map**
- checkout ka **step-by-step calculation logic**
- ya **real database seed example**

bhi bana deta hoon. Batao next kya chahiye.

<!-- me aik website bana rha hon jahan pr me products ki reselling kro ga markaz aik platform he unka aik business model he ke hm kisi bhi supplier/store ke products ko aagy bikwa sakhty hen or apna profit rakh sakhty hen tu ab mujhe jo website banani he us me mujhe multiple stores nhi chahia hongy or na hi mujhe is website ko bilkul aik e-commerce website ya koi custom store jo apny products sell krta ho us ki trhn nhi rakh sakhta q ke mujhe un sb ki need nhi hogi is me user apna account bana saky ga account manage kr saky ga admin panel hoga jahan admin (yani me) users ko manage kr saky ga orders ko manage kr saky ga, orders ka status update kr paye ga, products ko manage kr paye ga, products ka stock update kr paye ga or offers and coupons generate kr saky ga or daily, weekly, monthly earning, growth, visits, leads, reaches or baki zaroori information ki analytics dekh paye ga or top selling products ko bhi dekh paye ga jahan se use ye pata lagy ga ke kin products pr offer lagani he or kin ko ziada promote krna he, kisi bhi user ko in-active kr paye ga taky koi bhi user illagelly kuch bhi kr rha ho website me tu admin usy block kr saky, admin ke pass sb users ki detailed information aa rhi hogi, users ki location ke behalf se ye bhi undaza lagaya jaa saky ga ke kin locations me ziada marketing / promotion krny ki zaroort he. user account banany ke baad website ka home page/dashboard dekh paye ga. or company ki legal information dekh paye ga jaisy cookie policy terms & condition privacy policy about etc... phir aik or page ka link hoga navbar me or wo hoga /shop jis me products hongy or user unhy filter kr paye ga kisi bhi product ko uske name, sku se search kr paye ga or kisi category / tag waly product/s search kr paye ga phir kisi bhi product ko favourites me add kr saky ga taky agar baad me usy order krna ho tu kr le ya agar us product ka stock khatam he tu stock aany ka wait kr paye or order kr paye. phir order krny ke lia user kisi bhi product ko cart me add kr paye ga phir cart me jaa kr user select kr paye ga ke cart me pary hoye kin product/s ko us me checkout krna he then product select krny ke behalf pr user ko order summery dikhai jaye gi phir user coupons apply kr paye ga ya agar kisi product pr admin ne khudi offer lagai hoi hogi tu wo apply ho jaye gi or order-summery update ho jaye gi order-summery me: user ka address (is section me user apna address add bhi kr saky ga or dropdown select button me apna address select bhi kr paye ga agar koi address hoga) price (calculate ki jaye gi plus members or normal users ko dekhty hoye or ye bhi dekha jaye ga ke jis jis product pr koi offer lagi hoi thi tu sirf us product pr apply hogi or agar aik general offer he jaisy ke first order pr itna discount he tu is me kisi specific order ki baat nhi ho rahi is lia is me offer aik hi bar apply ho jay gi lkn agar user ne 4 products select kia hen or un me 2 products aisy hen jin pr alag alag offers thin wo total price me dono offers apply hongi. or mazeed ye ke plus members ke lia shipping fee nhi hogi or normal users ke lia hogi jo total price me calculate hogi, hr product ki price calculate hogi, quantity ke hisab se bhi total price calculate hogi) products ki summery + quantity (jinko checkout kia hoga) payment-type (JAZZCASH or cash-on-dilevery) or order place kr dia jaye ga agar jazzcash select hoga tu payment krny ke baad order place hoga or agar COD hoga tu normally order place ho jaye ga phir user ko my order ke page me uske order ka status dikhaya jaye ga phir me usy call kr ke confirm kr donga ke use order chahia ya nhi confirm krny ke baad me order ko approve kr donga ga or order deliver hony ke baad order ka status update kr dia jaye ga phir user order ko rate kr paye ga jis me user apna expreience de paye ga or stars de paye ga or me user ko aik cold follow-up call kr ke order ki condition ka or user ka exprience poch longa taky customers se relation strong ho -->
