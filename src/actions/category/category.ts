"use server";
import { z } from "zod";
import type { Category } from "@/shared/lib/generated/prisma/client";
import db from "@/shared/lib/prisma";
import { authAdmin, authUser } from "@/shared/lib/utils/auth";
import { generateCategorySlug } from "@/shared/lib/utils/category";
import { TCategory } from "@/shared/types/categories";

//eslint-disable-next-line
const GetAllCategories = z.object({
  id: z.string(),
  name: z.string().min(3),
  slug: z.string().min(3),
  description: z.string().min(3).nullable(),
  createdAt: z.date(),
  updatedAt: z.date().nullable(),
});

const AddCategory = z.object({
  id: z.string().min(6).nullable(),
  name: z.string().min(3),
  slug: z.string().min(3),
  description: z.string().min(3).optional(),
  createdAt: z.date(),
  updatedAt: z.date().optional(),
});

const UpdateCategory = z.object({
  id: z.string().min(6),
  name: z.string().min(3).optional(),
  slug: z.string().min(3).optional(),
  description: z.string().min(3).optional(),
  updatedAt: z.date().optional(),
});

export type TGetAllCategories = z.infer<typeof GetAllCategories>;
export type TAddCategory = z.infer<typeof AddCategory>;
export type TUpdateCategory = z.infer<typeof UpdateCategory>;

