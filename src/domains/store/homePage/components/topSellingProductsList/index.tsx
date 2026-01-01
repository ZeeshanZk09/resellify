import Link from "next/link";

import ProductCard from "@/domains/product/components/productCard";
import { TopSellingProductType } from "@/actions/landing-dashboard/dashboard";
// import {  } from "@/domains/product/constants";

export const TopSellingProductsList = ({
  TopProducts,
}: {
  TopProducts: TopSellingProductType[] | undefined;
}) => {
  return (
    <div className="w-full my-14">
      <div className="flex w-full justify-between items-center mb-7">
        <h2 className="text-2xl font-medium text-foreground">
          Top Selling Products
        </h2>
        <Link href="/" className="text-sm sm:text-base">
          view all
        </Link>
      </div>
      <div className="w-full overflow-x-auto pb-7 2xl:pb-0">
        <div
          className={`flex justify-between gap-3.5 ${
            TopProducts && TopProducts.length > 4
              ? "overflow-x-scroll [&::-webkit-scrollbar]:h-1  [&::-webkit-scrollbar-track]:bg-foreground/20  [&::-webkit-scrollbar-thumb]:bg-foreground/20"
              : "w-full justify-between"
          }`}
        >
          {TopProducts?.map((product, index) => (
            <ProductCard
              name={product?.title}
              visibility={product.visibility}
              images={product.images}
              slug={product.slug}
              id={product.id}
              basePrice={+product?.basePrice!}
              specs={
                product?.productSpecs.map((spec) => ({
                  id: spec.id,
                  values: spec.values,
                  productId: spec.productId,
                  specGroupId: spec.specGroupId,
                })) ??
                ([] as {
                  id: string;
                  values: string[];
                  productId: string;
                  specGroupId: string;
                }[])
              }
              url={`/shop/${product.slug}`}
              dealPrice={+product?.salePrice!}
              key={index}
              staticWidth
            />
          ))}
        </div>
      </div>
    </div>
  );
};
