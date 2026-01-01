"use client";
import { useMobile } from "@/shared/utils/useMobile";
import { PlusIcon } from "lucide-react";
import React from "react";

export default function ProductReviews({
  reviews,
}: {
  reviews: {
    id: string;
    title: string | null;
    createdAt: Date;
    updatedAt: Date | null;
    productId: string;
    userId: string;
    rating: number;
    comment: string | null;
  }[];
}) {
  const isMobile = useMobile();
  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-medium text-foreground">
          Product Reviews
        </h2>
        {!isMobile ? (
          <button
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={() => {
              // TODO: Implement add review logic
            }}
          >
            Write a Review
          </button>
        ) : (
          <button
            onClick={() => {
              // TODO: Implement add review logic
            }}
          >
            <PlusIcon />
          </button>
        )}
      </div>
      {reviews.length === 0 ? (
        <div className="mt-4">
          <p className="text-sm text-gray-500">
            No reviews yet. Be the first to review this product!
          </p>
        </div>
      ) : (
        <div className="mt-4">
          {reviews.map((review) => (
            <div key={review.id} className="mb-4">
              <p className="text-sm text-gray-500">{review.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
