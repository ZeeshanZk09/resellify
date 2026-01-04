'use server';

import { z } from 'zod';

import db from '@/shared/lib/prisma';
import { TSingleOption } from '@/shared/types/common';
import { OptionSetCreateInput } from '@/shared/lib/generated/prisma/models';

// Validation Schemas
const AddOptionSet = z.object({
  name: z.string().min(3),
  type: z.string().min(1), // OptionSetType string, adjust as needed
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
  if (!categoryID || typeof categoryID !== 'string' || categoryID.trim() === '') {
    return { error: 'Invalid Data!' };
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
      return { error: 'Not Found!' };
    }

    return { res: result };
  } catch (error: any) {
    return { error: error?.message || String(error) };
  }
};

export const addOptionSet = async (data: OptionSetCreateInput, categoryId: string) => {
  // data: {name, type, categoryId}
  if (!AddOptionSet.safeParse(data).success) return { error: 'Invalid Data' };

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
  if (!id || id === '') return { error: 'Invalid Data' };

  try {
    const result = await db.optionSet.delete({
      where: { id },
    });
    if (!result) return { error: 'failed' };
    return { res: result };
  } catch (error) {
    return { error: JSON.stringify(error) };
  }
};

// ------------------------- SINGLE OPTION -------------------------
export const addSingleOption = async (data: TSingleOption) => {
  // Expects: { optionSetID, name, value }
  if (!SingleOption.safeParse(data).success) return { error: 'Invalid Data!' };

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
  if (!SingleOption.safeParse(data).success) return { error: 'Invalid Data!' };

  try {
    // Find the option by all 3 keys (set, name, value) and delete
    const option = await db.option.findFirst({
      where: {
        optionSetId: data.optionSetID,
        name: data.name,
        value: data.value,
      },
    });

    if (!option) return { error: 'Option Not Found!' };

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

export type GetSpecGroupByCatID = Awaited<ReturnType<typeof getSpecGroupByCatID>>['res'];

export const getSpecGroupByCatID = async (categoryID: string) => {
  if (!categoryID || categoryID === '') return { error: 'Invalid Data!' };

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
      return { error: 'Not Found!' };
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

    if (!result || result.length === 0) return { error: 'Not Found!' };
    return { res: result };
  } catch (error) {
    return { error: JSON.stringify(error) };
  }
};

export const addSpecGroup = async (data: { title: string; keys?: string[] }) => {
  // data: { title, keys? }
  const validation = AddSpecGroup.safeParse(data);
  if (!validation.success) return { error: 'Invalid Data' };

  try {
    const result = await db.specGroup.create({
      data: {
        title: data.title,
        keys: data.keys || [],
      },
    });
    if (!result) return { error: 'failed' };
    return { res: result };
  } catch (error) {
    return { error: JSON.stringify(error) };
  }
};

export const deleteSpecGroup = async (id: string) => {
  if (!id || id === '') return { error: 'Invalid Data' };

  try {
    const result = await db.specGroup.delete({
      where: { id },
    });
    if (!result) return { error: 'failed' };
    return { res: result };
  } catch (error) {
    return { error: JSON.stringify(error) };
  }
};

// ------------------------- SINGLE SPEC (Key Management) -------------------------
// Note: In the schema, SpecGroup has a 'keys' array (not a separate Spec model)
// These functions manage the keys array in SpecGroup
export const addSingleSpec = async (data: { specGroupID: string; key: string }) => {
  // { specGroupID, key } - adds a key to the SpecGroup's keys array
  if (!SingleSpec.safeParse(data).success) return { error: 'Invalid Data!' };

  try {
    // Get current spec group
    const specGroup = await db.specGroup.findUnique({
      where: { id: data.specGroupID },
      select: { keys: true },
    });

    if (!specGroup) return { error: 'SpecGroup Not Found!' };

    // Check if key already exists
    if (specGroup.keys.includes(data.key)) {
      return { error: 'Key already exists!' };
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

export const deleteSingleSpec = async (data: { specGroupID: string; key: string }) => {
  // { specGroupID, key } - removes a key from the SpecGroup's keys array
  if (!SingleSpec.safeParse(data).success) return { error: 'Invalid Data!' };

  try {
    // Get current spec group
    const specGroup = await db.specGroup.findUnique({
      where: { id: data.specGroupID },
      select: { keys: true },
    });

    if (!specGroup) return { error: 'SpecGroup Not Found!' };

    // Check if key exists
    if (!specGroup.keys.includes(data.key)) {
      return { error: 'Key Not Found!' };
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
