"use server";

import db from "@/shared/lib/prisma";

export const getCategorySpecs = async (categoryID: string) => {
  if (!categoryID || categoryID === "") return { error: "Invalid Category ID" };

  const specifications: any[] = [];
  const processedSpecGroupIds = new Set<string>();
  let shouldRepeat = true;
  let catIdToSearch: string | null = categoryID;

  // Helper function to get spec groups and parentId for a category
  // SpecGroup is linked to Category through: Category -> Product -> ProductSpec -> SpecGroup
  const getSpecsAndParentID = async (catID: string) => {
    // Get category with parentId
    const category = await db.category.findFirst({
      where: {
        id: catID,
      },
      select: {
        parentId: true,
      },
    });

    if (!category) return null;

    // Get all products in this category
    const products = await db.product.findMany({
      where: {
        categories: {
          some: { categoryId: catID },
        },
      },
      select: {
        productSpecs: {
          select: {
            specGroup: {
              select: {
                id: true,
                title: true,
                keys: true, // SpecGroup has 'keys' array, not 'specs' relation
              },
            },
          },
        },
      },
    });

    // Extract unique spec groups
    const specGroups: any[] = [];
    products.forEach((product) => {
      product.productSpecs.forEach((ps) => {
        const specGroupId = ps.specGroup.id;
        // Only add if we haven't seen this spec group before
        if (!processedSpecGroupIds.has(specGroupId)) {
          processedSpecGroupIds.add(specGroupId);
          specGroups.push(ps.specGroup);
        }
      });
    });

    return {
      parentId: category.parentId,
      specGroups,
    };
  };

  // Iteratively get spec groups for category and all its ancestors
  const getSpecGroup = async () => {
    if (catIdToSearch) {
      const result = await getSpecsAndParentID(catIdToSearch);
      if (!result) return false;

      // Add spec groups to the beginning of the array (parent categories first)
      if (result.specGroups && result.specGroups.length > 0) {
        specifications.unshift(...result.specGroups);
      }

      // Use parentId to traverse up the category hierarchy
      if (!result.parentId) return false;
      catIdToSearch = result.parentId;
      return true;
    }
    return false;
  };

  try {
    do {
      shouldRepeat = await getSpecGroup();
    } while (shouldRepeat);

    return { res: specifications };
  } catch (error) {
    return { error: JSON.stringify(error) };
  }
};

export type GetSpecGroups = Awaited<ReturnType<typeof getSpecGroups>>["res"];
export const getSpecGroups = async () => {
  try {
    const groups = await db.specGroup.findMany({
      select: {
        id: true,
        title: true,
        keys: true,
      },
      orderBy: {
        title: "asc",
      },
    });
    if (!groups || groups.length === 0) return { error: "Not Found!" };
    return { res: groups };
  } catch (error) {
    return { error: JSON.stringify(error) };
  }
};
