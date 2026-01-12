"use server";
import prisma from "@/shared/lib/prisma";
import {
  TAddProductFormValues,
  TCartListItemDB,
  TPath,
  TProductListItem,
  TProductPageInfo,
  TSpecification,
} from "@/shared/types/product";
import {
  generateProductMetadata,
  generateProductStructuredData,
  validateRequiredFields,
} from "@/shared/lib/utils/product";
import { uploadImage } from "./product-image";
import { auth } from "@/auth";

const convertStringToFloat = (str: string | number) => {
  (str as string).replace(/,/, ".");
  return str ? parseFloat(str as string) : 0.0;
};

import {
  type Product,
  type OptionSet,
  type ProductVariant,
  type Tag,
  type SpecGroup,
  type VariantOption,
  type Visibility,
  Prisma,
} from "@/shared/lib/generated/prisma/client";
import { InputJsonValue } from "@prisma/client/runtime/client";
import { NullableJsonNullValueInput } from "@/shared/lib/generated/prisma/internal/prismaNamespace";
import { TRAFFIC_LIST_PAGE_SIZE } from "@/shared/constants/admin/trafficView";

export type optionSets = {
  name: string;
  type: OptionSet["type"];
  options: {
    name: string;
    value?: string | null;
    position?: number;
  }[];
}[];
export type variants = {
  sku?: string | null;
  productId: string; // Remove: not needed for creation
  title?: string | null;
  price?: number; // Changed from number | string
  salePrice?: number | null; // Changed from number | string | null
  stock?: number;
  isDefault?: boolean;
  weightGram?: number | null;
  options?: string[]; // Changed from VariantOption[] to string[]
}[];
export type specs = {
  groupTitle: string;
  keys: string[];
  values: string[];
}[];
export type tags = {
  name: string;
  slug: string;
}[];
export type category = {
  id?: string;
  name: string;
  slug: string;
  description?: string | null;
  parentId?: string | null;
};

export type GetAllProducts = Awaited<ReturnType<typeof getAllProducts>>["res"];
export type GetRelatedProducts = Awaited<
  ReturnType<typeof getRelatedProducts>
>["res"];
export type GetInitialProducts = Awaited<
  ReturnType<typeof getInitialProducts>
>["res"];
export type LoadMoreProducts = Awaited<
  ReturnType<typeof loadMoreProducts>
>["res"];
export type GetProductBySlug = Awaited<
  ReturnType<typeof getProductBySlug>
>["res"];

function convertDecimals(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(convertDecimals);
  } else if (obj && typeof obj === "object") {
    const result: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key];
        // Prisma Decimal: check _isDecimal, or has toNumber
        if (value && typeof value === "object" && value._isDecimal) {
          result[key] = Number(value);
        } else if (
          value &&
          typeof value === "object" &&
          typeof value.toNumber === "function"
        ) {
          result[key] = value.toNumber();
        } else {
          result[key] = convertDecimals(value);
        }
      }
    }
    return result;
  }
  return obj;
}

export type AddProductInput = {
  title: string;
  slug: string;
  sku: string;
  basePrice: number;
  salePrice?: number | null;
  description?: string | null;
  shortDescription?: string | null;
  currency?: string;
  status?: Product["status"];
  visibility?: Product["visibility"];
  inventory?: number;
  lowStockThreshold?: number;
  metaKeywords?: NullableJsonNullValueInput | InputJsonValue | undefined;
  metadata?: NullableJsonNullValueInput | InputJsonValue | undefined;
  images: File | File[];
  specifications: Array<{
    groupId: string;
    value: string;
  }>;
  variants: Array<{
    optionSetId: string;
    price: number;
    stock: number;
  }>;
};

