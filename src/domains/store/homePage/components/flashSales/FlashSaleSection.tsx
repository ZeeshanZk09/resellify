import { ChevronRight } from "lucide-react";
import Link from "next/link";
import ProductCard from "@/domains/product/components/productCard";
import FlashSaleTimer from "./FlashSaleTimer";

interface FlashSaleProduct {
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

interface FlashSaleSectionProps {
  deals: FlashSaleProduct[];
  endsAt: Date | string;
  title?: string;
  backgroundColor?: string;
}

export default function FlashSaleSection({
  deals,
  endsAt,
  title = "⚡ Flash Sale",
  backgroundColor = "from-red-500 to-pink-600",
}: FlashSaleSectionProps) {
  if (!deals || deals.length === 0) return null;

  return (
    <section
      className={`bg-gradient-to-r ${backgroundColor} text-white py-6 md:py-8`}
      aria-label="Flash sale products"
    >
      <div className="max-w-7xl mx-auto px-5">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              {title}
              <span className="inline-block animate-pulse">🔥</span>
            </h2>
            <p className="text-sm md:text-base text-white/90 mt-1">
              Limited time offers - Grab them before they're gone!
            </p>
          </div>

          {/* Timer */}
          <FlashSaleTimer endsAt={endsAt} />
        </div>

        {/* Products Grid */}
        <div className="relative">
          {/* Desktop: Horizontal Scroll */}
          <div className="hidden md:flex gap-4 overflow-x-auto scrollbar-hide pb-2">
            {deals.map((product) => (
              <div key={product.id} className="flex-shrink-0 w-64">
                <ProductCard
                  {...product}
                  className="bg-white text-gray-900 h-full"
                  showCategory={false}
                />
              </div>
            ))}
          </div>

          {/* Mobile: Grid */}
          <div className="grid grid-cols-2 md:hidden gap-3">
            {deals.slice(0, 6).map((product) => (
              <ProductCard
                key={product.id}
                {...product}
                className="bg-white text-gray-900"
                showCategory={false}
              />
            ))}
          </div>

          {/* View All Link */}
          {deals.length > 6 && (
            <div className="mt-4 text-center md:text-right">
              <Link
                href="/flash-sale"
                className="inline-flex items-center gap-2 text-white hover:text-white/80 font-medium transition-colors"
              >
                View All {deals.length} Deals
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>

        {/* Stock Alert */}
        <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
          <p className="text-sm md:text-base font-medium">
            ⚠️ Limited Stock: Items selling fast!{" "}
            <span className="font-bold">Don't miss out</span>
          </p>
        </div>
      </div>
    </section>
  );
}

/**
 * Add to globals.css:
 *
 * .scrollbar-hide {
 *   -ms-overflow-style: none;
 *   scrollbar-width: none;
 * }
 *
 * .scrollbar-hide::-webkit-scrollbar {
 *   display: none;
 * }
 */
