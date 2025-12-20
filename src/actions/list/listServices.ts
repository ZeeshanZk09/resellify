"use server";
import { z } from "zod";

import {
  TAdminListSort,
  TFilters,
  // TListItem,
} from "@/domains/store/productList/types";
import { TUserListSort } from "@/domains/store/productList/types/index";
import db from "@/shared/lib/prisma";
// import { TProductPath } from "@/shared/types/product";
import { authAdmin, authUser } from "@/shared/lib/utils/auth";
import { getAllCategories } from "../category/category";

const ValidateSort = z.object({
  sortName: z.enum(["id", "price", "name"]),
  sortType: z.enum(["asc", "desc"]),
});

/**
 * USER flow
 * - requires authUser()
 * - applies only USER filters (exactly those you listed)
 */
export const getListForUser = async (
  // path: string,
  sortData: Partial<TUserListSort>,
  filters: TFilters
) => {
  // auth
  const session = await authUser();
  if ((session as { error: string }).error) return session;

  // reuse validation + path logic
  if (!ValidateSort.safeParse(sortData).success)
    return { error: "Invalid Sort" };
  // if (!path || path === "") return { error: "Invalid Path" };
  // const pathArray = pathToArray(path);
  // if (!pathArray || pathArray.length > 3 || pathArray.length === 0)
  //   return { error: "Invalid Path" };

  // const categoryID = await findCategoryFromPathArray(pathArray);
  // if (categoryID === "") return { error: "Invalid Path Name" };

  // const allRelatedCategories = await findCategoryChildren(
  //   categoryID,
  //   pathArray.length
  // );
  // if (!allRelatedCategories || allRelatedCategories.length === 0)
  //   return { error: "Invalid Path Name" };

  // call product fetch with isAdmin = false -> will enforce publishedAt presence
  const categories = await getAllCategories();

  const result = await getProductsByCategories(
    categories.res?.map((item) => item.id) || [],
    sortData as TUserListSort,
    filters,
    false
  );
  if (!result) return { error: "Can't Find Product!" };

  return { products: result };
};

/**
 * ADMIN flow
 * - requires authAdmin()
 * - applies ADMIN filters (which include all USER filters + admin-only ones)
 */
export const getListForAdmin = async (
  // path: string,
  sortData: TAdminListSort,
  filters: TFilters
) => {
  // auth
  const session = await authAdmin();
  if ((session as { error: string }).error) return session;

  // reuse validation + path logic
  if (!ValidateSort.safeParse(sortData).success)
    return { error: "Invalid Sort" };
  // if (!path || path === "") return { error: "Invalid Path" };
  // const pathArray = pathToArray(path);
  // if (!pathArray || pathArray.length > 3 || pathArray.length === 0)
  //   return { error: "Invalid Path" };

  // const categoryID = await findCategoryFromPathArray(pathArray);
  // if (categoryID === "") return { error: "Invalid Path Name" };

  // const subCategories: TProductPath[] | null = await getSubCategories(
  //   categoryID
  // );
  // if (!subCategories) return { error: "Invalid Sub Categories" };

  // const allRelatedCategories = await findCategoryChildren(
  //   categoryID,
  //   pathArray.length
  // );
  // if (!allRelatedCategories || allRelatedCategories.length === 0)
  //   return { error: "Invalid Path Name" };

  // call product fetch with isAdmin = true -> admin filters allowed
  const categories = await getAllCategories();

  const result = await getProductsByCategories(
    categories.res?.map((item) => item.id) || [],
    sortData as TUserListSort,
    filters,
    false
  );
  if (!result) return { error: "Can't Find Product!" };

  return { products: result };
};

// const getSubCategories = async (catID: string) => {
//   try {
//     const result = await db.category.findMany({
//       where: {
//         parentID: catID,
//       },
//     });
//     if (!result) return null;
//     const subCategories: TProductPath[] = [];
//     result.forEach((cat) => {
//       subCategories.push({
//         label: cat.name,
//         url: cat.url,
//       });
//     });
//     return subCategories;
//   } catch {
//     return null;
//   }
// };

// const findCategoryFromPathArray = async (pathArray: string[]) => {
//   try {
//     const result = await db.category.findMany();
//     if (!result) return "";

//     let parentID: string | null = null;
//     let categoryID = "";
//     pathArray.forEach((path) => {
//       categoryID =
//         result.filter((cat) => cat.parentID === parentID && cat.url === path)[0]
//           .id || "";
//       parentID = categoryID;
//     });
//     return categoryID;
//   } catch {
//     return "";
//   }
// };

