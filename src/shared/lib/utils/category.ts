'use server';
import prisma from '../prisma';
async function generateCategorySlug(name: string) {
  let slug = name.toLowerCase().replace(/\s+/g, '-');

  const existingSlug = await prisma.category.findUnique({
    where: {
      slug,
    },
  });

  if (existingSlug) {
    slug += '-' + crypto.randomUUID();
  }

  return slug;
}

async function generateProductSlug(name: string) {
  'use server';
  let slug = name.toLowerCase().replace(/\s+/g, '-');

  const existingSlug = await prisma.product.findUnique({
    where: {
      slug,
    },
  });

  if (existingSlug) {
    slug += '-' + crypto.randomUUID();
  }

  return slug;
}

export { generateCategorySlug, generateProductSlug };
