'use server';

import { findCategoryByQuery } from '@/actions/category/category';
import { searchProductByQuery } from '@/actions/product/product';
import Fuse from 'fuse.js';

export type SearchApiResult =
  | {
      type: 'category';
      parentSlug: string;
      categorySlug: string;
    }
  | {
      type: 'product';
      slug: string;
    }
  | null;

export async function globalSearch(prevState: any, formData: FormData) {
  const query = formData.get('q') as string;
  const normalizedQuery = query?.trim().toLowerCase();

  if (!normalizedQuery) {
    return { result: null, error: 'Query is required' };
  }

  try {
    const [categoryResult, productResult] = await Promise.all([
      findCategoryByQuery(normalizedQuery),
      searchProductByQuery(normalizedQuery),
    ]);

    const documents: any[] = [];
    if (categoryResult.data && !categoryResult.error) {
      const { parentSlug, categorySlug } = categoryResult.data;
      documents.push({
        type: 'category',
        parentSlug,
        categorySlug,
        label: `${parentSlug}/${categorySlug}`,
      });
    }

    if (productResult.data && !productResult.error) {
      const { slug } = productResult.data;
      documents.push({
        type: 'product',
        slug,
        label: slug,
      });
    }

    if (documents.length === 0) {
      return { result: null };
    }

    if (documents.length === 1) {
      return { result: documents[0] };
    }

    const fuse = new Fuse(documents, {
      keys: ['label'],
      includeScore: true,
      threshold: 0.4,
      distance: 100,
    });

    const [best] = fuse.search(normalizedQuery);
    const result = best?.item ?? documents[0];

    return { result };
  } catch (error) {
    console.error('Search error:', error);
    return { result: null, error: 'Search failed' };
  }
}
