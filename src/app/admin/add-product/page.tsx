import { getCategories } from '@/actions/category/category';
import { Category } from '@/shared/lib/generated/prisma/browser';
import AddProductForm from './components/add-product-client';

export default async function StoreAddProductPage() {
  // Fetch categories on the server
  const categoriesResult = await getCategories();
  const categories = categoriesResult.res || [];

  return <AddProductForm initialCategories={categories} />;
}
