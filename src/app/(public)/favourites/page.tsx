"use client";
import { addItemToCart, getCartItems } from "@/actions/cart";
import { GetFavProducts, getFavProducts } from "@/actions/favourite";
import { Button } from "@/shared/components/ui/button";
import { Loader } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function Favourites() {
  const [cartProductIds, setCartProductIds] = useState<Set<string>>(new Set());
  const [favs, setFavs] = useState<GetFavProducts>([]);
  const [loading, setLoading] = useState(true);
  const [addToCartLoading, setAddToCartLoading] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    Promise.all([
      getFavProducts().then((res) => setFavs(res?.favs || [])),
      getCartItems().then((res) => {
        const ids = res?.cartItems?.map((item) => item.productId) || [];
        setCartProductIds(new Set(ids));
      }),
    ])
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleAddToCart = async (
    productId: string,
    price: number,
    quantity: number
  ) => {
    setAddToCartLoading((prev) => new Set(prev).add(productId));
    try {
      await addItemToCart(productId, price, quantity);
      setCartProductIds((prev) => new Set(prev).add(productId));
      toast.success("Product added to cart");
    } catch (err) {
      console.error(err);
      toast.error("Failed to add product to cart");
    } finally {
      setAddToCartLoading((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="max-w-sm border rounded-lg p-4 animate-pulse">
            <div className="w-full h-40 bg-gray-200 rounded mb-3" />
            <div className="h-6 bg-gray-200 rounded mb-2" />
            <div className="h-4 bg-gray-200 rounded mb-2" />
            <div className="h-5 bg-gray-200 rounded w-20" />
            <div className="w-full h-10 bg-gray-200 rounded mt-2" />
          </div>
        ))}
      </div>
    );
  }

  if (favs?.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-gray-500">
        <p className="text-xl">You haven't liked any products yet.</p>
        <p className="text-sm mt-2">
          Explore and like products to see them here.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Your Favourites</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {favs &&
          favs?.map((product) => {
            const isInCart = cartProductIds.has(product.product.id);
            const isAdding = addToCartLoading.has(product.product.id);
            return (
              <div
                key={product.id}
                className="max-w-sm border rounded-lg p-4 hover:shadow-lg transition cursor-pointer"
              >
                <Link href={`/shop/${product.product.slug}`}>
                  <img
                    src={product.product.images?.[0]?.path}
                    alt={product.product.title}
                    className="w-full h-40 object-cover rounded mb-3"
                  />
                  <h2 className="font-semibold text-lg">
                    {product.product.title}
                  </h2>
                  <p className="truncate">{product.product.description}</p>
                  {product.product.salePrice &&
                  product.product.salePrice < product.product.basePrice ? (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 line-through">
                        ${product.product.basePrice.toFixed(2)}
                      </span>
                      <span className="text-red-600 font-semibold">
                        ${product.product.salePrice.toFixed(2)}
                      </span>
                    </div>
                  ) : (
                    <p className="text-gray-700">
                      ${product.product.basePrice?.toFixed(2)}
                    </p>
                  )}
                </Link>
                {isAdding ? (
                  <Button className="w-full mt-2" disabled>
                    <Loader className="animate-spin w-4 h-4 mr-2" />
                    Adding...
                  </Button>
                ) : isInCart ? (
                  <Link href="/checkout" passHref>
                    <Button className="w-full mt-2">Checkout</Button>
                  </Link>
                ) : (
                  <Button
                    className="w-full mt-2"
                    onClick={() =>
                      handleAddToCart(
                        product.product.id,
                        product.product.basePrice,
                        1
                      )
                    }
                  >
                    Add to Cart
                  </Button>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
