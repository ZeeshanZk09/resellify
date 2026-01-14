"use server";
import { getCategoryBySlugPath } from "@/actions/category/category";
import { auth } from "@/auth";
import prisma from "@/shared/lib/prisma";
import {
  generateProductMetadata,
  generateProductStructuredData,
  validateRequiredFields,
} from "@/shared/lib/utils/product";
import {
  TAddProductFormValues,
  type TCartListItemDB,
  type TPath,
  TProductListItem,
  type TProductPageInfo,
  type TSpecification,
} from "@/shared/types/product";
import { uploadImage } from "./product-image";

const convertStringToFloat = (str: string | number) => {
  (str as string).replace(/,/, ".");
  return str ? parseFloat(str as string) : 0.0;
};

import type { InputJsonValue } from "@prisma/client/runtime/client";
import { TRAFFIC_LIST_PAGE_SIZE } from "@/shared/constants/admin/trafficView";
import {
  type OptionSet,
  Prisma,
  type Product,
  type ProductVariant,
  type SpecGroup,
  type Tag,
  type VariantOption,
  type Visibility,
} from "@/shared/lib/generated/prisma/client";
import type { NullableJsonNullValueInput } from "@/shared/lib/generated/prisma/internal/prismaNamespace";

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
export type GetCategoryProducts = Awaited<
  ReturnType<typeof getCategoryProducts>
>["res"];
export type LoadMoreCategoryProducts = Awaited<
  ReturnType<typeof loadMoreCategoryProducts>
>["res"];
export type SearchProductResult = Awaited<
  ReturnType<typeof searchProductByQuery>
>;

