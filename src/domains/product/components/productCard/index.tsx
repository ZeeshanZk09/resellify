"use client";
import { Check, Eye, Heart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { addItemToCart, getCartItems } from "@/actions/cart";
import { getFavProduct, toggleFavProduct } from "@/actions/favourite";
import type { Visibility } from "@/shared/lib/generated/prisma/enums";
import { cn } from "@/shared/lib/utils";

interface ProductCardProps {
  id: string;
  name: string;
  url?: string;
  slug: string;
  images?: Array<{ path: string }>;
  basePrice?: number;
  dealPrice?: number;
  visibility?: Visibility;
  specs?: Array<{ values: string[] }>;
  category?: string;
  rating?: number;
  reviewCount?: number;
  showCategory?: boolean;
  className?: string;
}

export default function ProductCard({
  id,
  name,
  url,
  slug,
  images,
  basePrice = 0,
  dealPrice,
  visibility = "PUBLIC",
  specs,
  category,
  rating,
  reviewCount = 0,
  showCategory = true,
  className,
}: ProductCardProps & { ref?: React.Ref<HTMLDivElement> }) {
  const [isFav, setIsFav] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  useEffect(() => {
    getFavProduct(id!).then(({ fav }) => {
      setIsFav(fav!);
    });
    getCartItems().then(({ cartItems }) => {
      setAddedToCart(!!cartItems.find((ci) => ci.productId === id));
    });
  }, []);

  const discount =
    dealPrice && basePrice
      ? Math.round(100 - (dealPrice / +basePrice) * 100)
      : 0;

  const isInStock = visibility === "PUBLIC";

  return (
    <Link
      href={url || `/shop/${slug}`}
      className={cn(
        className,
        "group relative flex flex-col w-full h-auto",
        "bg-card rounded-xl border border-border overflow-hidden",
        "transition-all duration-300 hover:shadow-lg",
        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
      )}
      aria-label={`View ${name} product details`}
    >
      {/* Discount Badge */}
      {discount > 0 && (
        <div className="absolute top-3 left-3 z-10">
          <span className="inline-flex items-center justify-center px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full shadow-lg">
            -{discount}%
          </span>
        </div>
      )}

      {/* Favorite Button */}
      <button
        className="absolute top-3 right-3 z-10 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
        aria-label={`Add ${name} to favorites`}
        onClick={async (e) => {
          e.preventDefault();
          e.stopPropagation();
          await toggleFavProduct(id, !isFav);
          getFavProduct(id!).then(({ fav }) => {
            setIsFav(fav!);
          });
        }}
      >
        <Heart
          className={`h-4 w-4 text-green-500 ${isFav ? "fill-green-500" : ""}`}
        />
      </button>

      {/* Image Container */}
      <div className="relative aspect-square w-full overflow-hidden bg-white">
        {images?.[0]?.path ? (
          <Image
            src={images[0].path}
            alt={name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
            className="object-contain transition-transform duration-500 group-hover:scale-110 p-4"
            priority={false}
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full bg-muted text-muted-foreground">
            <span className="text-sm">No Image</span>
          </div>
        )}

        {/* Stock Status Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/60 to-transparent p-3">
          <div className="flex items-center justify-between">
            <span
              className={cn(
                "text-xs font-semibold px-2 py-1 rounded",
                isInStock
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700",
              )}
            >
              {isInStock ? "In Stock" : "Out of Stock"}
            </span>

            {/* Rating (Mobile) */}
            {rating && rating > 0 && (
              <div className="hidden xs:flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-1 rounded">
                <span className="text-xs font-bold text-amber-600">
                  {rating.toFixed(1)}
                </span>
                <span className="text-xs text-gray-500">★</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Container */}
      <div className="flex flex-col grow p-4">
        {/* Category */}
        {showCategory && category && (
          <span className="text-xs text-gray-500 mb-1 truncate">
            {category}
          </span>
        )}

        {/* Product Name */}
        <h3 className="text-sm font-semibold text-foreground mb-2 line-clamp-2 h-10">
          {name}
        </h3>

        {/* Specifications */}
        {specs && specs.length > 0 && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-1">
              {specs.slice(0, 3).map(({ values }, index) => (
                <span
                  key={index}
                  className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded truncate max-w-full"
                  title={values.join(", ")}
                >
                  {values.join(", ")}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Rating (Desktop) */}
        {rating && rating > 0 && (
          <div className="hidden xs:flex items-center gap-2 mb-3">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <span
                  key={i}
                  className={`text-sm ${
                    i < Math.floor(rating) ? "text-amber-400" : "text-gray-300"
                  }`}
                >
                  ★
                </span>
              ))}
            </div>
            <span className="text-xs text-gray-500">({reviewCount})</span>
          </div>
        )}

        {/* Price Section */}
        <div className="mt-auto pt-3 border-t">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              {dealPrice ? (
                <>
                  <span className="text-lg font-bold text-primary">
                    {dealPrice.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                    Rs
                  </span>
                  {basePrice && +basePrice > dealPrice && (
                    <span className="text-xs line-through text-gray-500">
                      {basePrice.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                      Rs
                    </span>
                  )}
                </>
              ) : (
                <span className="text-lg font-bold text-foreground">
                  {basePrice?.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}
                  Rs
                </span>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              {/* Add to Cart Button (Desktop) */}
              <button
                className="hidden sm:inline-flex items-center justify-center px-3 py-1.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
                aria-label={`Add ${name} to cart`}
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (addedToCart) {
                    toast.warning("Product already added to cart");
                    return;
                  }
                  await addItemToCart(id, basePrice - dealPrice!, 1);
                  getCartItems().then(({ cartItems }) => {
                    setAddedToCart(
                      cartItems.find((ci) => ci.productId === id)
                        ? true
                        : false,
                    );
                  });
                }}
              >
                {addedToCart ? <Check /> : "Add"}
              </button>

              {/* Add to Cart Icon (Mobile) */}
              <button
                className="sm:hidden flex items-center justify-center p-2 rounded-full bg-primary text-white hover:bg-primary/90"
                aria-label={`Add ${name} to cart`}
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (addedToCart) {
                    toast.warning("Product already added to cart");
                    return;
                  }

                  await addItemToCart(id, basePrice - dealPrice!, 1);
                  getCartItems().then(({ cartItems }) => {
                    setAddedToCart(
                      cartItems.find((ci) => ci.productId === id)
                        ? true
                        : false,
                    );
                  });
                }}
              >
                {addedToCart ? (
                  <Check />
                ) : (
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Additional Info (Desktop) */}
        <div className="hidden sm:flex items-center justify-between text-xs text-gray-500 mt-2">
          <span className="flex items-center gap-1">
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                clipRule="evenodd"
              />
            </svg>
            Free shipping
          </span>
          <span className="flex items-center gap-1">
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            Verified
          </span>
        </div>
      </div>

      {/* Hover Effect Border */}
      <div className="absolute inset-0 border-2 border-transparent group-hover:border-primary/20 rounded-xl pointer-events-none transition-colors" />
    </Link>
  );
}
