"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { OptionType } from "@/shared/lib/generated/prisma/enums";
import type { OptionSetCreateInput } from "@/shared/lib/generated/prisma/models";
import db from "@/shared/lib/prisma";
import type { TSingleOption } from "@/shared/types/common";

// Validation Schemas
const AddOptionSet = z.object({
  name: z.string().min(3),
  type: z.nativeEnum(OptionType), // OptionSetType enum
  categoryId: z.string().min(6),
});

const SingleOption = z.object({
  optionSetID: z.string().min(6),
  name: z.string().min(3),
  value: z.string().min(3),
});

const AddSpecGroup = z.object({
  title: z.string().min(3),
  keys: z.array(z.string()).optional().default([]), // keys array for spec fields
});

const SingleSpec = z.object({
  specGroupID: z.string().min(6),
  key: z.string().min(1), // key to add/remove from keys array
});

// OPTION SETS

export const getOptionSetByCatID = async (categoryID: string) => {
  if (
    !categoryID ||
    typeof categoryID !== "string" ||
    categoryID.trim() === ""
  ) {
    return { error: "Invalid Data!" };
  }

  try {
    // Find all optionSets where categoryId matches through CategoryOptionSet join table.
    const result = await db.optionSet.findMany({
      where: {
        categories: {
          some: { categoryId: categoryID },
        },
      },
      include: { options: true },
    });

    // result will always be an array, so "if (!result)" is not a useful check.
    if (!result || !Array.isArray(result) || result.length === 0) {
      return { error: "Not Found!" };
    }

    return { res: result };
  } catch (error: any) {
    return { error: error?.message || String(error) };
  }
};

export const addOptionSet = async (
  data: OptionSetCreateInput,
  categoryId: string,
) => {
  // data: {name, type, categoryId}
  if (!AddOptionSet.safeParse(data).success) return { error: "Invalid Data" };

  try {
    // Create OptionSet and connect to category through CategoryOptionSet
    const result = await db.optionSet.create({
      data: {
        name: data.name,
        type: data.type,
        categories: {
          create: [{ categoryId: categoryId }],
        },
      },
    });
    return {
      res: result,
      success: true,
    };
  } catch (error) {
    console.log(error);
    return {
      error,
      success: false,
    };
  }
};

export const deleteOptionSet = async (id: string) => {
  if (!id || id === "") return { error: "Invalid Data" };

  try {
    const result = await db.optionSet.delete({
      where: { id },
    });
    if (!result) return { error: "failed" };
    return { res: result };
  } catch (error) {
    return { error: JSON.stringify(error) };
  }
};

// ------------------------- SINGLE OPTION -------------------------
export const addSingleOption = async (data: TSingleOption) => {
  // Expects: { optionSetID, name, value }
  if (!SingleOption.safeParse(data).success) return { error: "Invalid Data!" };

  try {
    const result = await db.option.create({
      data: {
        optionSetId: data.optionSetID,
        name: data.name,
        value: data.value,
      },
    });
    if (!result) return { error: "Can't Insert!" };
    return { res: result };
  } catch (error) {
    return { error: JSON.stringify(error) };
  }
};

export const deleteSingleOption = async (data: TSingleOption) => {
  if (!SingleOption.safeParse(data).success) return { error: "Invalid Data!" };

  try {
    // Find the option by all 3 keys (set, name, value) and delete
    const option = await db.option.findFirst({
      where: {
        optionSetId: data.optionSetID,
        name: data.name,
        value: data.value,
      },
    });

    if (!option) return { error: "Option Not Found!" };

    const result = await db.option.delete({
      where: { id: option.id },
    });

    if (!result) return { error: "Can't Delete!" };
    return { res: result };
  } catch (error) {
    return { error: JSON.stringify(error) };
  }
};

// ------------------------- SPECIFICATIONS -------------------------

export type GetSpecGroupByCatID = Awaited<
  ReturnType<typeof getSpecGroupByCatID>
>["res"];