export const getCategories = async () => {
  try {
    const result = await db.category.findMany({
      where: {
        parentId: null,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!result) return { error: "Can't read categories" };
    return { res: result as Category[] };
  } catch {
    return { error: "Cant read Category Groups" };
  }
};

export const getSubCategoriesById = async (catId: string) => {
  try {
    const result = await db.category.findMany({
      where: {
        parentId: catId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!result) return { error: "Can't read categories" };
    return { res: result as Category[] };
  } catch {
    return { error: "Cant read Category Groups" };
  }
};

export const getAllCategories = async (catId: string) => {
  try {
    const categories = await db.category.findMany({
      where: {
        parentId: null,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        children: true,
      },
    });
    if (!categories) return { error: "Can't read categories" };

    // let subCategories;
    // if (catId) {
    //   subCategories = await db.category.findMany({
    //     where: {
    //       parentId: catId,
    //     },
    //     orderBy: {
    //       createdAt: 'desc',
    //     },
    //   });
    // }

    const parentCategory = categories.find(
      (category: Category) => category.id === catId,
    );

    return {
      categories,
      subCategories: parentCategory?.children ?? [],
    };
  } catch {
    return { error: "Cant read Category Groups" };
  }
};

export const getAllCategoriesFlat = async () => {
  try {
    const result = await db.category.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        parentId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!result) return { error: "Can't read categories" };
    return { res: result as (Category & { parentId?: string | null })[] };
  } catch {
    return { error: "Cant read Category Groups" };
  }
};
// export const getAllCategoriesJSON = async () => {
//   try {
//     const session = await authUser();
//     if ((session as { error: string }).error) return session;
//     const result: TCategory[] = await db.category.findMany();

//     if (!result) return { error: "Can't read categories" };
//     return { res: result };
//   } catch {
//     return { error: 'Cant read Category Groups' };
//   }
// };

export const addCategory = async (data: TAddCategory) => {
  if (!AddCategory.safeParse(data).success) return { error: "Invalid Data!" };
  try {
    const session = await authAdmin();
    if ((session as { error: string }).error)
      return {
        session,
      };
    const slug = await generateCategorySlug(data.name);
    const result = await db.category.create({
      data: {
        name: data.name,
        slug,
        description: data?.description ?? null,
        createdAt: data.createdAt ?? new Date(),
        updatedAt: data.updatedAt ?? null,
      },
    });
    if (!result) return { error: "cant add to database" };
    return { res: result };
  } catch (error) {
    return { error: JSON.stringify(error) };
  }
};

export const updateCategory = async (data: TUpdateCategory) => {
  if (!UpdateCategory.safeParse(data).success)
    return { error: "Data is no valid" };

  const { id, ...values } = data;

  try {
    const session = await authAdmin();
    if ((session as { error: string }).error) return session;
    const result = await db.category.update({
      where: {
        id,
      },
      data: {
        ...values,
      },
    });
    if (result) return { res: result };
    return { error: "Can't update it" };
  } catch (error) {
    return {
      error,
    };
  }
};

export const deleteCategory = async (id: string) => {
  if (!id) return { error: "Can't delete it!" };

  try {
    const session = await authAdmin();
    if ((session as { error: string }).error) return session;
    const result = await db.category.delete({
      where: {
        id,
      },
    });

    if (!result) return { error: "Can't delete it!" };
    return { res: result || null, message: "Category deleted successfully" };
  } catch {
    return { error: "Can't delete it!" };
  }
};

export type CategoryTreeNode = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  children: CategoryTreeNode[];
};

export type GetCategoryTree = Awaited<
  ReturnType<typeof getCategoryTree>
>["res"];
export const getCategoryTree = async () => {
  try {
    const flat = await db.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        parentId: true,
        children: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
    if (!flat) return { error: "Can't read categories" };

    const map = new Map<string, CategoryTreeNode>();
    const roots: CategoryTreeNode[] = [];

    flat.forEach((c) =>
      map.set(c.id, {
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        children: [],
      }),
    );

    flat.forEach((c) => {
      const node = map.get(c.id)!;
      if (c.parentId && map.has(c.parentId)) {
        map.get(c.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    });

    return { res: roots };
  } catch {
    return { error: "Cant read Category Groups" };
  }
};

export const findCategoryByQuery = async (rawQuery: string) => {
  const query = rawQuery.trim();

  if (!query) {
    return { data: null, error: "Empty query" };
  }

  const normalized = query.toLowerCase();

  try {
    const categories = await db.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        parentId: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!categories || categories.length === 0) {
      return { data: null, error: "No categories found" };
    }

    const leafCategories = categories.filter((c) =>
      categories.every((other) => other.parentId !== c.id),
    );

    const exactSlugMatch = leafCategories.find(
      (c) => c.slug.toLowerCase() === normalized,
    );

    if (exactSlugMatch) {
      const parent =
        categories.find((c) => c.id === exactSlugMatch.parentId) ||
        exactSlugMatch;

      return {
        data: {
          parentSlug: parent.slug,
          categorySlug: exactSlugMatch.slug,
        },
        error: null,
      };
    }

    const nameMatch = leafCategories.find(
      (c) => c.name.toLowerCase() === normalized,
    );

    if (nameMatch) {
      const parent =
        categories.find((c) => c.id === nameMatch.parentId) || nameMatch;

      return {
        data: {
          parentSlug: parent.slug,
          categorySlug: nameMatch.slug,
        },
        error: null,
      };
    }

    const partialNameMatch = leafCategories.find((c) =>
      c.name.toLowerCase().includes(normalized),
    );

    if (partialNameMatch) {
      const parent =
        categories.find((c) => c.id === partialNameMatch.parentId) ||
        partialNameMatch;

      return {
        data: {
          parentSlug: parent.slug,
          categorySlug: partialNameMatch.slug,
        },
        error: null,
      };
    }

    const parentCandidate =
      categories.find((c) => c.slug.toLowerCase() === normalized) ??
      categories.find((c) => c.name.toLowerCase() === normalized) ??
      categories.find((c) => c.name.toLowerCase().includes(normalized));

    if (parentCandidate) {
      const childLeaf = leafCategories.find(
        (leaf) => leaf.parentId === parentCandidate.id,
      );

      if (childLeaf) {
        return {
          data: {
            parentSlug: parentCandidate.slug,
            categorySlug: childLeaf.slug,
          },
          error: null,
        };
      }
    }

    return { data: null, error: "Category not found" };
  } catch {
    return { data: null, error: "Cant read Category Groups" };
  }
};

export const getCategoryBySlugPath = async (
  categorySlug: string,
  subcategorySlug?: string | null,
) => {
  try {
    const categories = await db.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        parentId: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!categories || categories.length === 0) {
      return { error: "Can't read categories" };
    }

    const parent = categories.find(
      (c) => c.slug === categorySlug && c.parentId === null,
    );

    if (!parent) {
      return { error: "Category not found" };
    }

    if (subcategorySlug) {
      const child = categories.find(
        (c) => c.slug === subcategorySlug && c.parentId === parent.id,
      );

      if (!child) {
        return { error: "Subcategory not found" };
      }

      return {
        res: {
          parent,
          category: child,
        },
      };
    }

    return {
      res: {
        parent,
        category: parent,
      },
    };
  } catch {
    return { error: "Cant read Category Groups" };
  }
};
