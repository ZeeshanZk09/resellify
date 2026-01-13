import { MoveLeftIcon } from "lucide-react";
import { headers } from "next/headers";
import { addVisit } from "@/actions/pageVisit/pageVisitServices";
import { getInitialProducts } from "@/actions/product/product";
import ProductCard from "@/domains/product/components/productCard";
import ProductList from "./_components/ProductList";

export default async function Shop({
  searchParams,
}: {
  searchParams: Promise<{ query?: string }>;
}) {
  // Get `query` from the search params, which can be a product name, category name, or tag
  const query = decodeURIComponent((await searchParams)?.query?.trim() ?? "");

  // Server-side fetch
  const products = (await getInitialProducts(10)).res;

  if (!products) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <p className="text-slate-500">Products not found.</p>
      </div>
    );
  }

  // Server-side filtering
  const filteredProducts = query
    ? products.filter((product) => {
        const titleMatch = product.title
          ?.toLowerCase()
          .includes(query.toLowerCase());
        const categoryMatch = product.categories.map(({ category }) =>
          category?.name?.toLowerCase().includes(query.toLowerCase()),
        );
        const tagsMatch = Array.isArray(product.tags)
          ? product.tags.some((tag: any) =>
              tag?.name?.toLowerCase().includes(query.toLowerCase()),
            )
          : false;
        return titleMatch || categoryMatch || tagsMatch;
      })
    : products;

  const headerList = await headers();
  const currentPath =
    headerList.get("x-pathname") || headerList.get("referer") || "/";
  await addVisit(currentPath);

  return (
    <div className="min-h-[70vh] mx-6">
      <div className="max-w-7xl mx-auto">
        <a
          href="/shop"
          className="text-2xl text-slate-500 my-6 flex items-center gap-2 cursor-pointer"
        >
          {query && <MoveLeftIcon size={20} />}
          All <span className="text-slate-700 font-medium">Products</span>
        </a>
        <ProductList
          initialProducts={products}
          filteredProducts={filteredProducts}
        />
      </div>
    </div>
  );
}
