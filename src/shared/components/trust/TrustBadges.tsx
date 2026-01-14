"use client";

import { Headphones, RotateCcw, Shield, Truck } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface TrustBadge {
  icon: React.ElementType;
  text: string;
  subtext: string;
  color?: string;
}

const badges: TrustBadge[] = [
  {
    icon: Shield,
    text: "100% Authentic",
    subtext: "Verified Products",
    color: "text-green-600",
  },
  {
    icon: Truck,
    text: "Fastest Delivery",
    subtext: "Same Day Available",
    color: "text-blue-600",
  },
  {
    icon: Headphones,
    text: "24/7 Support",
    subtext: "Urdu & English",
    color: "text-purple-600",
  },
  {
    icon: RotateCcw,
    text: "Easy Returns",
    subtext: "14-Day Policy",
    color: "text-orange-600",
  },
];

interface TrustBadgesProps {
  className?: string;
  variant?: "default" | "compact" | "detailed";
}

export default function TrustBadges({
  className,
  variant = "default",
}: TrustBadgesProps) {
  if (variant === "compact") {
    return (
      <div
        className={cn("flex items-center justify-center gap-4 py-3", className)}
      >
        {badges.map((badge, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <badge.icon className={cn("w-4 h-4", badge.color)} />
            <span className="hidden sm:inline font-medium">{badge.text}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <section
      className={cn(
        "bg-gradient-to-r from-green-50 via-blue-50 to-purple-50 py-6 border-y border-gray-200",
        className,
      )}
      aria-label="Trust and service guarantees"
    >
      <div className="max-w-7xl mx-auto px-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {badges.map((badge, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 rounded-lg bg-white/50 backdrop-blur-sm hover:bg-white/80 transition-colors"
            >
              <div className={cn("flex-shrink-0", badge.color)}>
                <badge.icon
                  className="w-8 h-8 md:w-10 md:h-10"
                  strokeWidth={1.5}
                />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm md:text-base text-gray-900 truncate">
                  {badge.text}
                </p>
                <p className="text-xs md:text-sm text-gray-600 truncate">
                  {badge.subtext}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Variant for use in checkout/cart pages
 */
export function TrustBadgesInline() {
  return (
    <div className="flex flex-wrap gap-3 justify-center py-4">
      {badges.map((badge, i) => (
        <div
          key={i}
          className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-full"
        >
          <badge.icon className={cn("w-4 h-4", badge.color)} />
          <span className="text-xs font-medium text-gray-700">
            {badge.text}
          </span>
        </div>
      ))}
    </div>
  );
}
