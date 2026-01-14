"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { cn } from "@/shared/lib/utils";

interface PurchaseEvent {
  id: string;
  productName: string;
  productImage: string;
  city: string;
  timeAgo: string;
  productSlug?: string;
}

interface LivePurchaseNotificationProps {
  pollingInterval?: number; // milliseconds
  displayDuration?: number; // milliseconds
}

export default function LivePurchaseNotification({
  pollingInterval = 30000, // 30 seconds
  displayDuration = 5000, // 5 seconds
}: LivePurchaseNotificationProps) {
  const [currentPurchase, setCurrentPurchase] = useState<PurchaseEvent | null>(
    null,
  );
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const fetchRecentPurchase = async () => {
      try {
        const response = await fetch("/api/recent-purchases?limit=1");
        if (!response.ok) return;

        const data = await response.json();
        if (data.purchases && data.purchases.length > 0) {
          const purchase = data.purchases[0];
          setCurrentPurchase(purchase);
          setIsVisible(true);

          // Hide after displayDuration
          setTimeout(() => {
            setIsVisible(false);
          }, displayDuration);
        }
      } catch (error) {
        console.error("Failed to fetch recent purchases:", error);
      }
    };

    // Initial fetch
    fetchRecentPurchase();

    // Poll for updates
    const interval = setInterval(fetchRecentPurchase, pollingInterval);

    return () => clearInterval(interval);
  }, [pollingInterval, displayDuration]);

  if (!currentPurchase || !isVisible) return null;

  return (
    <div
      className={cn(
        "fixed bottom-20 md:bottom-6 left-4 right-4 md:right-auto md:left-4 z-40",
        "max-w-sm",
        "animate-slide-in",
      )}
      role="status"
      aria-live="polite"
    >
      <div className="bg-white shadow-2xl rounded-xl p-4 border border-gray-200 backdrop-blur-sm">
        <div className="flex gap-3 items-center">
          {/* Product Image */}
          <div className="flex-shrink-0 relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
            <Image
              src={currentPurchase.productImage}
              alt={currentPurchase.productName}
              fill
              className="object-cover"
              sizes="48px"
            />
          </div>

          {/* Purchase Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">
              Someone from{" "}
              <strong className="text-green-600">{currentPurchase.city}</strong>{" "}
              just bought
            </p>
            <p className="text-xs text-gray-600 truncate mt-1">
              {currentPurchase.productName}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {currentPurchase.timeAgo}
            </p>
          </div>

          {/* Dismiss Button */}
          <button
            onClick={() => setIsVisible(false)}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600"
            aria-label="Dismiss notification"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {/* Trust Indicator */}
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-500">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span>
            🔥 {Math.floor(Math.random() * 50 + 10)} people viewing this now
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Add this to globals.css for the slide-in animation:
 *
 * @keyframes slide-in {
 *   from {
 *     transform: translateX(-100%);
 *     opacity: 0;
 *   }
 *   to {
 *     transform: translateX(0);
 *     opacity: 1;
 *   }
 * }
 *
 * .animate-slide-in {
 *   animation: slide-in 0.4s ease-out;
 * }
 */
