"use client";
import { GetCartItems, getCartItems, removeItemFromCart } from "@/actions/cart";
import { ShoppingBag, Trash } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export default function MyBag() {
  // Mock cart items - replace with actual cart data
  const [cartItems, setCartItems] = useState<GetCartItems>();
  const [cartItemsCount, setCartItemsCount] = useState<number>(0);
  const [productLoading, setProductLoading] = useState<boolean>(true);

  const fetchCartItems = useCallback(async () => {
    setProductLoading(true);
    const res = await getCartItems();
    setCartItems(res?.cartItems || []);
    setCartItemsCount(
      res?.cartItems?.reduce((acc, item) => acc + (item.quantity || 0), 0) || 0
    );
    setProductLoading(false);
  }, []);

  useEffect(() => {
    fetchCartItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDeleteItem = async (id: string) => {
    setProductLoading(true);
    await removeItemFromCart(id);
    await fetchCartItems();
    setProductLoading(false);
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <span key={i} className="text-yellow-400">
          ★
        </span>
      );
    }
    if (hasHalfStar) {
      stars.push(
        <span key="half" className="text-yellow-400">
          ☆
        </span>
      );
    }
    for (let i = stars.length; i < 5; i++) {
      stars.push(
        <span key={i} className="text-gray-300">
          ☆
        </span>
      );
    }

    return <div className="flex">{stars}</div>;
  };

  if (productLoading) {
    return (
      <div className="container max-w-7xl mx-auto px-4 py-8 animate-pulse">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
            <div className="h-8 w-48 bg-gray-200 rounded"></div>
          </div>
          <div className="h-6 w-24 bg-gray-200 rounded"></div>
        </div>

        <div className="divide-y divide-gray-200">
          {[...Array(3)].map((_, idx) => (
            <div key={idx} className="flex items-center gap-4 py-4">
              <div className="w-20 h-20 bg-gray-200 rounded shrink-0"></div>
              <div className="flex-1">
                <div className="h-6 w-3/4 bg-gray-200 rounded mb-2"></div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-24 bg-gray-200 rounded"></div>
                  <div className="h-4 w-12 bg-gray-200 rounded"></div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-6 w-20 bg-gray-200 rounded"></div>
                <div className="w-5 h-5 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end mt-8">
          <div className="h-12 w-40 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }
  return (
    <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <h1 className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 gap-2">
        <span className="flex items-center gap-2 sm:gap-3">
          <ShoppingBag className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
          My Bag
        </span>
        <span className="text-base sm:text-lg font-medium text-gray-600">
          {cartItemsCount} {cartItemsCount === 1 ? "item" : "items"}
        </span>
      </h1>

      {cartItems?.length === 0 || !cartItems || !cartItems[0] ? (
        <p className="text-gray-500">Your bag is empty</p>
      ) : (
        <>
          <div className="min-h-[50vh] sm:min-h-[60vh] divide-y divide-gray-200 mb-6 sm:mb-8">
            {cartItems &&
              cartItems.length > 0 &&
              Array.isArray(cartItems) &&
              cartItems[0] &&
              cartItems?.map((item) => (
                <div
                  key={item?.id}
                  className="flex items-start gap-3 sm:gap-4 py-3 sm:py-4 hover:bg-gray-50 transition-colors"
                >
                  <Link
                    href={`/shop/${item?.product.slug}`}
                    className="shrink-0"
                  >
                    <Image
                      src={item?.product.images?.[0].path ?? ""}
                      alt={item?.product.title}
                      width={item?.product.images?.[0].width ?? 0}
                      height={item?.product.images?.[0].height ?? 0}
                      className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded cursor-pointer"
                    />
                  </Link>

                  <div className="flex-1 min-w-0">
                    <Link href={`/shop/${item?.product.slug}`}>
                      <h3 className="font-semibold text-sm sm:text-base lg:text-lg cursor-pointer hover:underline truncate">
                        {item?.product.title}
                      </h3>
                    </Link>

                    <div className="flex items-center mt-1">
                      {renderStars(item?.product?.averageRating!)}
                      <span className="ml-2 text-xs sm:text-sm text-gray-600">
                        ({item?.product?.averageRating!})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-4 ml-2">
                    <span className="text-sm sm:text-lg font-bold whitespace-nowrap">
                      {item?.product.salePrice ? (
                        <>
                          <span className="hidden sm:inline line-through text-gray-500 mr-2">
                            ${item?.product.basePrice}
                          </span>
                          <span>${item?.product.salePrice}</span>
                        </>
                      ) : (
                        <>${item?.product.basePrice}</>
                      )}
                    </span>
                    <button
                      onClick={() => handleDeleteItem(item?.id)}
                      className="text-red-500 p-1 sm:px-2 sm:py-1 rounded fill-red-500 transition-colors"
                    >
                      <Trash className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                </div>
              ))}
          </div>

          <div className="flex justify-end">
            <Link
              href="/checkout"
              className="bg-green-600 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm sm:text-base"
            >
              Proceed to Checkout
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
