export function ProductCardSkeleton() {
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden animate-pulse">
      {/* Image Skeleton */}
      <div className="aspect-square w-full bg-gray-200" />

      {/* Content Skeleton */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <div className="h-4 bg-gray-200 rounded w-3/4" />

        {/* Category */}
        <div className="h-3 bg-gray-200 rounded w-1/2" />

        {/* Price */}
        <div className="flex gap-2">
          <div className="h-5 bg-gray-200 rounded w-20" />
          <div className="h-5 bg-gray-200 rounded w-16" />
        </div>

        {/* Rating */}
        <div className="h-4 bg-gray-200 rounded w-24" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="w-full aspect-[16/9] md:aspect-[21/9] bg-gray-200 rounded-xl animate-pulse" />
  );
}

export function CategoryListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 bg-gray-100 rounded-lg animate-pulse"
        >
          <div className="w-10 h-10 bg-gray-200 rounded" />
          <div className="h-4 bg-gray-200 rounded w-24" />
        </div>
      ))}
    </div>
  );
}

export function NewsletterSkeleton() {
  return (
    <div className="bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl p-8 animate-pulse">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="h-8 bg-gray-300 rounded w-3/4 mx-auto" />
        <div className="h-4 bg-gray-300 rounded w-1/2 mx-auto" />
        <div className="h-12 bg-gray-300 rounded w-full" />
      </div>
    </div>
  );
}

export function FlashSaleSkeleton() {
  return (
    <div className="bg-gradient-to-r from-red-200 to-pink-200 rounded-xl p-6 animate-pulse">
      <div className="flex justify-between items-center mb-6">
        <div className="h-8 bg-red-300 rounded w-48" />
        <div className="h-12 bg-red-300 rounded w-64" />
      </div>
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex-shrink-0 w-64 h-80 bg-white/50 rounded-lg"
          />
        ))}
      </div>
    </div>
  );
}
