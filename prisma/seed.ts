import { OptionType } from '../src/shared/lib/generated/prisma/enums';
import prisma from '../src/shared/lib/prisma';

async function main() {
  console.log('Start seeding...');

  // 1. Create Option Sets
  const optionSetsData = [
    {
      name: 'Size',
      type: OptionType.SIZE,
      options: ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'],
    },
    {
      name: 'Color',
      type: OptionType.COLOR,
      options: [
        { name: 'Black', value: '#000000' },
        { name: 'White', value: '#FFFFFF' },
        { name: 'Red', value: '#FF0000' },
        { name: 'Blue', value: '#0000FF' },
        { name: 'Green', value: '#008000' },
        { name: 'Yellow', value: '#FFFF00' },
        { name: 'Grey', value: '#808080' },
        { name: 'Navy', value: '#000080' },
        { name: 'Pink', value: '#FFC0CB' },
        { name: 'Beige', value: '#F5F5DC' },
        { name: 'Maroon', value: '#800000' },
        { name: 'Brown', value: '#A52A2A' },
      ],
    },
    {
      name: 'Fabric',
      type: OptionType.TEXT,
      options: [
        'Cotton',
        'Polyester',
        'Linen',
        'Silk',
        'Denim',
        'Wool',
        'Chiffon',
        'Lawn',
        'Velvet',
      ],
    },
    {
      name: 'Fit',
      type: OptionType.TEXT,
      options: ['Slim Fit', 'Regular Fit', 'Relaxed Fit', 'Loose Fit', 'Oversized'],
    },
  ];

  const createdOptionSets: Record<string, string> = {};

  for (const os of optionSetsData) {
    const existing = await prisma.optionSet.findUnique({
      where: { name: os.name },
    });

    let optionSetId: string;
    if (existing) {
      optionSetId = existing.id;
      console.log(`OptionSet "${os.name}" already exists.`);
    } else {
      const created = await prisma.optionSet.create({
        data: {
          name: os.name,
          type: os.type,
          options: {
            create: os.options.map((opt, index) => {
              if (typeof opt === 'string') {
                return { name: opt, value: opt, position: index + 1 };
              }
              return { name: opt.name, value: opt.value, position: index + 1 };
            }),
          },
        },
      });
      optionSetId = created.id;
      console.log(`Created OptionSet: ${os.name}`);
    }
    createdOptionSets[os.name] = optionSetId;
  }

  // 2. Create Categories
  const categories = [
    {
      name: 'Clothing',
      slug: 'clothing',
      description: 'All types of clothing',
      subcategories: [
        {
          name: "Men's Clothing",
          slug: 'mens-clothing',
          description: 'Mens fashion and apparel',
          subcategories: [
            { name: 'T-Shirts', slug: 'mens-t-shirts' },
            { name: 'Formal Shirts', slug: 'mens-formal-shirts' },
            { name: 'Casual Shirts', slug: 'mens-casual-shirts' },
            { name: 'Jeans', slug: 'mens-jeans' },
            { name: 'Trousers', slug: 'mens-trousers' },
            { name: 'Chinos', slug: 'mens-chinos' },
            { name: 'Shorts', slug: 'mens-shorts' },
            { name: 'Hoodies & Sweatshirts', slug: 'mens-hoodies-sweatshirts' },
            { name: 'Jackets & Coats', slug: 'mens-jackets-coats' },
            { name: 'Suits & Blazers', slug: 'mens-suits-blazers' },
          ],
        },
        {
          name: "Women's Clothing",
          slug: 'womens-clothing',
          description: 'Womens fashion and apparel',
          subcategories: [
            { name: 'Tops & Tees', slug: 'womens-tops-tees' },
            { name: 'Kurtas', slug: 'womens-kurtas' },
            { name: 'Shalwar Kameez', slug: 'womens-shalwar-kameez' },
            { name: 'Dresses', slug: 'womens-dresses' },
            { name: 'Sarees', slug: 'womens-sarees' },
            { name: 'Jeans', slug: 'womens-jeans' },
            { name: 'Trousers', slug: 'womens-trousers' },
            { name: 'Skirts', slug: 'womens-skirts' },
            { name: 'Jackets & Coats', slug: 'womens-jackets-coats' },
            { name: 'Abayas & Hijabs', slug: 'womens-abayas-hijabs' },
          ],
        },
      ],
    },
  ];

  const optionSetIds = Object.values(createdOptionSets);

  async function createCategory(cat: any, parentId: string | null = null) {
    let existing = await prisma.category.findUnique({
      where: { slug: cat.slug },
    });

    if (!existing) {
      existing = await prisma.category.create({
        data: {
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          parentId: parentId,
          categoryOptionSets: {
            create: optionSetIds.map((id) => ({ optionSetId: id })),
          },
        },
      });
      console.log(`Created Category: ${cat.name}`);
    } else {
      console.log(`Category "${cat.name}" already exists.`);
    }

    if (cat.subcategories) {
      for (const sub of cat.subcategories) {
        await createCategory(sub, existing.id);
      }
    }
  }

  for (const cat of categories) {
    await createCategory(cat);
  }

  console.log('Seeding finished successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
