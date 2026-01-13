"use server";
import type { Prisma } from "@/shared/lib/generated/prisma/client";
import prisma from "@/shared/lib/prisma";

// --- Dashboard Types (updated for actual getHome() return structure) ---

// CategoryOfferType: Structure for each category in "offers", where offers are grouped by category
export type CategoryOfferType = {
  category: {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
  };
  maxDiscount: number;
  offers: Array<
    Prisma.ProductOfferGetPayload<{
      include: {
        product: {
          include: {
            images: true;
            categories: {
              include: {
                category: {
                  select: {
                    children: true;
                    slug: true;
                    name: true;
                    id: true;
                    products: true;
                  };
                };
              };
            };
          };
        };
        coupons: true;
        offer: {
          include: {
            category: {
              select: {
                children: true;
                slug: true;
                name: true;
                id: true;
                products: true;
              };
            };
          };
        };
      };
    }>
  >;
};

// TodaysDealType: Each product in "todaysDeals"
export type TodaysDealType = Prisma.ProductGetPayload<{
  include: {
    productVariants: {
      include: {
        options: {
          include: {
            option: {
              select: {
                id: true;
                name: true;
                position: true;
                value: true;
                optionSet: {
                  select: {
                    id: true;
                    name: true;
                    type: true;
                    options: true;
                  };
                };
              };
            };
          };
        };
      };
    };
    images: {
      take: 4;
    };
    productOffers: {
      include: {
        offer: {
          include: {
            category: {
              select: {
                children: true;
                slug: true;
                name: true;
                id: true;
                products: true;
              };
            };
          };
        };
      };
    };
  };
}> & {
  discountAmount: number;
  wasPrice: number;
  currentPrice: number;
  endsAt: Date | null;
};

// CollectionType: Each collection/category in "collections"
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

