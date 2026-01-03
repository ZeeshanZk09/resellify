import { GetRelatedProducts } from "@/actions/product/product";
import ProductCard from "@/domains/product/components/productCard";
export default function RelatedProducts({
  products,
}: {
  products: GetRelatedProducts;
}) {
  if (!products || products.length === 0) return null;
  return (
    <div className="mt-8 space-y-8">
      <h2 className="text-2xl font-medium text-foreground">Related Products</h2>
      <div className="w-full overflow-x-auto pb-7 2xl:pb-0">
        <div
          className={`flex gap-3.5 overflow-x-scroll [&::-webkit-scrollbar]:h-1  [&::-webkit-scrollbar-track [&::-webkit-scrollbar-thumb]:bg-foreground/20 py-2`}
        >
          {products.map((product) => (
            <ProductCard
              id={product.id}
              slug={product.slug}
              name={product?.title}
              visibility={product.visibility}
              images={product.images}
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
              key={product.id}
              className="w-[240px] shrink-0"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
