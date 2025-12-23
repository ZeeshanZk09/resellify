'use server';
import { z } from 'zod';

import db from '@/shared/lib/prisma';
import {
  TAddProductFormValues,
  TCartListItemDB,
  TPath,
  TProductListItem,
  TProductPageInfo,
  TSpecification,
} from '@/shared/types/product';
import { ProductCreateInput } from '@/shared/lib/generated/prisma/models';
import { ProductSpec } from '@/shared/lib/generated/prisma/client';
// id               String        @id @default(cuid())
// name             String
// description      String? // long description / HTML or markdown
// shortDescription String?
// slug             String        @unique
// sku              String?       @unique
// price            Decimal?
// currency         String?       @default("PKR")
// status           ProductStatus @default(DRAFT)
// visibility       Visibility    @default(PUBLIC)
// metadata         Json?
// publishedAt      DateTime?
// createdAt        DateTime      @default(now())
// updatedAt        DateTime?     @updatedAt

// // inventory
// inventory         Int @default(0) // simple inventory count
// lowStockThreshold Int @default(5) // optional, for alerts

// // images
// images Upload[]

// // SEO
// metaTitle       String?
// metaDescription String?
// metaKeywords    Json?
// canonicalUrl    String?
// ogTitle         String?
// ogDescription   String?
// ogImageId       String?
// twitterCard     TwitterCard?
// structuredData  Json?
// locale          String?
// translations    Json?

// // relations
// categories ProductCategory[]
// tags       ProductTag[]

// createdById String?
// createdBy   User?   @relation("ProductUploader", fields: [createdById], references: [id])

// publishedById String?
// publishedBy   User?   @relation("ProductPublisher", fields: [publishedById], references: [id])

// favouritedBy Favourite[] // reverse relation via Favourite model

// // Offers & coupons join tables
// productOffers  ProductOffer[]
// couponProducts CouponProduct[]

// // social proof
// averageRating Float?      @default(0)
// reviewCount   Int?        @default(0) // reviewCount (by visits and reviews of that product will be counted for each products to check out )
// featured      Boolean     @default(false)
// cartItems     CartItem[]
// orderItems    OrderItem[]
// reviews       Review[]
// stockLogs     StockLog[]
// waitlists     Waitlist[]
// visits        Visit[]

// @@index([name])
// @@index([status, visibility])

const ValidateAddProduct = z.object({
  // according to product table schema
  name: z.string().min(3),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  slug: z.string().min(3),
  sku: z.string().optional(),
  price: z.string().min(1),
  currency: z.string().optional(),
  status: z.string().optional(),
  visibility: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  metaKeywords: z.string().optional(),
  canonicalUrl: z.string().optional(),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  ogImageId: z.string().optional(),
  twitterCard: z.string().optional(),
  structuredData: z.string().optional(),
  locale: z.string().optional(),
  translations: z.string().optional(),
  categories: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  createdById: z.string().optional(),
  publishedById: z.string().optional(),
  featured: z.boolean().optional(),
  inventory: z.number().optional(),
  lowStockThreshold: z.number().optional(),
  images: z.array(z.string()).optional(),
  metadata: z.string().optional(),
});

const convertStringToFloat = (str: string | number) => {
  (str as string).replace(/,/, '.');
  return str ? parseFloat(str as string) : 0.0;
};

export const addProduct = async (data: ProductCreateInput) => {
  if (!ValidateAddProduct.safeParse(data).success) return { error: 'Invalid Data!' };

  try {
    const price = convertStringToFloat(data.basePrice);
    const salePrice = data.salePrice ? convertStringToFloat(data.salePrice) : null;

    const result = await db.product.create({
      data: {
        ...data,
        basePrice: price,
        salePrice,
      },
    });

    if (!result) return { error: "Can't Insert Data" };
    return { res: result };
  } catch (error) {
    return { error: JSON.stringify(error) };
  }
};

export const getAllProducts = async () => {
  try {
    const result = await db.product.findMany({
      select: {
        id: true,
        title: true,
        categories: {
          select: {
            id: true,
            category: true,
            product: true,
          },
        },
      },
    });

    if (!result) return { error: "Can't Get Data from Database!" };
    return { res: result };
  } catch (error) {
    return { error: JSON.stringify(error) };
  }
};

