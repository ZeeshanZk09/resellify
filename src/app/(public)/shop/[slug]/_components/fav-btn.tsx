"use client";
import { Heart } from "lucide-react";
import { useState } from "react";

export default function FavBtn({ productId }: { productId: string }) {
  const [isFav, setIsFav] = useState(false);
  return (
    <button
      onClick={() => setIsFav((v) => !v)}
      aria-label={`Add ${productId} to favorites`}
      aria-pressed={isFav}
      role="switch"
    >
      <Heart
        className={` ${
          isFav ? "text-green-500 fill-green-500" : "text-green-500"
        }`}
      />
    </button>
  );
}
