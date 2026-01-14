"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import ProductCard from "@/domains/product/components/productCard";

interface Product {
  id: string;
  name: string;
  slug: string;
  images?: Array<{ path: string }>;
  basePrice: number;
  dealPrice?: number;
  visibility?: "PUBLIC" | "PRIVATE" | "UNLISTED";
  rating?: number;
  reviewCount?: number;
}

export default function RecentlyViewed() {
  const [viewedProducts, setViewedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get recently viewed from localStorage
    const getRecentlyViewed = () => {
      try {
        const stored = localStorage.getItem("recentlyViewed");
        if (stored) {
          const productIds = JSON.parse(stored);
          // Fetch product details
          fetchProductDetails(productIds.slice(0, 10));
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error loading recently viewed:", error);
        setIsLoading(false);
      }
    };

    const fetchProductDetails = async (ids: string[]) => {
      try {
        const response = await fetch("/api/products/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids }),
        });

        if (response.ok) {
          const products = await response.json();
          setViewedProducts(products);
        }
      } catch (error) {
        console.error("Error fetching product details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    getRecentlyViewed();
  }, []);

  if (isLoading) {
    return (
      <section className="max-w-7xl mx-auto px-5 py-8">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="flex gap-4 overflow-x-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex-shrink-0 w-64 h-80 bg-gray-200 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </section>
    );
  }

  if (!viewedProducts || viewedProducts.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-5 py-8 bg-gray-50 rounded-xl my-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            👀 Recently Viewed
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Continue where you left off
          </p>
        </div>
        <button
          onClick={() => {
            localStorage.removeItem("recentlyViewed");
            setViewedProducts([]);
          }}
          className="text-sm text-gray-500 hover:text-gray-700 underline"
        >
          Clear History
        </button>
      </div>

      {/* Horizontal Scroll Container */}
      <div className="relative">
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-2 px-2">
          {viewedProducts.map((product) => (
            <div key={product.id} className="flex-shrink-0 w-48 md:w-64">
              <ProductCard {...product} showCategory={false} />
            </div>
          ))}
        </div>

        {/* Scroll Indicators (optional) */}
        <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 pointer-events-none hidden md:flex justify-between px-2">
          <div className="w-8 h-full bg-gradient-to-r from-gray-50 to-transparent" />
          <div className="w-8 h-full bg-gradient-to-l from-gray-50 to-transparent" />
        </div>
      </div>
    </section>
  );
}

/**
 * Helper hook to track product views
 * Use this on product detail pages
 */
export function useTrackProductView(productId: string) {
  useEffect(() => {
    if (!productId) return;

    try {
      const stored = localStorage.getItem("recentlyViewed");
      let viewed: string[] = stored ? JSON.parse(stored) : [];

      // Remove if already exists (to move to front)
      viewed = viewed.filter((id) => id !== productId);

      // Add to front
      viewed.unshift(productId);

      // Keep only last 20
      viewed = viewed.slice(0, 20);

      localStorage.setItem("recentlyViewed", JSON.stringify(viewed));
    } catch (error) {
      console.error("Error tracking product view:", error);
    }
  }, [productId]);
}
