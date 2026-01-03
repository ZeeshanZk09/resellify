"use client";
import {
  GetInitialProducts,
  loadMoreProducts,
} from "@/actions/product/product";
import ProductCard from "@/domains/product/components/productCard";
import { useCallback, useEffect, useRef, useState } from "react";
import ProductSkeleton from "./ProductSkeleton";

interface ProductListProps {
  initialProducts: NonNullable<GetInitialProducts>;
  filteredProducts: NonNullable<GetInitialProducts>;
}
export default function ProductList({
  initialProducts,
  filteredProducts,
}: ProductListProps) {
  const [products, setProducts] =
    useState<NonNullable<GetInitialProducts>>(initialProducts);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastId, setLastId] = useState<string | null>(
    initialProducts[initialProducts.length - 1]?.id || null
  );

  // Load more products function
  const loadMore = useCallback(async () => {
    if (!lastId || isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const result = (await loadMoreProducts(lastId, 10)).res;

      if (result?.products?.length! > 0) {
        setProducts((prev) => [...prev, ...(result?.products || [])]);
        setLastId(result?.lastId || null);
        setHasMore(result?.hasMore || false);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Failed to load more products:", error);
    } finally {
      setIsLoading(false);
    }
  }, [lastId, isLoading, hasMore]);

  // Intersection Observer ke liye reference
  const observerRef = useRef<IntersectionObserver>(null);
  const lastProductRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isLoading) return;

      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore) {
            loadMore();
          }
        },
        { threshold: 1.0 }
      );

      if (node) {
        observerRef.current.observe(node);
      }
    },
    [isLoading, hasMore, loadMore]
  );

  // Alternative: Scroll event listener (agar browser support ka issue ho)
  useEffect(() => {
    if (filteredProducts.length > 0) setProducts(filteredProducts);
    const handleScroll = () => {
      const { scrollTop, clientHeight, scrollHeight } =
        document.documentElement;

      // Jab user bottom se 100px pehle pahunche, tab load karenge
      if (
        scrollTop + clientHeight >= scrollHeight - 100 &&
        !isLoading &&
        hasMore
      ) {
        loadMore();
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isLoading, hasMore, loadMore]);

  if (isLoading) return <ProductSkeleton />;

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 xl:gap-12 mx-auto mb-32">
        {products?.map(
          (
            {
              averageRating,
              waitlists,
              visibility,
              updatedAt,
              twitterCard,
              translations,
              title,
              tags,
              structuredData,
              status,
              slug,
              sku,
              shortDescription,
              salePrice,
              reviews,
              reviewCount,
              publishedAt,
              productVariants,
              productSpecs,
              productOffers,
              price,
              orderItems,
              ogTitle,
              ogImageId,
              ogDescription,
              metadata,
              metaTitle,
              metaKeywords,
              metaDescription,
              locale,
              images,
              inventory,
              id,
              featured,
              favouritedBy,
              description,
              currency,
              couponProducts,
              categories,
              canonicalUrl,
              basePrice,
            },
            index
          ) => (
            <ProductCard
              className="sm:col-span-2 "
              ref={index === products.length - 1 ? lastProductRef : null}
              visibility={visibility}
              images={images}
              key={id}
              dealPrice={+salePrice!}
              name={title}
              basePrice={+basePrice!}
              id={id}
              slug={slug}
              specs={productSpecs}
              url={`/shop/${slug}`}
            />
          )
        )}

        {!hasMore && products.length > 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>All products loaded!</p>
          </div>
        )}

        {products.length === 0 && !isLoading && (
          <div className="text-center py-8 text-gray-500">
            <p>No products found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
