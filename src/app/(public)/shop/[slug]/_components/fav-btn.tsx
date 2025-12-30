"use client";
import { Heart } from "lucide-react";
import { useState } from "react";

export default function FavBtn() {
  const [isFav, setIsFav] = useState(false);
  return (
    <button
      onClick={() => setIsFav((v) => !v)}
      className="px-4 sm:px-6 py-2.5 sm:py-3 transition disabled:opacity-50 w-full sm:w-auto text-green-500 bg-transparent"
    >
      <Heart
        className={`w-5 h-5 inline-block mr-2 ${isFav ? "fill-green-500" : ""}`}
      />
    </button>
  );
}
