import {  getInitialProducts } from "@/actions/product/product";
import ProductCard from "@/domains/product/components/productCard";
import { MoveLeftIcon } from "lucide-react";
import ProductList from "./_components/ProductList";

export default async function Shop({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const search = (await searchParams)?.search ?? "";

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
  const filteredProducts = search
    ? products.filter((product) =>
        product.title.toLowerCase().includes(search.toLowerCase())
      )
    : products;

  return (
    <div className="min-h-[70vh] mx-6">
      <div className="max-w-7xl mx-auto">
        <a
          href="/shop"
          className="text-2xl text-slate-500 my-6 flex items-center gap-2 cursor-pointer"
        >
          {search && <MoveLeftIcon size={20} />}
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
