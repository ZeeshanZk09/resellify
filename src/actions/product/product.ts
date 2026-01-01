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
  images: File[] | File;
  category: category;
  optionSets: optionSets;
  specs: specs;
  tags: tags;
  variants: variants;
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

export async function addProduct(input: AddProductInput) {
  try {
    console.log(
      "[addProduct] Called with input:",
      JSON.stringify(input, null, 2)
    );

    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return { error: "Unauthorized" };
    }

    // Validate required fields
    const validationError = validateRequiredFields({
      title: input.title,
      slug: input.slug,
      sku: input.sku,
      basePrice: input.basePrice,
      categoryName: input.category.name,
      categorySlug: input.category.slug,
    });
    if (validationError) return validationError;

    // Check for duplicate slug/sku
    const existing = await prisma.product.findFirst({
      where: {
        OR: [{ slug: input.slug }, { sku: input.sku }],
      },
    });
    if (existing) {
      return { error: "Product with this slug or SKU already exists" };
    }

    // Start transaction
    const result = await prisma.$transaction(
      async (tx) => {
        // 1. Handle Category
        let category = await tx.category.findUnique({
          where: { slug: input.category.slug },
        });

        if (!category) {
          category = await tx.category.create({
            data: {
              name: input.category.name,
              slug: input.category.slug,
              description: input.category.description,
              parentId: input.category.parentId,
            },
          });
        }

        // 2. Create Product first (needed for relationships)
        const product = await tx.product.create({
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
        });

        // 3. Create ProductCategory link
        await tx.productCategory.create({
          data: {
            productId: product.id,
            categoryId: category.id,
          },
        });

        // 4. Handle OptionSets and Options (if provided)
        const optionNameToIdMap = new Map<string, string>();

        if (input.optionSets && input.optionSets.length > 0) {
          for (const optSet of input.optionSets) {
            // Find or create OptionSet
            let optionSet = await tx.optionSet.findFirst({
              where: { name: optSet.name },
              include: { options: true },
            });

            if (!optionSet) {
              optionSet = await tx.optionSet.create({
                data: {
                  name: optSet.name,
                  type: optSet.type,
                  options: {
                    create: optSet.options.map((opt, idx) => ({
                      name: opt.name,
                      value: opt.value,
                      position: opt.position ?? idx,
                    })),
                  },
                },
                include: { options: true },
              });
            }

            // Create CategoryOptionSet link
            await tx.categoryOptionSet.upsert({
              where: {
                categoryId_optionSetId: {
                  categoryId: category.id,
                  optionSetId: optionSet.id,
                },
              },
              create: {
                categoryId: category.id,
                optionSetId: optionSet.id,
              },
              update: {},
            });

            // Map option names to their IDs for variant creation
            optionSet.options.forEach((opt) => {
              optionNameToIdMap.set(opt.name, opt.id);
            });
          }
        }

        // 5. Handle Product Variants (if provided)
        if (input.variants && input.variants.length > 0) {
          for (const variant of input.variants) {
            const createdVariant = await tx.productVariant.create({
              data: {
                productId: product.id,
                sku: variant.sku || undefined,
                title: variant.title || undefined,
                price: variant.price,
                salePrice: variant.salePrice,
                stock: variant.stock ?? 0,
                isDefault: variant.isDefault ?? false,
                weightGram: variant.weightGram ?? undefined,
              },
            });

            // Link variant options
            if (variant.options && variant.options.length > 0) {
              const variantOptionPromises = variant.options.map(
                async (optionName) => {
                  const optionId = optionNameToIdMap.get(optionName);
                  if (!optionId) {
                    throw new Error(
                      `Option "${optionName}" not found in any option set`
                    );
                  }
                  return tx.variantOption.create({
                    data: {
                      variantId: createdVariant.id,
                      optionId,
                    },
                  });
                }
              );
              await Promise.all(variantOptionPromises);
            }
          }
        } else {
          // Create a default variant if no variants provided
          await tx.productVariant.create({
            data: {
              productId: product.id,
              title: "Default",
              price: product.basePrice,
              stock: product.inventory,
              isDefault: true,
            },
          });
        }

        console.log("[addProduct] Creating product specs:", input.specs);
        // 7. Create SpecGroup and ProductSpec
        if (input.specs && input.specs.length > 0) {
          for (const spec of input.specs) {
            // Create SpecGroup
            const specGroup = await tx.specGroup.create({
              data: {
                title: spec.groupTitle,
                keys: spec.keys,
                // Agar SpecGroup model mein values field nahi hai,
                // to values ko alag se ProductSpec mein store karna hoga
              },
            });
            console.log("[addProduct] Created specGroup:", specGroup);

            // Create ProductSpec records for each key-value pair
            if (
              spec.keys &&
              spec.values &&
              spec.keys.length === spec.values.length
            ) {
              for (let i = 0; i < spec.keys.length; i++) {
                const key = spec.keys[i];
                const values = spec.values;

                await tx.productSpec.create({
                  data: {
                    specGroupId: specGroup.id,
                    productId: product.id,
                    values: values,
                  },
                });
                console.log(
                  `[addProduct] Created productSpec for group "${spec.groupTitle}": ${key} = ${values}`
                );
              }
            } else {
              console.warn(
                `[addProduct] Keys and values count mismatch for spec group: ${spec.groupTitle}`
              );
            }
          }
        }

        // 7. Handle Tags (if provided)
        if (input.tags && input.tags.length > 0) {
          const tagPromises = input.tags.map(async (tagInput) => {
            let tag = await tx.tag.findUnique({
              where: { slug: tagInput.slug },
            });

            if (!tag) {
              tag = await tx.tag.create({
                data: {
                  name: tagInput.name,
                  slug: tagInput.slug,
                },
              });
            }

            return tx.productTag.create({
              data: {
                productId: product.id,
                tagId: tag.id,
              },
            });
          });
          await Promise.all(tagPromises);
        }

        return product;
      },
      {
        maxWait: 5000, // Maximum time to wait for transaction
        timeout: 10000, // Maximum time for transaction
      }
    );

    // 8. Handle Image Upload (outside transaction for performance)
    let uploadResult;
    if (input.images && (input.images as File[]).length > 0) {
      uploadResult = await uploadImage(
        { type: "PRODUCT", productId: result.id },
        input.images
      );

      if (uploadResult.error) {
        console.warn(
          "Product created but image upload failed:",
          uploadResult.error
        );
        // Don't fail the whole operation if image upload fails
      } else {
        // Update product with metadata and structured data
        const primaryImage = uploadResult.images?.[0];
        if (primaryImage) {
          const metadata = generateProductMetadata(
            {
              ...result,
              metaKeywords: result.metaKeywords as
                | NullableJsonNullValueInput
                | InputJsonValue
                | undefined,
              metadata: result.metadata as
                | NullableJsonNullValueInput
                | InputJsonValue
                | undefined,
            },
            primaryImage.id
          );
          const structuredData = generateProductStructuredData({
            ...result,
            images: uploadResult.images,
          });

          await prisma.product.update({
            where: { id: result.id },
            data: {
              ...metadata,
              structuredData,
            },
          });
        }
      }
    }

    // 9. Return complete product with relations
    const completeProduct = await prisma.product.findUnique({
      where: { id: result.id },
      include: {
        categories: { include: { category: true } },
        tags: { include: { tag: true } },
        productVariants: {
          include: {
            options: { include: { option: { include: { optionSet: true } } } },
          },
        },
        productSpecs: { include: { specGroup: true } },
        images: true,
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    return {
      success: true,
      product: completeProduct,
    };
  } catch (err) {
    console.error("ADD_PRODUCT_ERROR", err);

    // Provide more specific error messages
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2002") {
        return { error: "A product with this slug or SKU already exists" };
      }
      if (err.code === "P2003") {
        return {
          error:
            "Foreign key constraint failed. Please check your category references.",
        };
      }
    }

    return {
      error: err instanceof Error ? err.message : "Failed to create product",
    };
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
  } catch (error) {}
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

    if (!result) return { error: "Can't Get Data from Database!" };
    return { res: result };
  } catch (error) {
    return { error: JSON.stringify(error) };
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
    return { res: result };
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
    return {
      res: {
        products: items,
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
            product: true,
            orderItems: true,
            _count: {
              select: {
                orderItems: true,
              },
            },
          },
        },
        couponProducts: true,
        reviews: true,
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
    return { res: result };
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

// export const getOneProduct = async (productID: string) => {
//   if (!productID || productID === "") return { error: "Invalid Product ID!" };

//   try {
//     const result = await prisma.product.findFirst({
//       where: {
//         id: productID,
//         visibility: "PUBLIC",
//         status: "PUBLISHED",
//       },
//       include: {
//         productOffers: true,
//         productSpecs: true,
//         productVariants: true,
//         couponProducts: true,
//         reviews: true,
//         images: true,
//         tags: true,
//         favouritedBy: true,
//         orderItems: true,
//       },
//     });
//     if (!result) return { error: "Invalid Data!" };

//     const specifications = await generateSpecTable(result.productSpecs);
//     if (!specifications || specifications.length === 0)
//       return { error: "Invalid Date" };

//     const pathArray: TPath[] | null = await getPathByCategoryID(
//       result.category.id,
//       result.category.parentID
//     );
//     if (!pathArray || pathArray.length === 0) return { error: "Invalid Date" };

//     //eslint-disable-next-line
//     const { specs, ...others } = result;
//     const mergedResult: TProductPageInfo = {
//       ...others,
//       specifications,
//       path: pathArray,
//     };

//     return { res: mergedResult };
//   } catch (error) {
//     return { error: JSON.stringify(error) };
//   }
// };

// export const getCartProducts = async (productIDs: string[]) => {
//   if (!productIDs || productIDs.length === 0)
//     return { error: "Invalid Product List" };

//   try {
//     const result: TCartListItemDB[] | null = await prisma.product.findMany({
//       where: {
//         id: { in: productIDs },
//       },
//       select: {
//         id: true,
//         name: true,
//         images: true,
//         price: true,
//         salePrice: true,
//       },
//     });

//     if (!result) return { error: "Can't Get Data from Database!" };
//     return { res: result };
//   } catch (error) {
//     return { error: JSON.stringify(error) };
//   }
// };

// export const deleteProduct = async (productID: string) => {
//   if (!productID || productID === "") return { error: "Invalid Data!" };
//   try {
//     const result = await prisma.product.delete({
//       where: {
//         id: productID,
//       },
//     });

//     if (!result) return { error: "Can't Delete!" };
//     return { res: result };
//   } catch (error) {
//     return { error: JSON.stringify(error) };
//   }
// };

// const generateSpecTable = async (rawSpec: ProductSpec[]) => {
//   try {
//     const specGroupIDs = rawSpec.map((spec) => spec.specGroupId);

//     const result = await prisma.specGroup.findMany({
//       where: {
//         id: { in: specGroupIDs },
//       },
//       include: {
//         products: true,
//       },
//     });
//     if (!result || result.length === 0) return null;

//     const specifications: TSpecification[] = [];

//     rawSpec.forEach((spec) => {
//       const groupSpecIndex = result.findIndex((g) => g.id === spec.specGroupId);
//       const tempSpecs: { name: string; value: string }[] = [];
//       spec.specValues.forEach((s, index) => {
//         tempSpecs.push({
//           name: result[groupSpecIndex].products[index].title || "",
//           value: s || "",
//         });
//       });

//       specifications.push({
//         groupName: result[groupSpecIndex].title || "",
//         specs: tempSpecs,
//       });
//     });
//     if (specifications.length === 0) return null;

//     return specifications;
//   } catch {
//     return null;
//   }
// };

// const getPathByCategoryID = async (
//   categoryID: string,
//   parentID: string | null
// ) => {
//   try {
//     if (!categoryID || categoryID === "") return null;
//     if (!parentID || parentID === "") return null;
//     const result: TPath[] = await db.category.findMany({
//       where: {
//         OR: [{ id: categoryID }, { id: parentID }, { parentID: null }],
//       },
//       select: {
//         id: true,
//         parentID: true,
//         name: true,
//         url: true,
//       },
//     });
//     if (!result || result.length === 0) return null;

//     const path: TPath[] = [];
//     let tempCatID: string | null = categoryID;
//     let searchCount = 0;

//     const generatePath = () => {
//       const foundCatIndex = result.findIndex((cat) => cat.id === tempCatID);
//       if (foundCatIndex === -1) return;
//       path.unshift(result[foundCatIndex]);
//       tempCatID = result[foundCatIndex].parentID;
//       if (!tempCatID) return;
//       searchCount++;
//       if (searchCount <= 3) generatePath();
//       return;
//     };
//     generatePath();

//     if (!path || path.length === 0) return null;
//     return path;
//   } catch {
//     return null;
//   }
// };
