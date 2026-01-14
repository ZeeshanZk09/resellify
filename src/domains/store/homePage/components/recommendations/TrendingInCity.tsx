import { ChevronRight, TrendingUp } from "lucide-react";
import Link from "next/link";
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

interface TrendingInCityProps {
  city: string;
  products: Product[];
}

export default function TrendingInCity({
  city,
  products,
}: TrendingInCityProps) {
  if (!products || products.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-5 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-orange-500" />
            Trending in {city}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Popular products in your area right now
          </p>
        </div>
        <Link
          href={`/trending?city=${encodeURIComponent(city)}`}
          className="hidden md:flex items-center gap-1 text-green-600 hover:text-green-700 font-medium transition-colors"
        >
          View All
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Desktop: Grid */}
      <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {products.slice(0, 10).map((product) => (
          <ProductCard key={product.id} {...product} showCategory />
        ))}
      </div>

      {/* Mobile: Horizontal Scroll */}
      <div className="md:hidden">
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-2 px-2">
          {products.map((product) => (
            <div key={product.id} className="flex-shrink-0 w-40">
              <ProductCard {...product} showCategory={false} />
            </div>
          ))}
        </div>
      </div>

      {/* Mobile View All Link */}
      <div className="md:hidden mt-4 text-center">
        <Link
          href={`/trending?city=${encodeURIComponent(city)}`}
          className="inline-flex items-center gap-1 text-green-600 hover:text-green-700 font-medium transition-colors text-sm"
        >
          View All {products.length} Products
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* City Badge */}
      <div className="mt-6 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg p-4 text-center border border-orange-100">
        <p className="text-sm text-gray-700">
          🔥 <strong>{Math.floor(Math.random() * 500 + 100)}</strong> people in{" "}
          <strong>{city}</strong> viewed these products today
        </p>
      </div>
    </section>
  );
}
