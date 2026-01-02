import { getAllProducts, getProductBySlug, getRelatedProducts } from '@/actions/product/product';
import { notFound } from 'next/navigation';
import React from 'react';
import { Metadata } from 'next';
import Image from 'next/image';
import { Product } from '@/shared/lib/generated/prisma/client';
import { HomeSlider } from '@/domains/store/homePage/components';
import {
  ArrowBigUpDash,
  BoxIcon,
  Heart,
  ShareIcon,
  StarIcon,
  Truck,
  Shield,
  RefreshCw,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import FavBtn from './_components/fav-btn';
import AddToCartButton from './_components/add-to-cart-button';
import ProductVariantSelector from './_components/product-variant-selector';
import Breadcrumbs from './_components/breadcrumbs';
import ProductReviews from './_components/product-reviews';
import ProductSpecifications from './_components/product-specifications';
import ProductGallery from './_components/product-gallery';
import StockIndicator from './_components/stock-indicator';
import SocialShare from './_components/social-share';
import RelatedProducts from './_components/related-products';
import ProductStructuredData from './_components/product-structured-data';

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const revalidate = 0;

// Generates metadata for each product page
export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const slug = decodeURIComponent((await params).slug);
  const product = (await getProductBySlug(slug)).res;

  if (!product) {
    return {
      title: 'Product Not Found',
      description: 'The product you are looking for does not exist.',
      robots: 'noindex, nofollow',
    };
  }

  const images = product.images?.map((img) => img.path) || [];
  //   const price = product.salePrice || product.basePrice;

  return {
    title: product.metaTitle || product.title,
    description: (product.metaDescription ||
      product.shortDescription ||
      product.description?.slice(0, 160)) as string,
    keywords:
      typeof product.metaKeywords === 'string'
        ? product.metaKeywords.split(',').map((k) => k.trim())
        : [],
    authors: [{ name: 'Muhammad Zeeshan Khan' }],
    openGraph: {
      type: 'website',
      title: product.ogTitle || product.title,
      description: (product?.ogDescription! ||
        product?.shortDescription! ||
        product?.description?.slice(0, 200)!) as string,
      images: images.length > 0 ? images : [],
      url: `/shop/${product.slug}`,
      siteName: 'GO Shop',
      locale: product.locale || 'en_US',
    },
    twitter: {
      card: product.twitterCard === 'SUMMARY_LARGE_IMAGE' ? 'summary_large_image' : 'summary',
      title: product.title,
      description: (product?.ogDescription! ||
        product?.shortDescription! ||
        product?.description?.slice(0, 200)!) as string,
      images: images.length > 0 ? [images[0]] : [],
    },
    alternates: {
      canonical: product.canonicalUrl || `/shop/${product.slug}`,
    },
    robots: {
      index: product.visibility === 'PUBLIC',
      follow: product.visibility === 'PUBLIC',
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

// Preload critical image
function preloadImage(imageUrl: string) {
  return {
    rel: 'preload',
    href: imageUrl,
    as: 'image',
    type: 'image/jpeg',
  };
}

export default async function ProductBySlug({ params }: ProductPageProps) {
  const slug = decodeURIComponent((await params).slug);
  console.log('product-slug: ', slug);

  const product = (await getProductBySlug(slug)).res;
  const relatedProducts = (
    await getRelatedProducts(
      product?.id!,
      product?.categories?.map((cat) => cat.category.id).join(',') || ''
    )
  ).res;
  if (!product) {
    notFound();
  }

  const images = product.images || [];
  const price = product.salePrice || product.basePrice;
  const discount = product.salePrice
    ? Math.round(((product.basePrice - product.salePrice) / product.basePrice) * 100)
    : 0;

  // Preload first image for better LCP
  const preloadLinks = images.length > 0 ? [preloadImage(images[0].path)] : [];

  return (
    <>
      {/* Add preload links for critical resources */}
      {preloadLinks.map((link, index) => (
        <link key={index} {...link} />
      ))}

      {/* Structured data for SEO */}
      <ProductStructuredData structuredData={product.structuredData} />

      <main
        id='main-content'
        className='text-card-foreground container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-10'
        role='main'
        aria-label='Product details'
      >
        {/* Breadcrumbs */}
        <Breadcrumbs category={product.categories?.[0]?.category} productTitle={product.title} />

        {/* Responsive product grid */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mt-6'>
          {/* Product Images */}
          <section className='space-y-4' aria-label='Product images'>
            <ProductGallery images={images} productTitle={product.title} discount={discount} />
          </section>

          {/* Product Details */}
          <section className='space-y-6' aria-label='Product information'>
            {/* Product Header */}
            <header className='space-y-3'>
              <h1 className='text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900'>
                {product.title}
              </h1>

              {/* SKU */}
              {/* <div className='text-sm text-gray-500'>
                SKU: <span className='font-mono'>{product.sku}</span>
              </div> */}

              {/* Rating */}
              {+product?.averageRating! > 0 && (
                <div
                  className='flex items-center gap-2'
                  role='img'
                  aria-label={`Rated ${product.averageRating} out of 5 stars`}
                >
                  <div className='flex'>
                    {[...Array(5)].map((_, i) => (
                      <StarIcon
                        key={i}
                        size={18}
                        className={`${
                          i < Math.floor(+product?.averageRating!)
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300'
                        }`}
                        aria-hidden='true'
                      />
                    ))}
                  </div>
                  <span className='text-sm text-gray-600'>
                    {+product?.averageRating!.toFixed(1)} ({product.reviewCount} review
                    {product.reviewCount !== 1 ? 's' : ''})
                  </span>
                </div>
              )}
            </header>

            {/* Price Section */}
            <div className='space-y-2'>
              <div className='flex items-center gap-3 flex-wrap'>
                <span
                  className='text-3xl font-bold text-primary'
                  aria-label={`Price: ${price} ${product.currency}`}
                >
                  {product.currency} {price.toFixed(2)}
                </span>

                {product.salePrice && (
                  <div className='flex items-center justify-between gap-2 w-full'>
                    <span className='text-xl line-through text-gray-500' aria-hidden='true'>
                      {product.currency} {product.basePrice.toFixed(2)}
                    </span>
                    <span className='bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm font-semibold'>
                      Save {discount}%
                    </span>
                  </div>
                )}
              </div>

              {/* {product.tax && (
                <p className="text-sm text-gray-500">Inclusive of all taxes</p>
              )} */}
            </div>

            {/* Stock Status */}
            <div className='flex items-center  justify-between gap-2'>
              <StockIndicator visible={product.visibility === 'PUBLIC'} />
              <FavBtn productId={product?.id!} aria-label={`Add ${product.title} to favorites`} />
            </div>

            {/* Short Description */}
            {product.shortDescription && (
              <p className='text-gray-700 leading-relaxed'>{product.shortDescription}</p>
            )}

            {/* Variants */}
            {product.productVariants && product.productVariants.length > 0 && (
              <ProductVariantSelector variants={product.productVariants} productId={product.id} />
            )}

            {/* Add to Cart and Actions */}
            <div className='w-full space-y-4 flex flex-col justify-between gap-4'>
              <AddToCartButton
                slug={product.slug}
                price={price}
                currency={product.currency!}
                visible={product.visibility === 'PUBLIC'}
                variants={product.productVariants}
              />

              <SocialShare />
            </div>

            {/* Trust Badges */}
            <div className='grid grid-cols-2 md:grid-cols-3 gap-4 pt-6 border-t'>
              <div className='flex items-center gap-2 text-sm'>
                <Truck size={20} className='text-green-600' aria-hidden='true' />
                <span>Free Shipping</span>
              </div>
              <div className='flex items-center gap-2 text-sm'>
                <RefreshCw size={20} className='text-purple-600' aria-hidden='true' />
                <span>7-Day Returns</span>
              </div>
              <div className='flex items-center gap-2 text-sm'>
                <CheckCircle size={20} className='text-green-600' aria-hidden='true' />
                <span>Authentic Products</span>
              </div>
            </div>
          </section>
        </div>

        {/* Product Tabs */}
        <div className='mt-12 border-t pt-8'>
          <div className='flex flex-col gap-8'>
            {/* Product Description */}
            <section className='cols-span-1 lg:col-span-2 space-y-6'>
              <h2 className='text-2xl font-bold text-gray-900'>Product Description</h2>
              <div className='wrap-break-word'>
                <p className='text-gray-700 leading-relaxed whitespace-pre-line '>
                  {product.description}
                </p>
              </div>

              {/* Specifications */}
              {product.productSpecs && product.productSpecs.length > 0 && (
                <ProductSpecifications specs={product.productSpecs} />
              )}
            </section>

            {/* Reviews Section */}
            <section className='lg:col-span-2'>
              <ProductReviews productId={product.id!} averageRating={product.averageRating!} />
            </section>
          </div>
        </div>

        {/* Related Products */}

        <RelatedProducts products={relatedProducts} />
      </main>
    </>
  );
}