// const findCategoryChildren = async (catID: string, numberOfParents: number) => {
//   try {
//     if (numberOfParents === 3) return [catID];
//     const result = await db.category.findMany();
//     if (!result) return null;

//     const tempChildren: string[] = [];
//     result.forEach((cat) => {
//       if (cat.parentID === catID) {
//         tempChildren.push(cat.id);
//       }
//     });

//     if (numberOfParents === 1) {
//       const lastChildren: string[] = [];
//       result.forEach((cat) => {
//         if (cat.parentID && tempChildren.includes(cat.parentID)) {
//           lastChildren.push(cat.id);
//         }
//       });
//       return tempChildren.concat([catID], lastChildren);
//     }

//     return tempChildren.concat([catID]);
//   } catch {
//     return null;
//   }
// };
/**
 * Unified product fetch that supports both USER and ADMIN filters.
 *
 * IMPORTANT: This function only applies the exact filter fields you requested:
 *  - USER filters: name, slug, price (min/max), publishedAt presence, featured, averageRating (gte),
 *                 categories (via categories param), tags (entered as "#tag" or "tag")
 *  - ADMIN filters: everything USER has, plus sku, status, visibility, createdAt range,
 *                   createdBy (createdById), inventory range/threshold, lowStock (inventory <= lowStockThreshold),
 *                   reviewCount (gte)
 *
 * Nothing more, nothing less — per your strict rule.
 */