export async function addProduct(input: AddProductInput) {
  try {
    console.log(
      "[addProduct] Called with input:",
      JSON.stringify(input, null, 2)
    );

    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return {
        data: null,
        error: "Unauthorized",
      };
    }

    // Validate required fields
    const validationError = validateRequiredFields({
      title: input.title,
      slug: input.slug,
      sku: input.sku,
      basePrice: input.basePrice,
    });

    if (validationError)
      return {
        data: null,
        error: validationError,
      };

    if (input.basePrice <= input?.salePrice!) {
      return {
        data: null,
        error: "Sale price cannot be higher than base price",
      };
    }

    // Check for duplicate slug/sku
    const existing = await prisma.product.findFirst({
      where: {
        OR: [{ slug: input.slug }, { sku: input.sku }],
      },
    });
    if (existing) {
      return {
        data: null,
        error: "Product with this slug or SKU already exists",
      };
    }

    // Step 1: Create product
    const result = await prisma.product.create({
      data: {
        title: input.title,
        description: input.description,
        shortDescription: input.shortDescription,
        price: input.basePrice,
        basePrice: input.basePrice,
        salePrice: input.salePrice,
        slug: input.slug,
        sku: input.sku,
        currency: input.currency || "PKR",
        status: input.status || "DRAFT",
        visibility: input.visibility || "UNLISTED",
        inventory: input.inventory || 0,
        lowStockThreshold: input.lowStockThreshold || 5,
        createdById: session.user.id,
        publishedById:
          input.status === "PUBLISHED" ? session.user.id : undefined,
        publishedAt: input.status === "PUBLISHED" ? new Date() : undefined,
      },
      include: {
        images: true,
      },
    });

    const productId = result.id;

    if (!productId) {
      return {
        data: null,
        error: "Product ID not returned from server",
      };
    }

    // Step 2: Upload images
    if (Array.isArray(input?.images) || input?.images instanceof File) {
      console.log(
        `[UPLOAD] Uploading ${
          (input.images as File[]).length || (input.images as File).name
        } images`
      );
      const uploadResult = await uploadImage(
        {
          type: "PRODUCT",
          productId,
        },
        input.images
      );
      if (uploadResult.error) {
        return {
          data: null,
          error: uploadResult.error,
        };
      }
      console.log("[UPLOAD] Images uploaded successfully");
    }

    // Step 3: Add specifications
    if (input.specifications?.length > 0) {
      console.log("[SPECS] Adding specifications", input.specifications);
      const specResult = await addProductSpecs(
        productId,
        input.specifications.map((spec) => ({
          groupTitle: spec.groupId,
          keys: [spec.groupId],
          values: [spec.value],
        }))
      );

      if (specResult.error) {
        return {
          data: null,
          error: specResult.error,
        };
      }
    }

    // Step 4: Create variants
    if (input.variants?.length > 0) {
      console.log("[VARIANTS] Creating variants", input.variants);

      const variantResult = await addProductVariants(
        productId,
        input.variants.map((variant) => ({
          optionSetId: variant.optionSetId,
          price: variant.price,
          stock: variant.stock,
        }))
      );

      if (variantResult.error) {
        return {
          data: null,
          error: variantResult.error,
        };
      }
    }

    const structuredData = generateProductStructuredData(result);

    if (!result.images![0].id!)
      return {
        error: "Failed to generate metadata.",
      };

    const metadata = generateProductMetadata(
      {
        ...result,
        shortDescription: result.shortDescription ?? result.description,
        metadata: result.metadata as
          | NullableJsonNullValueInput
          | InputJsonValue
          | undefined,
        metaKeywords: result.metaKeywords as
          | NullableJsonNullValueInput
          | InputJsonValue
          | undefined,
      },
      result.images![0].id!
    );

    await prisma.product.update({
      where: {
        id: result.id,
      },
      data: {
        metadata: metadata as NullableJsonNullValueInput | InputJsonValue,
        structuredData: structuredData as
          | NullableJsonNullValueInput
          | InputJsonValue,
      },
    });

    return {
      data: { id: result.id },
      error: null,
    };
  } catch (err) {
    console.error("ADD_PRODUCT_ERROR", err);

    // Provide more specific error messages
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2002") {
        console.log(err);
        return {
          data: null,
          error: "A product with this slug or SKU already exists",
        };
      }
      if (err.code === "P2003") {
        console.log(err);
        return {
          data: null,
          error:
            "Foreign key constraint failed. Please check your category references.",
        };
      }
      if (err.code === "P2025") {
        console.log(err);
        return {
          data: null,
          error: "Product not found or already deleted",
        };
      }
      console.log(err);
    }
    console.log(err);

    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to create product",
    };
  }
}

