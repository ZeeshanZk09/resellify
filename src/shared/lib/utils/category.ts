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

export { generateCategorySlug };
