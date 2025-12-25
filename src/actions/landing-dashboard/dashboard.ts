'use server';
import prisma from '@/shared/lib/prisma';
import type { Prisma } from '@/shared/lib/generated/prisma/client';

// Type definitions for dashboard return value
export type CategoryOfferType = {
  category: {
    id: string;
    name: string;
    slug: string;
  };
  maxDiscount: number;
  offers: Array<
    Prisma.OfferGetPayload<{
      include: {
        category: {
          select: {
            id: true;
            name: true;
            slug: true;
          };
        };
      };
    }>
  >;
};

export type TodaysDealType = Prisma.ProductGetPayload<{
  include: {
    images: {
      where: { isPrimary: true };
      take: 1;
    };
    productOffers: {
      include: {
        offer: true;
      };
    };
  };
}> & {
  discountAmount: number;
  wasPrice: number;
  currentPrice: number;
  endsAt: Date | null;
};

export type CollectionType = Prisma.CategoryGetPayload<{
  include: {
    products: {
      include: {
        product: {
          include: {
            images: true;
          };
        };
      };
    };
    children: {
      select: {
        id: true;
        name: true;
        slug: true;
        description: true;
      };
    };
  };
}>;

export type TopSellingProductType = Prisma.ProductGetPayload<{
  include: {
    images: {
      where: { isPrimary: true };
      take: 1;
    };
    orderItems: {
      select: {
        quantity: true;
      };
    };
    _count: {
      select: {
        orderItems: true;
      };
    };
  };
}> & {
  totalSold: number;
  images: Array<Prisma.UploadGetPayload<{}>>;
};

export type BrandType = Prisma.BrandGetPayload<{
  include: {
    upload: {
      select: {
        path: true;
        fileName: true;
        altText: true;
      };
    };
  };
}>;

export type DashboardHomeData = {
  offers: CategoryOfferType[];
  todaysDeals: TodaysDealType[];
  collections: CollectionType[];
  topSellingProducts: TopSellingProductType[];
  brands: BrandType[];
};

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
    const now = new Date();

    // 1. Offers (to target all categories)
    // Get active offers grouped by category with max discount
    const categoryOffers = await prisma.offer.findMany({
      where: {
        isActive: true,
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
          { categoryId: { not: null } },
        ],
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: {
        priority: 'desc',
      },
    });

    // Group offers by category and calculate max discount

    type CategoryOffer = {
      category: {
        id: string;
        name: string;
        slug: string;
      };
      maxDiscount: number;
      offers: typeof categoryOffers;
    };

    const offersByCategory = categoryOffers.reduce(
      (acc: Record<string, CategoryOffer>, offer) => {
        if (!offer.category) return acc;
        const categoryName = offer.category.name;
        if (!acc[categoryName]) {
          acc[categoryName] = {
            category: offer.category,
            maxDiscount: 0,
            offers: [],
          };
        }
        const discount = offer.maxDiscount
          ? Number(offer.maxDiscount)
          : offer.type === 'PERCENT'
          ? Number(offer.value)
          : 0;
        if (discount > acc[categoryName].maxDiscount) {
          acc[categoryName].maxDiscount = discount;
        }
        acc[categoryName].offers.push(offer);
        return acc;
      },
      {} as Record<
        string,
        {
          category: { id: string; name: string; slug: string };
          maxDiscount: number;
          offers: typeof categoryOffers;
        }
      >
    );

    // 2. Today's Deals (Products with salePrice)
    const todaysDeals = await prisma.product.findMany({
      where: {
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        salePrice: { not: null },
        OR: [
          { productOffers: { some: { offer: { isActive: true } } } },
          { salePrice: { not: null } },
        ],
      },
      include: {
        images: {
          where: { isPrimary: true },
          take: 1,
        },
        productOffers: {
          include: {
            offer: {
              where: {
                isActive: true,
                AND: [
                  { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
                  { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
                ],
              },
            },
          },
        },
      },
      take: 10,
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // Calculate discount amounts and time remaining for deals
    const dealsWithDiscount = todaysDeals.map((product) => {
      const basePrice = product.basePrice;
      const salePrice = product.salePrice || basePrice;
      const discountAmount = basePrice - salePrice;

      // Get offer end time if available
      const activeOffer = product.productOffers.find((po) => po.offer);
      const endsAt = activeOffer?.offer?.endsAt;

      return {
        ...product,
        discountAmount,
        wasPrice: basePrice,
        currentPrice: salePrice,
        endsAt,
      };
    });

    // 3. Collections (Categories with subcategories)
    const collections = await prisma.category.findMany({
      where: {
        parentId: null, // Top-level categories
      },
      include: {
        products: {
          include: {
            product: {
              include: {
                images: true,
              },
            },
          },
        },
        children: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    // 4. Top Selling Products
    // Based on order items count
    const topSellingProducts = await prisma.product.findMany({
      where: {
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
      },
      include: {
        images: {
          where: { isPrimary: true },
          take: 1,
        },
        orderItems: {
          select: {
            quantity: true,
          },
        },
        _count: {
          select: {
            orderItems: true,
          },
        },
      },
      orderBy: {
        orderItems: {
          _count: 'desc',
        },
      },
      take: 10,
    });

    // 5. Brands
    const brands = await prisma.brand.findMany({
      include: {
        upload: {
          select: {
            path: true,
            fileName: true,
            altText: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
    });

    return {
      offers: Object.values(offersByCategory),
      todaysDeals: dealsWithDiscount,
      collections,
      topSellingProducts: topSellingProducts.map((product) => ({
        ...product,
        totalSold: product._count.orderItems,
        images: product.images,
      })),
      brands,
    };
  } catch (error) {
    console.error('Error fetching home data:', error);
    return {
      error: 'Failed to fetch home data',
      details: error instanceof Error ? error.message : String(error),
    };
  }
}

export { getHome };