export async function addProductSpecs(
  productId: string,
  specs: {
    groupTitle: string;
    keys: string[];
    values: string[];
  }[]
) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return { error: "Unauthorized" };
    }

    if (!productId || !specs || specs.length === 0) {
      return { error: "Invalid product ID or empty specifications" };
    }

    // Validate that product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });
    if (!product) return { error: "Product not found" };

    // Upsert spec groups and create product specs
    for (const spec of specs) {
      if (!spec.groupTitle || !spec.keys.length || !spec.values.length)
        continue;

      let specGroup = await prisma.specGroup.findFirst({
        where: { title: spec.groupTitle },
      });

      if (!specGroup) {
        specGroup = await prisma.specGroup.create({
          data: {
            title: spec.groupTitle,
            keys: spec.keys,
          },
        });
      } else {
        // Merge keys if new ones are provided
        const mergedKeys = Array.from(
          new Set([...specGroup.keys, ...spec.keys])
        );
        if (mergedKeys.length > specGroup.keys.length) {
          specGroup = await prisma.specGroup.update({
            where: { id: specGroup.id },
            data: { keys: mergedKeys },
          });
        }
      }

      await prisma.productSpec.create({
        data: {
          productId,
          specGroupId: specGroup.id,
          values: spec.values,
        },
      });
    }

    return { success: true };
  } catch (err) {
    console.error("ADD_PRODUCT_SPECS_ERROR", err);
    return { error: "Failed to add specifications" };
  }
}

export async function addProductVariants(
  productId: string,
  variants: {
    sku?: string | null;
    title?: string | null;
    price?: number;
    salePrice?: number | null;
    stock?: number;
    isDefault?: boolean;
    weightGram?: number | null;
    options?: string[];
  }[]
) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return { error: "Unauthorized" };
    }

    if (!productId || !variants || variants.length === 0) {
      return { error: "Invalid product ID or empty variants" };
    }

    // Validate that product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });
    if (!product) return { error: "Product not found" };

    // Create variants and their options
    for (const variant of variants) {
      const createdVariant = await prisma.productVariant.create({
        data: {
          productId,
          sku: variant.sku,
          title: variant.title,
          price: variant.price ?? 0,
          salePrice: variant.salePrice,
          stock: variant.stock ?? 0,
          isDefault: variant.isDefault ?? false,
          weightGram: variant.weightGram,
        },
      });

      if (variant.options && variant.options.length > 0) {
        for (const optName of variant.options) {
          // Find or create option set named "Default"
          let optionSet = await prisma.optionSet.findFirst({
            where: { name: "Default", type: "TEXT" },
          });
          if (!optionSet) {
            optionSet = await prisma.optionSet.create({
              data: { name: "Default", type: "TEXT" },
            });
          }

          // Find or create option under this set
          let option = await prisma.option.findFirst({
            where: { name: optName, optionSetId: optionSet.id },
          });
          if (!option) {
            option = await prisma.option.create({
              data: { name: optName, optionSetId: optionSet.id },
            });
          }

          // Link variant to option
          await prisma.variantOption.create({
            data: {
              variantId: createdVariant.id,
              optionId: option.id,
            },
          });
        }
      }
    }

    return { success: true };
  } catch (err) {
    console.error("ADD_PRODUCT_VARIANTS_ERROR", err);
    return { error: "Failed to add variants" };
  }
}

export async function toggleStock(productId: string, visibility: Visibility) {
  try {
    await prisma.product.update({
      where: {
        id: productId,
      },
      data: {
        visibility,
      },
    });
  } catch (error) {
    console.error("TOGGLE_STOCK_ERROR", error);
    return { error: "Failed to toggle stock visibility" };
  }
}