function convertDecimals(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(convertDecimals);
  } else if (obj && typeof obj === "object") {
    const result: any = {};
    for (const key in obj) {
      if (Object.hasOwn(obj, key)) {
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
  selectedCategoryIds?: string[];
  specifications?: Array<{
    specGroupId: string;
    specGroupTitle?: string; // For manually created groups
    specGroupKeys?: string[]; // For manually created groups
    values: string[];
  }>;
  variants?: Array<{
    title?: string | null;
    sku?: string | null;
    price?: number;
    salePrice?: number | null;
    stock?: number;
    isDefault?: boolean;
    weightGram?: number | null;
    options?: Array<{
      optionSetId: string;
      optionId: string;
    }>;
  }>;
};

export async function addProduct(input: AddProductInput) {
  try {
    // Log input without images (File objects can't be stringified)
    const { images, ...inputWithoutImages } = input;
    console.log(
      "[addProduct] Called with input:",
      JSON.stringify(inputWithoutImages, null, 2),
    );
    console.log(
      "[addProduct] Images:",
      images
        ? Array.isArray(images)
          ? `${images.length} files`
          : "1 file"
        : "No images",
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
    if (input.images) {
      // Check if images is an array or single file
      const imageFiles = Array.isArray(input.images)
        ? input.images
        : [input.images];

      // Filter out any non-File objects (in case ImageFile objects were passed)
      const validFiles = imageFiles.filter(
        (img): img is File => img instanceof File,
      );

      if (validFiles.length > 0) {
        console.log(`[UPLOAD] Uploading ${validFiles.length} image(s)`);
        const uploadResult = await uploadImage(
          {
            type: "PRODUCT",
            productId,
          },
          validFiles.length === 1 ? validFiles[0] : validFiles,
        );
        if (uploadResult.error) {
          console.error("[UPLOAD] Image upload failed:", uploadResult.error);
          return {
            data: null,
            error: uploadResult.error,
          };
        }
        console.log("[UPLOAD] Images uploaded successfully");
      } else {
        console.warn("[UPLOAD] No valid image files found in input.images");
      }
    } else {
      console.warn("[UPLOAD] No images provided in input");
    }

    // Step 3: Link categories
    if (input.selectedCategoryIds && input.selectedCategoryIds.length > 0) {
      console.log("[CATEGORIES] Linking categories", input.selectedCategoryIds);
      await prisma.productCategory.createMany({
        data: input.selectedCategoryIds.map((categoryId) => ({
          productId,
          categoryId,
        })),
        skipDuplicates: true,
      });
      console.log("[CATEGORIES] Categories linked successfully");
    }

    // Step 4: Add specifications
    if (input.specifications && input.specifications.length > 0) {
      console.log("[SPECS] Adding specifications", input.specifications);
      const specResult = await addProductSpecsFromForm(
        productId,
        input.specifications,
      );

      if (specResult.error) {
        return {
          data: null,
          error: specResult.error,
        };
      }
    }

    // Step 5: Create variants
    if (input.variants && input.variants.length > 0) {
      console.log("[VARIANTS] Creating variants", input.variants);

      const variantResult = await addProductVariantsFromForm(
        productId,
        input.variants,
      );

      if (variantResult.error) {
        return {
          data: null,
          error: variantResult.error,
        };
      }
    }

    // Step 6: Generate metadata (only if images were uploaded)
    const updatedProduct = await prisma.product.findUnique({
      where: { id: productId },
      include: { images: true },
    });

    if (
      updatedProduct &&
      updatedProduct.images &&
      updatedProduct.images.length > 0
    ) {
      const structuredData = generateProductStructuredData(updatedProduct);

      const metadata = generateProductMetadata(
        {
          ...updatedProduct,
          shortDescription:
            updatedProduct.shortDescription ?? updatedProduct.description,
          metadata: updatedProduct.metadata as
            | NullableJsonNullValueInput
            | InputJsonValue
            | undefined,
          metaKeywords: updatedProduct.metaKeywords as
            | NullableJsonNullValueInput
            | InputJsonValue
            | undefined,
        },
        updatedProduct.images[0].id,
      );

      await prisma.product.update({
        where: {
          id: productId,
        },
        data: {
          metadata: metadata as NullableJsonNullValueInput | InputJsonValue,
          structuredData: structuredData as
            | NullableJsonNullValueInput
            | InputJsonValue,
        },
      });
    }

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
  }[],
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
          new Set([...specGroup.keys, ...spec.keys]),
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

// New function to handle specifications from the form (with specGroupId or manual creation)
export async function addProductSpecsFromForm(
  productId: string,
  specs: Array<{
    specGroupId: string;
    specGroupTitle?: string; // For manually created groups
    specGroupKeys?: string[]; // For manually created groups
    values: string[];
  }>,
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

    // Separate manually created specs from existing ones
    const manualSpecs = specs.filter(
      (spec) =>
        spec.specGroupTitle &&
        spec.specGroupKeys &&
        spec.specGroupId.startsWith("temp_"),
    );
    const existingSpecs = specs.filter(
      (spec) => !spec.specGroupTitle || !spec.specGroupId.startsWith("temp_"),
    );

    // Get existing spec groups
    const existingSpecGroupIds = existingSpecs.map((spec) => spec.specGroupId);
    const existingSpecGroups = await prisma.specGroup.findMany({
      where: { id: { in: existingSpecGroupIds } },
    });

    // Process manually created spec groups
    for (const spec of manualSpecs) {
      if (!spec.specGroupTitle || !spec.specGroupKeys) {
        console.warn("[SPECS] Invalid manual spec group data, skipping");
        continue;
      }

      // Check if spec group with same title already exists
      let specGroup = await prisma.specGroup.findFirst({
        where: { title: spec.specGroupTitle },
      });

      if (!specGroup) {
        // Create new spec group
        specGroup = await prisma.specGroup.create({
          data: {
            title: spec.specGroupTitle,
            keys: spec.specGroupKeys,
          },
        });
      } else {
        // Merge keys if new ones are provided
        const mergedKeys = Array.from(
          new Set([...specGroup.keys, ...spec.specGroupKeys]),
        );
        if (mergedKeys.length > specGroup.keys.length) {
          specGroup = await prisma.specGroup.update({
            where: { id: specGroup.id },
            data: { keys: mergedKeys },
          });
        }
      }

      // Validate values length matches keys length
      if (spec.values.length !== spec.specGroupKeys.length) {
        console.warn(
          `[SPECS] Values length (${spec.values.length}) doesn't match keys length (${spec.specGroupKeys.length}) for group ${spec.specGroupTitle}`,
        );
      }

      // Create product spec
      await prisma.productSpec.create({
        data: {
          productId,
          specGroupId: specGroup.id,
          values: spec.values,
        },
      });
    }

    // Process existing spec groups
    for (const spec of existingSpecs) {
      const specGroup = existingSpecGroups.find(
        (sg) => sg.id === spec.specGroupId,
      );
      if (!specGroup) {
        console.warn(
          `[SPECS] SpecGroup ${spec.specGroupId} not found, skipping`,
        );
        continue;
      }

      // Validate values length matches keys length
      if (spec.values.length !== specGroup.keys.length) {
        console.warn(
          `[SPECS] Values length (${spec.values.length}) doesn't match keys length (${specGroup.keys.length}) for group ${specGroup.title}`,
        );
      }

      await prisma.productSpec.create({
        data: {
          productId,
          specGroupId: spec.specGroupId,
          values: spec.values,
        },
      });
    }

    return { success: true };
  } catch (err) {
    console.error("ADD_PRODUCT_SPECS_FROM_FORM_ERROR", err);
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
  }[],
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

// New function to handle variants from the form (with optionSetId and optionId)
export async function addProductVariantsFromForm(
  productId: string,
  variants: Array<{
    title?: string | null;
    sku?: string | null;
    price?: number;
    salePrice?: number | null;
    stock?: number;
    isDefault?: boolean;
    weightGram?: number | null;
    options?: Array<{
      optionSetId: string;
      optionId: string;
    }>;
  }>,
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

    // Get base price from product as fallback
    const productData = await prisma.product.findUnique({
      where: { id: productId },
      select: { basePrice: true },
    });
    const basePrice = productData?.basePrice ?? 0;

    // Create variants and their options
    for (const variant of variants) {
      const createdVariant = await prisma.productVariant.create({
        data: {
          productId,
          sku: variant.sku,
          title: variant.title,
          price: variant.price ?? basePrice,
          salePrice: variant.salePrice,
          stock: variant.stock ?? 0,
          isDefault: variant.isDefault ?? false,
          weightGram: variant.weightGram,
        },
      });

      // Link variant to options
      if (variant.options && variant.options.length > 0) {
        for (const optionLink of variant.options) {
          // Validate that option exists
          const option = await prisma.option.findUnique({
            where: { id: optionLink.optionId },
            include: { optionSet: true },
          });

          if (!option) {
            console.warn(
              `[VARIANTS] Option ${optionLink.optionId} not found, skipping`,
            );
            continue;
          }

          // Validate optionSetId matches
          if (option.optionSetId !== optionLink.optionSetId) {
            console.warn(
              `[VARIANTS] OptionSet mismatch for option ${optionLink.optionId}, skipping`,
            );
            continue;
          }

          // Link variant to option
          await prisma.variantOption.create({
            data: {
              variantId: createdVariant.id,
              optionId: optionLink.optionId,
            },
          });
        }
      }
    }

    return { success: true };
  } catch (err) {
    console.error("ADD_PRODUCT_VARIANTS_FROM_FORM_ERROR", err);
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
  limit: number = 10,
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

export const getCategoryProducts = async (
  categorySlug: string,
  subcategorySlug: string,
  limit: number = 10,
) => {
  try {
    const categoryContext = await getCategoryBySlugPath(
      categorySlug,
      subcategorySlug,
    );

    if (!("res" in categoryContext) || !categoryContext.res) {
      return {
        error:
          (categoryContext as { error?: string }).error ||
          "Invalid category path",
      };
    }

    const { category } = categoryContext.res;

    const result = await prisma.product.findMany({
      where: {
        status: "PUBLISHED",
        visibility: "PUBLIC",
        categories: {
          some: {
            categoryId: category.id,
          },
        },
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

export const loadMoreCategoryProducts = async (
  categorySlug: string,
  subcategorySlug: string,
  cursorId: string,
  limit: number = 10,
) => {
  try {
    const categoryContext = await getCategoryBySlugPath(
      categorySlug,
      subcategorySlug,
    );

    if (!("res" in categoryContext) || !categoryContext.res) {
      return {
        error:
          (categoryContext as { error?: string }).error ||
          "Invalid category path",
      };
    }

    const { category } = categoryContext.res;

    const result = await prisma.product.findMany({
      where: {
        status: "PUBLISHED",
        visibility: "PUBLIC",
        categories: {
          some: {
            categoryId: category.id,
          },
        },
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

export const searchProductByQuery = async (rawQuery: string) => {
  const query = rawQuery.trim();

  if (!query) {
    return { data: null, error: "Empty query" };
  }

  const normalized = query.toLowerCase();

  try {
    const product = await prisma.product.findFirst({
      where: {
        visibility: "PUBLIC",
        status: "PUBLISHED",
        OR: [
          {
            slug: normalized,
          },
          {
            title: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            tags: {
              some: {
                tag: {
                  OR: [
                    {
                      name: {
                        contains: query,
                        mode: "insensitive",
                      },
                    },
                    {
                      slug: {
                        contains: normalized,
                        mode: "insensitive",
                      },
                    },
                  ],
                },
              },
            },
          },
        ],
      },
      select: {
        id: true,
        slug: true,
      },
      orderBy: {
        publishedAt: "desc",
      },
    });

    if (!product) {
      return { data: null, error: "Product not found" };
    }

    return {
      data: {
        slug: product.slug,
      },
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
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
  categoryID: string,
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
      if (Object.hasOwn(val, key)) {
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
      firstCategory.parentId,
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
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return { error: "Unauthorized" };
    }

    const result = await prisma.product.delete({
      where: {
        id: productID,
      },
    });

    if (!result) return { error: "Can't Delete!" };
    return { success: true, data: result };
  } catch (error) {
    console.error("DELETE_PRODUCT_ERROR", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return { error: "Product not found or already deleted" };
      }
    }
    return {
      error:
        error instanceof Error ? error.message : "Failed to delete product",
    };
  }
};

export type UpdateProductInput = {
  id: string;
  title?: string;
  slug?: string;
  sku?: string;
  basePrice?: number;
  salePrice?: number | null;
  description?: string | null;
  shortDescription?: string | null;
  status?: Product["status"];
  visibility?: Product["visibility"];
  inventory?: number;
  lowStockThreshold?: number;
  metaKeywords?: NullableJsonNullValueInput | InputJsonValue | undefined;
  metadata?: NullableJsonNullValueInput | InputJsonValue | undefined;
};

export async function updateProduct(input: UpdateProductInput) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return {
        data: null,
        error: "Unauthorized",
      };
    }

    if (!input.id) {
      return {
        data: null,
        error: "Product ID is required",
      };
    }

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: input.id },
      select: { id: true },
    });

    if (!existingProduct) {
      return {
        data: null,
        error: "Product not found",
      };
    }

    // Check for duplicate slug/sku if they're being updated
    if (input.slug || input.sku) {
      const duplicate = await prisma.product.findFirst({
        where: {
          AND: [
            { id: { not: input.id } },
            {
              OR: [
                ...(input.slug ? [{ slug: input.slug }] : []),
                ...(input.sku ? [{ sku: input.sku }] : []),
              ],
            },
          ],
        },
      });

      if (duplicate) {
        return {
          data: null,
          error: "Product with this slug or SKU already exists",
        };
      }
    }

    // Build update data
    const updateData: {
      title?: string;
      slug?: string;
      sku?: string;
      basePrice?: number;
      salePrice?: number | null;
      description?: string | null;
      shortDescription?: string | null;
      status?: Product["status"];
      visibility?: Product["visibility"];
      inventory?: number;
      lowStockThreshold?: number;
      metaKeywords?: NullableJsonNullValueInput | InputJsonValue;
      metadata?: NullableJsonNullValueInput | InputJsonValue;
      publishedAt?: Date | null;
      publishedById?: string | null;
      price?: number;
    } = {};

    if (input.title !== undefined) updateData.title = input.title;
    if (input.slug !== undefined) updateData.slug = input.slug;
    if (input.sku !== undefined) updateData.sku = input.sku;
    if (input.basePrice !== undefined) {
      updateData.basePrice = input.basePrice;
      updateData.price = input.basePrice;
    }
    if (input.salePrice !== undefined) updateData.salePrice = input.salePrice;
    if (input.description !== undefined)
      updateData.description = input.description;
    if (input.shortDescription !== undefined)
      updateData.shortDescription = input.shortDescription;
    if (input.status !== undefined) {
      updateData.status = input.status;
      updateData.publishedAt = input.status === "PUBLISHED" ? new Date() : null;
      updateData.publishedById =
        input.status === "PUBLISHED" ? session.user.id : null;
    }
    if (input.visibility !== undefined)
      updateData.visibility = input.visibility;
    if (input.inventory !== undefined) updateData.inventory = input.inventory;
    if (input.lowStockThreshold !== undefined)
      updateData.lowStockThreshold = input.lowStockThreshold;
    if (input.metaKeywords !== undefined)
      updateData.metaKeywords = input.metaKeywords;
    if (input.metadata !== undefined) updateData.metadata = input.metadata;

    const result = await prisma.product.update({
      where: { id: input.id },
      data: updateData,
      include: {
        images: true,
        categories: {
          include: {
            category: true,
          },
        },
      },
    });

    return {
      data: result,
      error: null,
    };
  } catch (err) {
    console.error("UPDATE_PRODUCT_ERROR", err);

    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2002") {
        return {
          data: null,
          error: "A product with this slug or SKU already exists",
        };
      }
      if (err.code === "P2025") {
        return {
          data: null,
          error: "Product not found",
        };
      }
    }

    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to update product",
    };
  }
}

export async function getProductById(productId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return {
        data: null,
        error: "Unauthorized",
      };
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        images: true,
        categories: {
          include: {
            category: true,
          },
        },
        productSpecs: {
          include: {
            specGroup: true,
          },
        },
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
      },
    });

    if (!product) {
      return {
        data: null,
        error: "Product not found",
      };
    }

    return {
      data: product,
      error: null,
    };
  } catch (err) {
    console.error("GET_PRODUCT_BY_ID_ERROR", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to fetch product",
    };
  }
}

export async function getAllProductsForAdmin() {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return {
        data: null,
        error: "Unauthorized",
      };
    }

    const result = await prisma.product.findMany({
      include: {
        images: true,
        categories: {
          include: {
            category: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const plainProducts = convertDecimals(result);

    return {
      data: plainProducts as typeof result,
      error: null,
    };
  } catch (error) {
    console.error("GET_ALL_PRODUCTS_FOR_ADMIN_ERROR", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

const generateSpecTable = async (
  rawSpec: Array<{
    specGroupId: string;
    values: string[]; // ProductSpec has 'values' array (not 'specValues')
    specGroup?: { id: string; title: string; keys: string[] };
  }>,
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
            sg !== undefined,
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
  parentId: string | null,
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
