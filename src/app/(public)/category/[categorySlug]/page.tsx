import { notFound, redirect } from "next/navigation";
import { getAllCategoriesFlat } from "@/actions/category/category";

interface CategoryOnlyPageProps {
  params: Promise<{
    categorySlug: string;
  }>;
}

export default async function CategoryOnlyPage({
  params,
}: CategoryOnlyPageProps) {
  const { categorySlug } = await params;
  const decodedCategorySlug = decodeURIComponent(categorySlug);

  const result = await getAllCategoriesFlat();

  if (!("res" in result) || !result.res) {
    notFound();
  }

  const categories = result.res;

  const parent = categories.find(
    (c) => c.slug === decodedCategorySlug && (!c as any).parentId,
  );

  if (!parent) {
    notFound();
  }

  const children = categories.filter((c) => c.parentId === parent.id);

  if (children.length > 0) {
    const firstChild = children[0];
    redirect(`/category/${parent.slug}/${firstChild.slug}`);
  }

  redirect(`/shop?category=${encodeURIComponent(parent.slug)}`);
}
