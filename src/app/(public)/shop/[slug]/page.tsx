import { getAllProducts, getProductBySlug } from "@/actions/product/product";
import { notFound } from "next/navigation";
import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { Product } from "@/shared/lib/generated/prisma/client";
import { HomeSlider } from "@/domains/store/homePage/components";
import {
  ArrowBigUpDash,
  BoxIcon,
  Heart,
  ShareIcon,
  StarIcon,
} from "lucide-react";
import FavBtn from "./_components/fav-btn";

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Generates metadata for each product page
export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const product = (await getProductBySlug((await params).slug)).res;

  if (!product) {
    return {
      title: "Product Not Found",
      description: "The product you are looking for does not exist.",
    };
  }

  return {
    title: product.title,
    description: product.description || "",
    openGraph: {
      title: product.title,
      description: product.description || "",
      images: product.images?.length > 0 ? [product.images[0].path] : [],
      url: product.canonicalUrl ?? `/shop/${product.slug}`,
    },
  };
}

// Generates static paths for all products based on their slug
export async function generateStaticParams() {
  const products = (await getAllProducts()).res;
  return (
    products?.map((product: Product) => ({
      slug: product.slug,
    })) ?? []
  );
}

export const revalidate = 0;
// Page for displaying a single product detail
export default async function ProductBySlug({ params }: ProductPageProps) {
  const product = (await getProductBySlug((await params).slug)).res;

  if (!product) {
    notFound();
  }

  return (
    <main className="text-card-foreground sm:mt-10  container mx-auto  max-w-7xl pb-20">
      {/* Responsive grid: 1 column on small screens, 2 on ≥768px, 3 on ≥1024px */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Image slider spans 1 column on small/medium, 2 columns on large */}
        <div className="md:col-span-1 lg:col-span-2 sm:hidden flex justify-center">
          <HomeSlider
            rounded={false}
            key={Math.random() * 10000}
            slides={
              product.images?.map((image) => ({
                imgUrl: image.path,
                alt: product.title,
              })) || []
            }
          />
        </div>
        <div className="col-span-1 sm:col-span-2 sm:p-6 hidden sm:flex justify-center">
          <HomeSlider
            rounded={true}
            key={product.id}
            slides={
              product.images?.map((image) => ({
                imgUrl: image.path,
                alt: product.title,
              })) || []
            }
          />
        </div>

        {/* Product details */}
        <div className="flex flex-col gap-4 px-4 sm:px-6 lg:px-8">
          {/* Price */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3 text-lg sm:text-xl mt-2 sm:mt-4">
              {product.salePrice && +product.salePrice < product.basePrice ? (
                <>
                  <span className="text-primary font-bold">
                    Rs. {product.salePrice.toFixed(2)}
                  </span>
                  <span className="line-through text-gray-500 text-xs">
                    Rs. {product.basePrice.toFixed(2)}
                  </span>
                  <span className="text-green-500 text-xs">
                    -
                    {Math.round(
                      ((product.basePrice - product.salePrice) /
                        product.basePrice) *
                        100
                    )}
                    %
                  </span>
                </>
              ) : (
                <span className="text-primary font-bold">
                  Rs. {product.basePrice.toFixed(2)}
                </span>
              )}
            </div>
            <div>
              <FavBtn />
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold">{product.title}</h1>
          {product.reviews?.length > 0 && (
            <div>
              {product.reviews.map(({ rating }) => (
                <div key={rating} className="flex items-center gap-1">
                  <StarIcon
                    size={15}
                    className="text-yellow-400 fill-yellow-400"
                  />
                  <span className="text-sm text-gray-600">{rating}</span>
                  <span className="text-sm text-gray-600">
                    ({product.reviews.filter((r) => r.rating === rating).length}{" "}
                    Rating
                    {product.reviews.filter((r) => r.rating === rating).length >
                      1 && "s"}
                    )
                  </span>
                </div>
              ))}
              {/* <h2 className="text-base sm:text-lg font-medium mb-2">
                Reviews:
              </h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {product.reviews.map((review) => (
                  <li key={review.id} className="text-sm text-gray-600">
                    <span className="font-medium">Values: </span>
                    <span>{review.comment || "N/A"}</span>
                  </li>
                ))}
              </ul> */}
            </div>
          )}

          <p className="text-sm sm:text-base text-gray-700">
            {product.description}
          </p>

          <div>
            <h4>Size: {}</h4>
          </div>

          {/* Specifications */}
          {product.productSpecs && product.productSpecs.length > 0 && (
            <div className="mt-4 sm:mt-6">
              <h2 className="text-base sm:text-lg font-medium mb-2">
                Specifications:
              </h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {product.productSpecs.map((spec) => (
                  <li key={spec.id} className="text-sm text-gray-600">
                    <span className="font-medium">Values: </span>
                    <span>{spec.values?.join(", ") || "N/A"}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* CTA */}
          <div className="sm:hidden fixed bottom-0 left-0 right-0 p-2 sm:px-6 mt-6 sm:mt-8 bg-card flex gap-2">
            <button className="bg-green-400 text-background px-4 sm:px-6 py-2.5 sm:py-3 rounded-md shadow transition disabled:opacity-50 w-full sm:w-auto">
              <BoxIcon className="inline-block mr-2" />
              Place Order
            </button>
            <button className="bg-card text-card-foreground px-4 sm:px-6 py-2.5 sm:py-3 border border-card-foreground rounded-md transition disabled:opacity-50 w-full sm:w-auto">
              <ArrowBigUpDash className="inline-block mr-2" />
              Share
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
