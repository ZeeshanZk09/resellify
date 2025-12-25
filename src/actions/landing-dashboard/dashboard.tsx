"use server";
import prisma from "@/shared/lib/prisma";
// purpose:
// 1. Offers (to target all categories)
//      a. Smart Watches
//           Save Up to 99Rs
//           Show DealsSave Up to 99Rs
//      b. Laptops
//            Save Up to 99Rs
//            Show DealsSave Up to 99Rs
//      c. DJI Products
//           Save Up to 199Rs
//           Show DealsSave Up to 199Rs
// 2. Today's Deals (Per product sale)
//      a.Save 60.00 RSsave amount
//           Apple Airpods MAX
//           was 579.00 RS
//           519.00 RS
//           1d 23:51:22
//      b. Save 24.50 RSsave amount
//           Apple Magic Mouse
//           was 79.99 RS
//           55.49 RS
// 3. Collections
//      a. Smart Watches
//           ...subcategories
//      b. Laptops
//           ...subcategories
//      c. DJI Products
//           ...subcategories
// 4. Top Selling Products
//      a. ...products
//      b. ...products
//      c. ...products
// 5. Brands
//      a. ...brands

async function getHome() {
    try {
        const offers = await prisma.
    } catch (error) {
        
    }
}
