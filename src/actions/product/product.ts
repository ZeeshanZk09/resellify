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
type VariantInput = {
  sku?: string;
  title?: string;
  price?: number | string;
  salePrice?: number | string | null;
  stock?: number;
  isDefault?: boolean;
  images?: string[]; // optional array of image URLs (if already uploaded)
  optionIds?: string[]; // array of existing Option.id values to link as VariantOption
};

type SpecInput = {
  specGroupId?: string; // existing SpecGroup id (preferred)
  specGroup?: { title: string; keys: string[] }; // create a new SpecGroup if specGroupId not passed
  values: string[]; // values aligned to SpecGroup.keys order
};
type AddProductExtras = {
  tags?: Tag[];
  variants?: ProductVariant[];
  specs?: SpecGroup[];
};
// export const addProduct = async (
//   {
//     basePrice,
//     slug,
//     title,
//     averageRating,
//     canonicalUrl,
//     currency,
//     description,
//     featured,
//     inventory,
//     locale,
//     lowStockThreshold,
//     reviewCount,
//     price,
//     publishedAt,
//     structuredData,
//     status,
//     visibility,
//     sku,
//     shortDescription,
//     salePrice,
//     createdBy,
//     twitterCard,
//     translations,
//     metadata,
//     metaKeywords,
//     metaDescription,
//     metaTitle,
//   }: ProductCreateInput,
//   catIdOrCat: {
//     categoryId?: string;
//     category?: Category;
//   },
//   createdById: string,
//   images: File[] | File,
//   extras?: AddProductExtras,
//   publishedById?: string
// ) => {
//   try {
//     const required = {
//       basePrice,
//       slug,
//       title,
//       sku,
//       publishedById,
//       images,
//       catIdOrCat,
//       createdById,
//     };

//     const missing = validateRequiredFields(required);
//     if (missing) return { error: missing.error };

//     const floatPrice = convertStringToFloat(basePrice);
//     const floatSalePrice = salePrice ? convertStringToFloat(salePrice) : null;

//     // Upload images first
//     const tempProductId = cuid(); // or use a different ID generation method
//     const productImage = await uploadImage(
//       {
//         productId: tempProductId,
//         type: 'PRODUCT',
//       },
//       images
//     );

//     if (productImage.error) {
//       return { error: 'Error upload product Image' };
//     }

//     const pImgs = productImage.images;
//     const metaInfo = generateProductMetadata(
//       {
//         description,
//         title,
//         shortDescription,
//         metadata,
//         metaKeywords,
//       },
//       pImgs?.[0].id!
//     );

//     const ProductstructuredData = generateProductStructuredData({
//       title,
//       visibility,
//       averageRating,
//       canonicalUrl,
//       currency,
//       description,
//       metaDescription,
//       metaTitle,
//       price,
//       reviewCount,
//       shortDescription,
//       sku,
//       status,
//       images: pImgs,
//     });

//     // Create product with all relations
//     const product = await db.product.create({
//       data: {
//         id: tempProductId,
//         basePrice: floatPrice,
//         slug,
//         title,
//         averageRating,
//         canonicalUrl,
//         currency,
//         description,
//         featured,
//         inventory,
//         locale,
//         lowStockThreshold,
//         reviewCount,
//         price,
//         publishedAt,
//         status,
//         visibility,
//         sku,
//         shortDescription,
//         salePrice: floatSalePrice,
//         twitterCard,
//         translations,
//         metadata,
//         createdById,
//         publishedById,
//         ...metaInfo,
//         structuredData: ProductstructuredData,

//         // Connect uploaded images
//         images: {
//           connect: pImgs.map((img) => ({ id: img.id })),
//         },

//         // Connect category
//         categories: catIdOrCat.categoryId
//           ? {
//               create: {
//                 categoryId: catIdOrCat.categoryId,
//               },
//             }
//           : undefined,

//         // Connect tags if provided
//         tags: extras?.tagIds
//           ? {
//               create: extras.tagIds.map((tagId) => ({
//                 tagId,
//               })),
//             }
//           : undefined,

//         // Create variants if provided
//         productVariants: extras?.variants
//           ? {
//               create: extras.variants.map((variant) => ({
//                 sku: variant.sku,
//                 title: variant.title,
//                 price: variant.price,
//                 salePrice: variant.salePrice,
//                 stock: variant.stock || 0,
//                 isDefault: variant.isDefault || false,
//                 images: variant.images || [],
//                 weightGram: variant.weightGram,
//                 options: variant.optionIds
//                   ? {
//                       create: variant.optionIds.map((optionId) => ({
//                         optionId,
//                       })),
//                     }
//                   : undefined,
//               })),
//             }
//           : undefined,