export const getOneProduct = async (productID: string) => {
  if (!productID || productID === '') return { error: 'Invalid Product ID!' };

  try {
    const result = await db.product.findFirst({
      where: {
        id: productID,
        visibility: 'PUBLIC',
        status: 'PUBLISHED',
      },
      include: {
        productOffers: true,
        productSpecs: true,
        productVariants: true,
        couponProducts: true,
        reviews: true,
        images: true,
        tags: true,
        favouritedBy: true,
        orderItems: true,
      },
    });
    if (!result) return { error: 'Invalid Data!' };

    const specifications = await generateSpecTable(result.productSpecs);
    if (!specifications || specifications.length === 0) return { error: 'Invalid Date' };

    const pathArray: TPath[] | null = await getPathByCategoryID(
      result.category.id,
      result.category.parentID
    );
    if (!pathArray || pathArray.length === 0) return { error: 'Invalid Date' };

    //eslint-disable-next-line
    const { specs, ...others } = result;
    const mergedResult: TProductPageInfo = {
      ...others,
      specifications,
      path: pathArray,
    };

    return { res: mergedResult };
  } catch (error) {
    return { error: JSON.stringify(error) };
  }
};

export const getCartProducts = async (productIDs: string[]) => {
  if (!productIDs || productIDs.length === 0) return { error: 'Invalid Product List' };

  try {
    const result: TCartListItemDB[] | null = await db.product.findMany({
      where: {
        id: { in: productIDs },
      },
      select: {
        id: true,
        name: true,
        images: true,
        price: true,
        salePrice: true,
      },
    });

    if (!result) return { error: "Can't Get Data from Database!" };
    return { res: result };
  } catch (error) {
    return { error: JSON.stringify(error) };
  }
};

export const deleteProduct = async (productID: string) => {
  if (!productID || productID === '') return { error: 'Invalid Data!' };
  try {
    const result = await db.product.delete({
      where: {
        id: productID,
      },
    });

    if (!result) return { error: "Can't Delete!" };
    return { res: result };
  } catch (error) {
    return { error: JSON.stringify(error) };
  }
};

const generateSpecTable = async (rawSpec: ProductSpec[]) => {
  try {
    const specGroupIDs = rawSpec.map((spec) => spec.specGroupId);

    const result = await db.specGroup.findMany({
      where: {
        id: { in: specGroupIDs },
      },
      include: {
        products: true,
      },
    });
    if (!result || result.length === 0) return null;

    const specifications: TSpecification[] = [];

    rawSpec.forEach((spec) => {
      const groupSpecIndex = result.findIndex((g) => g.id === spec.specGroupId);
      const tempSpecs: { name: string; value: string }[] = [];
      spec.specValues.forEach((s, index) => {
        tempSpecs.push({
          name: result[groupSpecIndex].specs[index] || '',
          value: s || '',
        });
      });

      specifications.push({
        groupName: result[groupSpecIndex].title || '',
        specs: tempSpecs,
      });
    });
    if (specifications.length === 0) return null;

    return specifications;
  } catch {
    return null;
  }
};

const getPathByCategoryID = async (categoryID: string, parentID: string | null) => {
  try {
    if (!categoryID || categoryID === '') return null;
    if (!parentID || parentID === '') return null;
    const result: TPath[] = await db.category.findMany({
      where: {
        OR: [{ id: categoryID }, { id: parentID }, { parentID: null }],
      },
      select: {
        id: true,
        parentID: true,
        name: true,
        url: true,
      },
    });
    if (!result || result.length === 0) return null;

    const path: TPath[] = [];
    let tempCatID: string | null = categoryID;
    let searchCount = 0;

    const generatePath = () => {
      const foundCatIndex = result.findIndex((cat) => cat.id === tempCatID);
      if (foundCatIndex === -1) return;
      path.unshift(result[foundCatIndex]);
      tempCatID = result[foundCatIndex].parentID;
      if (!tempCatID) return;
      searchCount++;
      if (searchCount <= 3) generatePath();
      return;
    };
    generatePath();

    if (!path || path.length === 0) return null;
    return path;
  } catch {
    return null;
  }
};
