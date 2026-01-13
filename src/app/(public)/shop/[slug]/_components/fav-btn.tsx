"use client";
import { Heart } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  getFavProduct,
  getFavProducts,
  toggleFavProduct,
} from "@/actions/favourite";

export default function FavBtn({ productId }: { productId: string }) {
  const [isFav, setIsFav] = useState<boolean | null>(null);

  const fetchFavProduct = useCallback(async () => {
    console.log("[FavBtn] fetchFavProduct called for productId:", productId);
    try {
      const res = await getFavProduct(productId);
      console.log("[FavBtn] getFavProduct response:", res);
      setIsFav(res?.fav ?? false);

      if (res.error) {
        console.error("[FavBtn] res.error:", res.error);
        setIsFav(false);
        toast.error(res.error);
      }
    } catch (err) {
      console.error("[FavBtn] fetchFavProduct error:", err);
      setIsFav(false);
    }
  }, [productId]);

  const handleFav = async () => {
    console.log("[FavBtn] handleFav called, current isFav:", isFav);
    try {
      await toggleFavProduct(productId, !isFav).then((res) => {
        console.log("[FavBtn] toggleFavProduct response:", res);
        if (res.error) {
          console.error("[FavBtn] toggleFavProduct error:", res.error);
          toast.error(res.error);
        }
      });
    } catch (err) {
      console.error("[FavBtn] handleFav error:", err);
      setIsFav(false);
    } finally {
      console.log("[FavBtn] calling fetchFavProduct in finally");
      fetchFavProduct();
    }
  };

  useEffect(() => {
    console.log("[FavBtn] useEffect triggered, calling fetchFavProduct");
    fetchFavProduct();
  }, [fetchFavProduct]);
  console.log("fav-btn", isFav, !isFav);
  return (
    <button
      onClick={handleFav}
      aria-label={`Add ${productId} to favorites`}
      aria-pressed={!!isFav}
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