// TopSellingProductType: Each product in "topSellingProducts"
export type TopSellingProductType = Omit<
  Prisma.ProductGetPayload<{
    include: {
      productSpecs: true;
      productVariants: {
        include: {
          options: {
            include: {
              option: true;
            };
          };
        };
      };
      images: {
        take: 4;
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
  }>,
  "images"
> & {
  totalSold: number;
  images: Array<Prisma.UploadGetPayload<{}>>;
};

// BrandType: Each brand in "brands"
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

export type CategoryOffer = {
  category: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
  };
  maxDiscount: number;
  offers: Array<
    Prisma.ProductOfferGetPayload<{
      include: {
        product: {
          include: {
            images: {
              take: 4;
            };
            categories: {
              include: {
                category: {
                  select: {
                    children: true;
                    slug: true;
                    name: true;
                    id: true;
                    description: true;
                    products: true;
                  };
                };
              };
            };
          };
        };
        coupons: true;
        offer: true;
      };
    }>
  >;
};

// DashboardHomeData: return type for getHome()
export type DashboardHomeData = {
  offers: CategoryOfferType[];
  todaysDeals: TodaysDealType[];
  collections: CollectionType[];
  topSellingProducts: TopSellingProductType[];
  brands: BrandType[];
};

// purpose...
// (omitted for brevity)

async function categoryOffers(): Promise<
  Prisma.ProductOfferGetPayload<{
    include: {
      product: {
        include: {
          images: true;
          categories: {
            include: {
              category: {
                select: {
                  children: true;
                  slug: true;
                  description: true;
                  name: true;
                  id: true;
                  products: true;
                };
              };
            };
          };
        };
      };
      coupons: true;
      offer: true;
    };
  }>[]
> {
  try {
    const now = new Date();

    const categoryOffers = await prisma.productOffer.findMany({
      where: {
        product: {
          status: "PUBLISHED",
          visibility: "PUBLIC",
        },
        offer: {
          isActive: true,
          AND: [
            { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
            { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
            { categoryId: { not: null } },
          ],
        },
      },
      include: {
        product: {
          include: {
            images: true,
            categories: {
              include: {
                category: {
                  select: {
                    children: true,
                    slug: true,
                    name: true,
                    id: true,
                    products: true,
                  },
                },
              },
            },
          },
        },
        coupons: true,
        offer: true,
      },
      orderBy: [
        { product: { publishedAt: "desc" } },
        { offer: { priority: "desc" } },
      ],
    });
    return categoryOffers;
  } catch (error) {
    // In case of error, return empty array (keep non-any, never undefined)
    return [];
  }
}

async function getHome() {
  try {
    const now = new Date();

    // 1. Offers (to target all categories)
    // Get active offers grouped by category with max discount

    // Group offers by category and calculate max discount

    // Helper for grouping by category

    const offers = await categoryOffers();

    // Grouping logic
    const offersByCategory: Record<string, CategoryOffer> = offers.reduce(
      (acc: Record<string, CategoryOffer>, offer) => {
        if (
          !offer?.product?.categories ||
          offer.product.categories.length === 0
        )
          return acc;

        offer.product.categories.forEach((catRel) => {
          const cat = catRel.category;
          if (!cat) return;
          const categoryKey = cat.id; // Use category ID as unique key

          if (!acc[categoryKey]) {
            acc[categoryKey] = {
              category: {
                id: cat.id,
                name: cat.name,
                slug: cat.slug,
                description: cat.description ?? null,
              },
              maxDiscount: 0,
              offers: [],
            };
          }

          // Calculate discount for this offer
          let discount = 0;
          const offerObj = offer.offer;
          if (offerObj) {
            if (offerObj.maxDiscount != null) {
              discount = Number(offerObj.maxDiscount);
            } else if (offerObj.type === "PERCENT") {
              discount = Number(offerObj.value);
            }
          }

          if (discount > acc[categoryKey].maxDiscount) {
            acc[categoryKey].maxDiscount = discount;
          }

          acc[categoryKey].offers.push(offer);
        });

        return acc;
      },
      {},
    );

    // 2. Today's Deals (Products with salePrice)
    const todaysDealsRaw = await prisma.product.findMany({
      where: {
        status: "PUBLISHED",
        visibility: "PUBLIC",
        salePrice: { not: null },
        OR: [
          { productOffers: { some: { offer: { isActive: true } } } },
          { salePrice: { not: null } },
        ],
      },
      include: {
        productVariants: {
          include: {
            options: {
              include: {
                option: {
                  select: {
                    id: true,
                    name: true,
                    position: true,
                    value: true,
                    optionSet: {
                      select: {
                        id: true,
                        name: true,
                        type: true,
                        options: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        images: {
          take: 4,
        },
        productOffers: {
          include: {
            offer: {
              include: {
                category: {
                  select: {
                    children: true,
                    slug: true,
                    name: true,
                    id: true,
                    products: true,
                  },
                },
              },
            },
          },
        },
      },
      take: 10,
      orderBy: {
        updatedAt: "desc",
      },
    });

    // Calculate extra info for deals
    const todaysDeals = todaysDealsRaw.map((product) => {
      const basePrice = product.basePrice;
      const salePrice = product.salePrice ?? basePrice;
      const discountAmount = basePrice - salePrice;
      const activeOffer = product.productOffers.find((po) => po.offer);
      const endsAt = activeOffer?.offer?.endsAt ?? null;

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
        createdAt: "desc",
      },
      take: 10,
    });

    // 4. Top Selling Products
    // Based on order items count
    const topSellingProductsRaw = await prisma.product.findMany({
      where: {
        status: "PUBLISHED",
        visibility: "PUBLIC",
      },
      include: {
        productSpecs: true,
        productVariants: {
          include: {
            options: {
              include: {
                option: {
                  include: {
                    optionSet: true,
                  },
                },
              },
            },
          },
        },
        images: {
          take: 4,
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
          _count: "desc",
        },
      },
      take: 10,
    });

    // Add totalSold and normalize images for TopSellingProductType
    const topSellingProducts: TopSellingProductType[] =
      topSellingProductsRaw.map((product) => ({
        ...product,
        totalSold: product._count.orderItems,
        images: product.images,
      }));

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
        createdAt: "desc",
      },
      take: 20,
    });

    return {
      offers: Object.values(offersByCategory),
      todaysDeals,
      collections,
      topSellingProducts,
      brands,
    };
  } catch (error) {
    console.error("Error fetching home data:", error);
    return {
      error: "Failed to fetch home data",
      details: error instanceof Error ? error.message : String(error),
    };
  }
}

export { getHome };