//         // Create specs if provided
//         productSpecs: extras?.specs
//           ? {
//               create: extras.specs.map((spec) => ({
//                 specGroupId: spec.specGroupId,
//                 values: spec.values,
//               })),
//             }
//           : undefined,
//       },
//       include: {
//         images: true,
//         categories: {
//           include: {
//             category: true,
//           },
//         },
//         tags: {
//           include: {
//             tag: true,
//           },
//         },
//         productVariants: {
//           include: {
//             options: {
//               include: {
//                 option: true,
//               },
//             },
//           },
//         },
//         productSpecs: {
//           include: {
//             specGroup: true,
//           },
//         },
//       },
//     });

//     return { res: product };
//   } catch (error) {
//     console.log(error);
//     return { error: 'Failed adding Product.' };
//   }
// };
import type {
  Product,
  OptionSet,
  ProductVariant,
  Tag,
  SpecGroup,
  VariantOption,
} from "@/shared/lib/generated/prisma/client";
import { InputJsonValue } from "@prisma/client/runtime/client";
import { NullableJsonNullValueInput } from "@/shared/lib/generated/prisma/internal/prismaNamespace";

export type optionSets ={
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
  export type tags= {
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
  variants: variants

};

export async function addProduct(input: AddProductInput) {
  try {
    console.log("[addProduct] Called with input:", input);

    // minimun 3 spec is required
    // if(input.specs?. < 3) {
    //   return { error: 'Minimum 3 specs are required' };
    // }

    const session = await auth();
    console.log("[addProduct] Session:", session);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      console.warn("[addProduct] Unauthorized access attempt:", session);
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
    console.log("[addProduct] Validation Result:", validationError);

    if (validationError) return validationError;

    // Check for duplicate slug/sku
    console.log("[addProduct] Checking for duplicate slug or SKU...");
    const existing = await prisma.product.findFirst({
      where: {
        OR: [{ slug: input.slug }, { sku: input.sku }],
      },
    });
    console.log("[addProduct] Duplicate product found:", existing);

    if (existing) {
      console.warn(
        "[addProduct] Product with this slug or SKU already exists."
      );
      return { error: "Product with this slug or SKU already exists" };
    }

    // Start transaction
    console.log("[addProduct] Starting database transaction...");
    const result = await prisma.$transaction(async (tx) => {
      // 1. Find or create category
      console.log("[addProduct] Looking for category:", input.category.slug);
      let category = await tx.category.findUnique({
        where: { slug: input.category.slug },
      });

      if (!category) {
        console.log(
          "[addProduct] Category not found, creating new category:",
          input.category.slug
        );
        category = await tx.category.create({
          data: {
            name: input.category.name,
            slug: input.category.slug,
            description: input.category.description,
            parentId: input.category.parentId,
          },
        });
      }
      console.log("[addProduct] Category resolved:", category);

      // 2. Create/find OptionSets and Options
      const optionSetMap = new Map<
        string,
        { id: string; optionIds: Map<string, string> }
      >();

      if (input.optionSets && input.optionSets.length > 0) {
        console.log("[addProduct] Processing option sets:", input.optionSets);
        for (const optSet of input.optionSets) {
          let optionSet = await tx.optionSet.findFirst({
            where: { name: optSet.name },
            include: { options: true },
          });
          if (optionSet) {
            console.log(
              `[addProduct] OptionSet "${optSet.name}" found:`,
              optionSet
            );
          } else {
            console.log(
              `[addProduct] OptionSet "${optSet.name}" not found, creating new...`
            );
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
            console.log(
              `[addProduct] Created OptionSet "${optSet.name}":`,
              optionSet
            );
          }

          const optionIds = new Map<string, string>();
          optionSet.options.forEach((opt) => {
            optionIds.set(opt.name, opt.id);
          });

          optionSetMap.set(optSet.name, {
            id: optionSet.id,
            optionIds,
          });

          // 3. Create CategoryOptionSet link
          console.log(
            `[addProduct] Upserting CategoryOptionSet link for categoryId: ${category.id} and optionSetId: ${optionSet.id}`
          );
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
        }
      }

      // 4. Create Product
      console.log("[addProduct] Creating product...");
      const product = await tx.product.create({
        data: {
          title: input.title,
          description: input.description,
          shortDescription: input.shortDescription,
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
          publishedById: session.user.id,
          publishedAt: input.status === "PUBLISHED" ? new Date() : undefined,
        },
      });
      console.log("[addProduct] Product created:", product);

      // 5. Create ProductVariants
      if (input.variants && input.variants.length > 0) {
        console.log("[addProduct] Creating product variants:", input.variants);
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
          console.log("[addProduct] Created variant:", createdVariant);

          // 6. Create VariantOptions (link variant to options)
          if (variant.options && variant.options.length > 0) {
            console.log(
              `[addProduct] Linking variant to options:`,
              variant.options
            );
            for (const optionName of variant.options) {
              // Find which optionSet contains this option
              for (const [osName, optSetData] of optionSetMap) {
                const optionId = optSetData.optionIds.get(optionName);
                if (optionId) {
                  await tx.variantOption.create({
                    data: {
                      variantId: createdVariant.id,
                      optionId,
                    },
                  });
                  console.log(
                    `[addProduct] Linked variant ${createdVariant.id} to option "${optionName}" (${optionId}) in optionSet "${osName}"`
                  );
                  break;
                }
              }
            }
          }
        }
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

      // 8. Create ProductCategory link
      console.log("[addProduct] Creating ProductCategory link...");
      await tx.productCategory.create({
        data: {
          productId: product.id,
          categoryId: category.id,
        },
      });

      // 9. Create Tags and ProductTag links
      if (input.tags && input.tags.length > 0) {
        console.log("[addProduct] Processing tags:", input.tags);
        for (const tagInput of input.tags) {
          let tag = await tx.tag.findUnique({
            where: { slug: tagInput.slug },
          });

          if (!tag) {
            console.log(
              "[addProduct] Tag not found, creating tag:",
              tagInput.slug
            );
            tag = await tx.tag.create({
              data: {
                name: tagInput.name,
                slug: tagInput.slug,
              },
            });
          }
          console.log("[addProduct] Tag resolved:", tag);

            return tx.productTag.create({
              data: {
                productId: product.id,
                tagId: tag.id,
              },
            });
          });
          await Promise.all(tagPromises);
        }
      }

      console.log("[addProduct] Transaction finished successfully.");
      return product;
    });

    // 10. Upload images (outside transaction)
    console.log("[addProduct] Uploading images for product:", result.id);
    const uploadResult = await uploadImage(
      { type: "PRODUCT", productId: result.id },
      input.images
    );
    console.log("[addProduct] Image upload result:", uploadResult);

    if (uploadResult.error) {
      console.warn(
        "[addProduct] Product created but image upload failed:",
        uploadResult.error
      );
      return {
        error: `Product created but image upload failed: ${uploadResult.error}`,
      };
    }

    // Update product with metadata and structured data
    const primaryImage = uploadResult.images?.[0];
    if (primaryImage) {
      console.log("[addProduct] Generating metadata and structured data...");
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

      console.log(
        "[addProduct] Updating product in DB with metadata and structuredData..."
      );
      await prisma.product.update({
        where: { id: result.id },
        data: {
          ...metadata,
          structuredData,
        },
      });
    }

    console.log("[addProduct] Product creation complete:", result);
    return {
      success: true,
      product: completeProduct,
    };
  } catch (err) {
    console.error("ADD_PRODUCT_ERROR", err);
    return { error: "Failed to create product" };
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

export const getAllProducts = async (management?: boolean) => {
  try {
    const result = await prisma.product.findMany({
      where: {
        status: "PUBLISHED",
        visibility: "PUBLIC",
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
        favouritedBy: true,
        couponProducts: true,
        categories: {
          include: {
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
        productVariants: true,
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

export const getOneProduct = async (productID: string) => {
  if (!productID || productID === "") return { error: "Invalid Product ID!" };

  try {
    const result = await db.product.findFirst({
      where: {
        id: productID,
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

    const specifications = await generateSpecTable(result.productSpecs);
    if (!specifications || specifications.length === 0)
      return { error: "Invalid Date" };

    const pathArray: TPath[] | null = await getPathByCategoryID(
      result.category.id,
      result.category.parentID
    );
    if (!pathArray || pathArray.length === 0) return { error: "Invalid Date" };

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
  if (!productIDs || productIDs.length === 0)
    return { error: "Invalid Product List" };

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
  if (!productID || productID === "") return { error: "Invalid Data!" };
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

    const result = await prisma.specGroup.findMany({
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
          name: result[groupSpecIndex].specs[index] || "",
          value: s || "",
        });
      });

      specifications.push({
        groupName: result[groupSpecIndex].title || "",
        specs: tempSpecs,
      });
    });
    if (specifications.length === 0) return null;

    return specifications;
  } catch {
    return null;
  }
};

const getPathByCategoryID = async (
  categoryID: string,
  parentID: string | null
) => {
  try {
    if (!categoryID || categoryID === "") return null;
    if (!parentID || parentID === "") return null;
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