export const getSpecGroupByCatID = async (categoryID: string) => {
  if (!categoryID || categoryID === "") return { error: "Invalid Data!" };

  try {
    // SpecGroup doesn't have direct categoryId, so we find through products
    // Get all products in this category, then get their spec groups
    const products = await db.product.findMany({
      where: {
        categories: {
          some: { categoryId: categoryID },
        },
      },
      select: {
        productSpecs: {
          select: {
            specGroup: true,
          },
        },
      },
    });

    // Extract unique spec groups
    const specGroupIds = new Set<string>();
    products.forEach((product) => {
      product.productSpecs.forEach((ps) => {
        specGroupIds.add(ps.specGroup.id);
      });
    });

    if (specGroupIds.size === 0) {
      return { error: "Not Found!" };
    }

    const result = await db.specGroup.findMany({
      where: {
        id: {
          in: Array.from(specGroupIds),
        },
      },
      include: {
        products: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });

    if (!result || result.length === 0) return { error: "Not Found!" };
    return { res: result };
  } catch (error) {
    return { error: JSON.stringify(error) };
  }
};

export const addSpecGroup = async (data: {
  title: string;
  keys?: string[];
}) => {
  // data: { title, keys? }
  const validation = AddSpecGroup.safeParse(data);
  if (!validation.success) return { error: "Invalid Data" };

  try {
    const result = await db.specGroup.create({
      data: {
        title: data.title,
        keys: data.keys || [],
      },
    });
    if (!result) return { error: "failed" };
    return { res: result };
  } catch (error) {
    return { error: JSON.stringify(error) };
  }
};

export const deleteSpecGroup = async (id: string) => {
  if (!id || id === "") return { error: "Invalid Data" };

  try {
    const result = await db.specGroup.delete({
      where: { id },
    });
    if (!result) return { error: "failed" };
    return { res: result };
  } catch (error) {
    return { error: JSON.stringify(error) };
  }
};

// ------------------------- SINGLE SPEC (Key Management) -------------------------
// Note: In the schema, SpecGroup has a 'keys' array (not a separate Spec model)
// These functions manage the keys array in SpecGroup
export const addSingleSpec = async (data: {
  specGroupID: string;
  key: string;
}) => {
  // { specGroupID, key } - adds a key to the SpecGroup's keys array
  if (!SingleSpec.safeParse(data).success) return { error: "Invalid Data!" };

  try {
    // Get current spec group
    const specGroup = await db.specGroup.findUnique({
      where: { id: data.specGroupID },
      select: { keys: true },
    });

    if (!specGroup) return { error: "SpecGroup Not Found!" };

    // Check if key already exists
    if (specGroup.keys.includes(data.key)) {
      return { error: "Key already exists!" };
    }

    // Add key to array
    const updatedKeys = [...specGroup.keys, data.key];

    const result = await db.specGroup.update({
      where: { id: data.specGroupID },
      data: {
        keys: updatedKeys,
      },
    });

    if (!result) return { error: "Can't Insert!" };
    return { res: result };
  } catch (error) {
    return { error: JSON.stringify(error) };
  }
};

export const deleteSingleSpec = async (data: {
  specGroupID: string;
  key: string;
}) => {
  // { specGroupID, key } - removes a key from the SpecGroup's keys array
  if (!SingleSpec.safeParse(data).success) return { error: "Invalid Data!" };

  try {
    // Get current spec group
    const specGroup = await db.specGroup.findUnique({
      where: { id: data.specGroupID },
      select: { keys: true },
    });

    if (!specGroup) return { error: "SpecGroup Not Found!" };

    // Check if key exists
    if (!specGroup.keys.includes(data.key)) {
      return { error: "Key Not Found!" };
    }

    // Remove key from array
    const updatedKeys = specGroup.keys.filter((k) => k !== data.key);

    const result = await db.specGroup.update({
      where: { id: data.specGroupID },
      data: {
        keys: updatedKeys,
      },
    });

    if (!result) return { error: "Can't Delete!" };
    return { res: result };
  } catch (error) {
    return { error: JSON.stringify(error) };
  }
};

export type GetCategoryOptionSets = Awaited<
  ReturnType<typeof getCategoryOptionSets>
>["res"];

export const getCategoryOptionSets = async () => {
  try {
    const result = await db.optionSet.findMany({
      include: {
        categories: {
          include: {
            category: true,
          },
        },
        options: {
          include: {
            optionSet: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });
    if (!result || result.length === 0)
      return {
        res: [],
        error: "Not Found!",
      };
    return { res: result };
  } catch (error) {
    console.log(error);
    return {
      res: [],
      error: "Can't read option sets",
    };
  }
};

// export const getSpecGroups = async () => {
//   try {
//     const result = await db.specGroup.findMany({
//       orderBy: { title: "asc" },
//     });
//     if (!result || result.length === 0) return { error: "Not Found!" };
//     return { res: result };
//   } catch (error) {
//     return { error: JSON.stringify(error) };
//   }
// };

// app/(admin)/categories/page.tsx

/*
  Next.js App Router page containing:
  - A client component form (use client) to manage Category, Subcategories, OptionSets and Options
  - A server action (createCategoryWithOptionSets) that receives a FormData payload and performs
    optimized Prisma operations inside a single transaction.

  Assumptions (adjust import paths to your project):
  - `generateSlug(name: string)` exists at '@/lib/utils/generateSlug'
  - Prisma client is exported from '@/lib/prisma' as `prisma`
  - shadcn UI components are available at '@/components/ui/*' (Input, Textarea, Button, Select, Card)

  Paste this file in `app/(admin)/categories/page.tsx` (or adapt to your routing) and adjust imports.
*/

/* ================= SERVER ACTION ================= */

export async function createCategoryWithOptionSets(formData: FormData) {
  try {
    const raw = formData.get("payload") as string | null;
    if (!raw) {
      return {
        error: "Missing payload",
        success: false,
      };
    }

    const payload = JSON.parse(raw) as {
      category: { name: string; description: string; slug: string };
      subcategories: Array<{ name: string; description: string; slug: string }>;
      optionSets: Array<{
        name: string;
        type: OptionType;
        options: Array<{
          name: string;
          value?: string | null;
          position?: number;
        }>;
      }>;
    };

    // Validate (lightweight) - you can replace with zod/yup server-side validation
    if (!payload.category?.name) {
      return {
        error: "Category name and description are required",
        success: false,
      };
    }

    // Use a transaction to create all dependent records atomically and efficiently.
    const result = await db.$transaction(async (tx) => {
      // 1) Create root category
      const createdCategory = await tx.category.create({
        data: {
          name: payload.category.name,
          description: payload.category.description,
          slug: payload.category.slug,
        },
      });

      // 2) Create subcategories (if any) using createMany for performance
      if (payload.subcategories && payload.subcategories.length > 0) {
        const subcatsData = payload.subcategories.map((s) => ({
          name: s.name,
          description: s.description,
          slug: s.slug,
          parentId: createdCategory.id,
        }));

        // createMany doesn't return created rows; that's fine for subcategories
        await tx.category.createMany({ data: subcatsData });
      }

      // 3) For each optionSet: create optionSet, create options (createMany), and create categoryOptionSet link
      for (const os of payload.optionSets ?? []) {
        if (!os.name) continue;

        const createdOptionSet = await tx.optionSet.create({
          data: {
            name: os.name,
            type: os.type,
          },
        });

        if (os.options && os.options.length > 0) {
          const optionsData = os.options.map((opt, idx) => ({
            name: opt.name,
            value: opt.value ?? null,
            position: typeof opt.position === "number" ? opt.position : idx + 1,
            optionSetId: createdOptionSet.id,
          }));

          // createMany to insert options in bulk
          await tx.option.createMany({ data: optionsData });
        }

        // link category <-> optionSet
        await tx.categoryOptionSet.create({
          data: {
            categoryId: createdCategory.id,
            optionSetId: createdOptionSet.id,
          },
        });
      }

      return { categoryId: createdCategory.id };
    });

    // OPTIONAL: revalidate path or route cache where categories are listed
    try {
      revalidatePath("/admin/manage-categories");
    } catch (e) {
      // ignore if revalidation not configured
      console.log(e);
      return { error: "Failed to revalidate path" };
    }

    return result;
  } catch (error) {
    console.log(error);
    return {
      error: "Failed to create category with option sets",
      success: false,
    };
  }
}
