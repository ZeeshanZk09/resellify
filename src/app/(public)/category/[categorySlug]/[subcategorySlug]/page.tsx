import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { addVisit } from "@/actions/pageVisit/pageVisitServices";
import {
  getCategoryBySlugPath,
  getAllCategoriesFlat,
} from "@/actions/category/category";
import { getCategoryProducts } from "@/actions/product/product";
import ProductList from "@/app/(public)/shop/_components/ProductList";
// import ProductList from "../../shop/_components/ProductList";

interface CategoryPageProps {
  params: Promise<{
    categorySlug: string;
    subcategorySlug: string;
  }>;
}

export const revalidate = 60;

export async function generateStaticParams() {
  const result = await getAllCategoriesFlat();

  if (!("res" in result) || !result.res) {
    return [];
  }

  const categories = result.res;
  const parents = categories.filter((c) => !c.parentId);

  const params: { categorySlug: string; subcategorySlug: string }[] = [];

  parents.forEach((parent) => {
    const children = categories.filter((c) => c.parentId === parent.id);
    children.forEach((child) => {
      params.push({
        categorySlug: parent.slug,
        subcategorySlug: child.slug,
      });
    });
  });

  return params;
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { categorySlug, subcategorySlug } = await params;

  const categoryContext = await getCategoryBySlugPath(
    decodeURIComponent(categorySlug),
    decodeURIComponent(subcategorySlug)
  );

  if (!("res" in categoryContext) || !categoryContext.res) {
    return {
      title: "Category Not Found",
      description: "The category you are looking for does not exist.",
      robots: "noindex, nofollow",
    };
  }

  const { parent, category } = categoryContext.res;

  const baseTitle = category.name || "Products";
  const parentTitle = parent && parent.id !== category.id ? parent.name : null;

  const title = parentTitle ? `${baseTitle} – ${parentTitle}` : baseTitle;
  const description =
    category.description ||
    parent?.description ||
    `Browse ${baseTitle} products available in our store.`;

  return {
    title,
    description,
    openGraph: {
      type: "website",
      title,
      description,
      url: `/category/${categorySlug}/${subcategorySlug}`,
      siteName: "GO Shop",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: {
      canonical: `/category/${categorySlug}/${subcategorySlug}`,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { categorySlug, subcategorySlug } = await params;

  const decodedCategorySlug = decodeURIComponent(categorySlug);
  const decodedSubcategorySlug = decodeURIComponent(subcategorySlug);

  const categoryContext = await getCategoryBySlugPath(
    decodedCategorySlug,
    decodedSubcategorySlug
  );

  if (!("res" in categoryContext) || !categoryContext.res) {
    notFound();
  }

  const { parent, category } = categoryContext.res;

  const productsResult = await getCategoryProducts(
    decodedCategorySlug,
    decodedSubcategorySlug,
    10
  );

  const products = "res" in productsResult ? productsResult.res : null;

  const headerList = await headers();
  const currentPath =
    headerList.get("x-pathname") || headerList.get("referer") || "/";
  await addVisit(currentPath);

  if (!products || products.length === 0) {
    return (
      <main
        id="main-content"
        className="min-h-[70vh] mx-6 flex items-center justify-center"
        role="main"
        aria-label="Category products"
      >
        <div className="max-w-2xl text-center">
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-800 mb-3">
            {category.name}
          </h1>
          <p className="text-slate-500">
            No products found in this category yet.
          </p>
        </div>
      </main>
    );
  }

  const heading =
    parent && parent.id !== category.id ? `${category.name}` : category.name;

  return (
    <main
      id="main-content"
      className="min-h-[70vh] mx-6"
      role="main"
      aria-label="Category products"
    >
      <div className="max-w-7xl mx-auto">
        <nav
          className="text-sm text-slate-500 mt-6 mb-4"
          aria-label="Breadcrumb"
        >
          <ol className="flex flex-wrap items-center gap-1">
            <li>
              <a href="/" className="hover:text-slate-700">
                Home
              </a>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <a href="/shop" className="hover:text-slate-700">
                Shop
              </a>
            </li>
            <li aria-hidden="true">/</li>
            {parent && parent.id !== category.id && (
              <>
                <li className="text-slate-600">{parent.name}</li>
                <li aria-hidden="true">/</li>
              </>
            )}
            <li className="text-slate-800 font-medium" aria-current="page">
              {category.name}
            </li>
          </ol>
        </nav>

        <header className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">
            {heading}
          </h1>
          {(category.description || parent?.description) && (
            <p className="mt-2 max-w-2xl text-slate-600">
              {category.description || parent?.description}
            </p>
          )}
        </header>

        <section aria-label="Product list">
          <ProductList
            initialProducts={products}
            filteredProducts={products}
            loadMoreMode="category"
            categorySlug={decodedCategorySlug}
            subcategorySlug={decodedSubcategorySlug}
          />
        </section>
      </div>
    </main>
  );
}