export const getAllProducts = async () => {
  try {
    const result = await prisma.product.findMany({
      where: {
        status: "PUBLISHED",
      },
      include: {
        waitlists: true,
        tags: true,
        reviews: true,
        productVariants: true,
        productOffers: true,
        productSpecs: true,
        orderItems: true,
        images: true,
        favouritedBy: {
          select: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                isPlusMember: true,
                isActive: true,
                isBlocked: true,
              },
            },
          },
        },
        couponProducts: true,
        categories: {
          include: {
            category: true,
          },
        },
      },
      orderBy: {
        publishedAt: "desc",
      },
    });

    const plainProducts = convertDecimals(result);

    if (!result) return { error: "Can't Get Data from Database!" };
    return { res: plainProducts as typeof result };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unknown error" };
  }
};

export const getInitialProducts = async (limit: number = 10) => {
  try {
    const result = await prisma.product.findMany({
      where: {
        status: "PUBLISHED",
      },
      include: {
        waitlists: true,
        tags: true,
        reviews: true,
        productVariants: true,
        productOffers: true,
        productSpecs: true,
        orderItems: true,
        images: true,
        favouritedBy: {
          select: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                isPlusMember: true,
                isActive: true,
                isBlocked: true,
              },
            },
          },
        },
        couponProducts: true,
        categories: {
          include: {
            category: true,
          },
        },
      },
      take: limit,
      orderBy: {
        publishedAt: "desc",
      },
    });

    if (!result) return { error: "Can't Get Data from Database!" };
    const plainProducts = convertDecimals(result);
    return { res: plainProducts as typeof result };
  } catch (error) {
    return { error: JSON.stringify(error) };
  }
};

export const loadMoreProducts = async (
  cursorId: string, // Last product ka ID
  limit: number = 10
) => {
  try {
    const result = await prisma.product.findMany({
      where: {
        status: "PUBLISHED",
      },
      include: {
        waitlists: true,
        tags: true,
        reviews: true,
        productVariants: true,
        productOffers: true,
        productSpecs: true,
        orderItems: true,
        images: true,
        favouritedBy: {
          select: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                isPlusMember: true,
                isActive: true,
                isBlocked: true,
              },
            },
          },
        },
        couponProducts: true,
        categories: {
          include: {
            category: true,
          },
        },
      },
      take: limit,
      skip: 1,
      cursor: {
        id: cursorId,
      },
      orderBy: {
        publishedAt: "desc",
      },
    });

    const hasNextPage = result.length > limit;
    const items = hasNextPage ? result.slice(0, -1) : result;
    const lastItem = items[items.length - 1];

    if (!result) return { error: "Can't Get Data from Database!" };
    const plainProducts = convertDecimals(result);
    return {
      res: {
        products: plainProducts as typeof result,
        lastId: lastItem?.id || null,
        hasMore: hasNextPage,
      },
    };
  } catch (error) {
    return { error: JSON.stringify(error) };
  }
};

export const getProductBySlug = async (slug: string) => {
  try {
    if (!slug || slug.trim() === "") return { error: "Invalid Slug!" };

    const result = await prisma.product.findFirst({
      where: {
        slug: slug,
        visibility: "PUBLIC",
        status: "PUBLISHED",
      },
      include: {
        productOffers: true,
        productSpecs: true,
        productVariants: {
          include: {
            options: { include: { option: { include: { optionSet: true } } } },
            orderItems: true,
            _count: {
              select: {
                orderItems: true,
              },
            },
          },
        },
        couponProducts: true,
        reviews: {
          include: {
            user: true,
          },
        },
        images: true,
        waitlists: true,
        tags: true,
        favouritedBy: true,
        orderItems: true,
        categories: {
          include: {
            category: true,
            product: true,
          },
        },
      },
    });

    if (!result) return { error: "Product Not Found!" };

    // Recursively convert all Decimals/BigInts to primitives
    const plainProduct = toPlain(result);

    return {
      success: true,
      res: plainProduct as typeof result,
    };
  } catch (error) {
    return { error: JSON.stringify(error) };
  }
};