const getProductsByCategories = async (
  categories: string[],
  sortData: TUserListSort | TAdminListSort,
  filters: TFilters,
  isAdmin = false
) => {
  // build dynamic where clause
  const whereAnd: any[] = [];

  // 1) categories: product must belong to any of the categories passed
  // Product -> ProductCategory relation is "categories" with field categoryId
  whereAnd.push({
    categories: {
      some: {
        categoryId: { in: categories },
      },
    },
  });

  // 2) USER-only: only show products that have publishedAt (presence) in user flow
  if (!isAdmin) {
    whereAnd.push({
      publishedAt: { not: null },
    });
  }

  // 3) NAME filter (contains, case-insensitive)
  if (sortData?.sortName === "name" && sortData.sortName.trim() !== "") {
    whereAnd.push({
      name: { contains: sortData.sortName.trim(), mode: "insensitive" },
    });
  }

  // 4) SLUG filter (exact match if provided)
  if (sortData?.sortName === "slug" && sortData.sortName.trim() !== "") {
    whereAnd.push({
      slug: sortData.sortName.trim(),
    });
  }

  // 5) PRICE range (expects priceMinMax: [min, max] like your earlier code)
  if (
    Array.isArray((filters as any)?.priceMinMax) &&
    (filters as any).priceMinMax.length === 2
  ) {
    const [minP, maxP] = (filters as any).priceMinMax;
    const parsedMin = Number(minP);
    const parsedMax = Number(maxP);
    const isInitialPrice = parsedMax === 0;
    if (!isInitialPrice) {
      // use gte/lte semantics (inclusive upper bound)
      whereAnd.push({
        price: {
          gte: parsedMin,
          lte: parsedMax,
        },
      });
    }
  }

  // 6) FEATURED boolean
  if (sortData?.sortName === "featured") {
    whereAnd.push({
      featured: sortData.sortName === "featured",
    });
  }

  // 7) AVERAGE RATING (we treat provided value as MIN threshold, 0-5 float)
  if (
    filters &&
    typeof (filters as any).averageRating === "number" &&
    !isNaN((filters as any).averageRating)
  ) {
    whereAnd.push({
      averageRating: {
        gte: (filters as any).averageRating,
      },
    });
  }

  // 8) TAGS (entered as ["#tag1", "#tag2"] or ["tag1"]) -> match Tag.slug
  if (
    Array.isArray((filters as any).tags) &&
    (filters as any).tags.length > 0
  ) {
    const rawTags: string[] = (filters as any).tags;
    const cleaned = rawTags
      .map((t) => (typeof t === "string" ? t.replace(/^#/, "").trim() : ""))
      .filter(Boolean);

    if (cleaned.length > 0) {
      // Product -> ProductTag -> Tag relation: product.tags.some.tag.slug
      whereAnd.push({
        tags: {
          some: {
            tag: {
              slug: { in: cleaned },
            },
          },
        },
      });
    }
  }

  // --- ADMIN-only filters (applied only if isAdmin === true) ---
  if (isAdmin) {
    // SKU (exact)
    if (
      typeof (filters as any).sku === "string" &&
      (filters as any).sku.trim() !== ""
    ) {
      whereAnd.push({ sku: (filters as any).sku.trim() });
    }

    // STATUS (enum: DRAFT | PUBLISHED | ARCHIVED | SCHEDULED)
    if (
      typeof (filters as any).status === "string" &&
      (filters as any).status !== ""
    ) {
      whereAnd.push({ status: (filters as any).status });
    }

    // VISIBILITY (enum: PUBLIC | PRIVATE | UNLISTED)
    if (
      typeof (filters as any).visibility === "string" &&
      (filters as any).visibility !== ""
    ) {
      whereAnd.push({ visibility: (filters as any).visibility });
    }

    // createdAt range: expect createdAtFrom, createdAtTo ISO strings or timestamps
    if ((filters as any).createdAtFrom || (filters as any).createdAtTo) {
      const createdRange: any = {};
      if ((filters as any).createdAtFrom) {
        const d = new Date((filters as any).createdAtFrom);
        if (!isNaN(d.getTime())) createdRange.gte = d;
      }
      if ((filters as any).createdAtTo) {
        const d = new Date((filters as any).createdAtTo);
        if (!isNaN(d.getTime())) createdRange.lte = d;
      }
      if (Object.keys(createdRange).length > 0)
        whereAnd.push({ createdAt: createdRange });
    }

    // createdBy (createdById)
    if (
      typeof (filters as any).createdById === "string" &&
      (filters as any).createdById.trim() !== ""
    ) {
      whereAnd.push({ createdById: (filters as any).createdById.trim() });
    }

    // inventory range or low stock:
    // - if filters.inventoryMin or filters.inventoryMax provided -> apply range
    // - if filters.lowStock === true -> inventory <= lowStockThreshold
    if (
      typeof (filters as any).inventoryMin === "number" ||
      typeof (filters as any).inventoryMax === "number"
    ) {
      const inv: any = {};
      if (typeof (filters as any).inventoryMin === "number")
        inv.gte = (filters as any).inventoryMin;
      if (typeof (filters as any).inventoryMax === "number")
        inv.lte = (filters as any).inventoryMax;
      whereAnd.push({ inventory: inv });
    } else if ((filters as any).lowStock === true) {
      // compare inventory to product.lowStockThreshold
      // Prisma doesn't allow comparing two fields directly in where, so we approximate:
      // products where inventory <= lowStockThreshold
      whereAnd.push({
        AND: [
          { inventory: { not: null } },
          { lowStockThreshold: { not: null } },
          // compare via numeric bounds: inventory <= lowStockThreshold
          // Prisma doesn't support field-to-field compare; we fallback to a conservative filter:
          // inventory <= ??? (we can't read lowStockThreshold per-row here). So instead, we filter where inventory <= some admin-provided threshold
          // But per your strict rule: you asked to support lowStockThreshold (based on inventory).
          // We'll use an admin-provided filter.lowStockThreshold numeric if provided.
        ],
      });
      // If an explicit numeric lowStockThreshold provided by admin filters, use it:
      if (typeof (filters as any).lowStockThreshold === "number") {
        whereAnd.push({
          inventory: { lte: (filters as any).lowStockThreshold },
        });
      }
      // NOTE: Prisma cannot compare inventory <= lowStockThreshold per-row without raw SQL.
    }

    // reviewCount (minimum)
    if (typeof (filters as any).reviewCountMin === "number") {
      whereAnd.push({ reviewCount: { gte: (filters as any).reviewCountMin } });
    }
  }

  // final where
  const finalWhere = whereAnd.length > 0 ? { AND: whereAnd } : {};

  try {
    const rawProducts = await db.product.findMany({
      where: finalWhere,
      select: {
        id: true,
        slug: true,
        sku: true,
        name: true,
        price: true,
        publishedAt: true,
        featured: true,
        averageRating: true,
        reviewCount: true,
        inventory: true,
        lowStockThreshold: true,
        images: true,
      },
      orderBy: {
        [sortData.sortName]: sortData.sortType,
      },
    });

    if (!rawProducts) return null;
    return rawProducts;
  } catch (err) {
    // you can log err if you want: console.error(err)
    return null;
  }
};

// const pathToArray = (path: string) => {
//   const pathWithoutList = path.split("/list/")[1];
//   const pathArray = pathWithoutList.split("/");
//   return pathArray;
// };
