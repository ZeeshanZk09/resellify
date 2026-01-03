"use client";
import {
  getFavProduct,
  getFavProducts,
  toggleFavProduct,
} from "@/actions/favourite";
import { Heart } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export default function FavBtn({ productId }: { productId: string }) {
  const [isFav, setIsFav] = useState(false);

  const fetchFavProduct = useCallback(async () => {
    const fav = (await getFavProduct(productId))?.fav!;
    setIsFav(fav);
  }, [productId]);
  const handleFav = async () => {
    const fav = (await toggleFavProduct(productId, !isFav)).fav!;
    setIsFav(!fav);
    fetchFavProduct();
  };

  useEffect(() => {
    fetchFavProduct();
  }, [fetchFavProduct]);

  return (
    <button
      onClick={handleFav}
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