export const getRelatedProducts = async (
  productID: string,
  categoryID: string
) => {
  if (!productID || productID === "") return { error: "Invalid Product ID!" };
  try {
    const result = await prisma.product.findMany({
      where: {
        categories: {
          some: {
            category: {
              id: {
                in: categoryID.split(","),
              },
            },
          },
        },
        visibility: "PUBLIC",
        status: "PUBLISHED",
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
    if (!result) return { error: "Invalid Data!" };
    return { res: result };
  } catch (error) {
    return { error };
  }
};

// Utility to recursively convert Decimal and BigInt values to numbers/strings
function toPlain(val: any): any {
  if (val && typeof val === "object") {
    // Decimal.js or Prisma Decimal support (has toNumber)
    if (typeof val.toNumber === "function") return val.toNumber();
    // Prisma BigInt (or JS BigInt): convert safely to string
    if (typeof val === "bigint") return val.toString();
    if (Array.isArray(val)) return val.map(toPlain);
    const obj: any = {};
    for (const key in val) {
      if (Object.prototype.hasOwnProperty.call(val, key)) {
        obj[key] = toPlain(val[key]);
      }
    }
    return obj;
  }
  return val;
}

export const getOneProduct = async (productID: string) => {
  if (!productID || productID === "") return { error: "Invalid Product ID!" };

  try {
    const result = await prisma.product.findFirst({
      where: {
        id: productID,
        visibility: "PUBLIC",
        status: "PUBLISHED",
      },
      include: {
        productOffers: true,
        productSpecs: {
          include: {
            specGroup: true,
          },
        },
        productVariants: true,
        couponProducts: true,
        reviews: true,
        images: true,
        tags: true,
        favouritedBy: true,
        orderItems: true,
        categories: {
          include: {
            category: true,
          },
        },
      },
    });
    if (!result) return { error: "Invalid Data!" };

    const specifications = await generateSpecTable(result.productSpecs);
    if (!specifications || specifications.length === 0)
      return { error: "Invalid Date" };

    // Get the first category (products can have multiple categories)
    const firstCategory = result.categories[0]?.category;
    if (!firstCategory) return { error: "Product has no category" };

    const pathArray: TPath[] | null = await getPathByCategoryID(
      firstCategory.id,
      firstCategory.parentId
    );
    if (!pathArray || pathArray.length === 0) return { error: "Invalid Date" };

    // Transform Product to TProductPageInfo format
    const mergedResult: TProductPageInfo = {
      id: result.id,
      name: result.title, // Map title to name
      isAvailable: result.inventory > 0, // Map inventory > 0 to isAvailable
      desc: result.description || result.shortDescription || null,
      images: result.images.map((img) => img.path),
      optionSets: [], // TODO: Populate from productVariants if needed
      specialFeatures: [], // TODO: Populate from metadata if needed
      price: result.basePrice,
      salePrice: result.salePrice,
      specifications,
      path: pathArray,
    };

    return { res: mergedResult };
  } catch (error) {
    return { error: JSON.stringify(error) };
  }
};

export const getCartProducts = async (productIDs: string[]) => {
  if (!productIDs || productIDs.length === 0)
    return { error: "Invalid Product List" };

  try {
    const result = await prisma.product.findMany({
      where: {
        id: { in: productIDs },
      },
      select: {
        id: true,
        title: true, // Product has 'title' not 'name'
        images: {
          select: {
            path: true,
          },
        },
        basePrice: true, // Product has 'basePrice' not 'price'
        salePrice: true,
      },
    });

    if (!result) return { error: "Can't Get Data from Database!" };

    // Transform to match TCartListItemDB type
    const transformedResult: TCartListItemDB[] = result.map((product) => ({
      id: product.id,
      name: product.title, // Map title to name for type compatibility
      images: product.images.map((img) => img.path),
      price: product.basePrice, // Map basePrice to price for type compatibility
      salePrice: product.salePrice,
    }));

    return { res: transformedResult };
  } catch (error) {
    return { error: JSON.stringify(error) };
  }
};

export const deleteProduct = async (productID: string) => {
  if (!productID || productID === "") return { error: "Invalid Data!" };
  try {
    const result = await prisma.product.delete({
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

const generateSpecTable = async (
  rawSpec: Array<{
    specGroupId: string;
    values: string[]; // ProductSpec has 'values' array (not 'specValues')
    specGroup?: { id: string; title: string; keys: string[] };
  }>
) => {
  try {
    // Check if specGroup is already included in the data
    const hasIncludedSpecGroups = rawSpec.some((spec) => spec.specGroup);

    let specGroups: Array<{ id: string; title: string; keys: string[] }> = [];

    if (hasIncludedSpecGroups) {
      // Use included specGroup data
      specGroups = rawSpec
        .map((spec) => spec.specGroup)
        .filter(
          (sg): sg is { id: string; title: string; keys: string[] } =>
            sg !== undefined
        );
    } else {
      // Fetch specGroups if not included
      const specGroupIDs = rawSpec.map((spec) => spec.specGroupId);
      const result = await prisma.specGroup.findMany({
        where: {
          id: { in: specGroupIDs },
        },
        select: {
          id: true,
          title: true,
          keys: true, // SpecGroup has 'keys' array
        },
      });
      if (!result || result.length === 0) return null;
      specGroups = result;
    }

    const specifications: TSpecification[] = [];

    rawSpec.forEach((spec) => {
      const groupSpec = specGroups.find((g) => g.id === spec.specGroupId);
      if (!groupSpec) return;

      const tempSpecs: { name: string; value: string }[] = [];
      // Map SpecGroup.keys to ProductSpec.values
      // values array is aligned with SpecGroup.keys order
      spec.values.forEach((value, index) => {
        const keyName = groupSpec.keys[index] || ""; // Get key name from SpecGroup.keys array
        tempSpecs.push({
          name: keyName,
          value: value || "",
        });
      });

      specifications.push({
        groupName: groupSpec.title || "",
        specs: tempSpecs,
      });
    });
    if (specifications.length === 0) return null;

    return specifications;
  } catch {
    return null;
  }
};

export const getTrafficReport = async (skip: number = 0) => {
  try {
    const [list, totalCount] = await Promise.all([
      prisma.visit.findMany({
        skip: skip,
        take: TRAFFIC_LIST_PAGE_SIZE,
        include: {
          product: {
            select: {
              title: true,
              categories: {
                select: {
                  category: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          id: "desc",
        },
      }),
      prisma.visit.count(),
    ]);
    if (!list) return { error: "Can not read Data!" };
    return { res: { list, totalCount } };
  } catch (error) {
    return { error: JSON.stringify(error) };
  }
};

const getPathByCategoryID = async (
  categoryID: string,
  parentId: string | null
) => {
  try {
    if (!categoryID || categoryID === "") return null;

    // Build OR condition - include category, parent, and root categories
    const orConditions: Array<{ id: string } | { parentId: null }> = [
      { id: categoryID },
    ];
    if (parentId) {
      orConditions.push({ id: parentId });
    }
    orConditions.push({ parentId: null });

    const result = await prisma.category.findMany({
      where: {
        OR: orConditions,
      },
      select: {
        id: true,
        parentId: true, // Use camelCase 'parentId' not 'parentID'
        name: true,
        slug: true, // Use 'slug' instead of 'url'
      },
    });
    if (!result || result.length === 0) return null;

    const path: TPath[] = [];
    let tempCatID: string | null = categoryID;
    let searchCount = 0;

    const generatePath = () => {
      const foundCat = result.find((cat) => cat.id === tempCatID);
      if (!foundCat) return;

      // Transform to TPath format (with url field for type compatibility)
      path.unshift({
        id: foundCat.id,
        parentID: foundCat.parentId, // Map parentId to parentID for type compatibility
        name: foundCat.name,
        url: foundCat.slug || "", // Map slug to url for type compatibility
      });

      tempCatID = foundCat.parentId; // Use camelCase 'parentId'
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
