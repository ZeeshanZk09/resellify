import { getAllProducts, getProductBySlug } from '@/actions/product/product';
import { notFound } from 'next/navigation';
import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Product } from '@/shared/lib/generated/prisma/client';

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Generates metadata for each product page
export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = (await getProductBySlug((await params).slug)).res;

  if (!product) {
    return {
      title: 'Product Not Found',
      description: 'The product you are looking for does not exist.',
    };
  }

  return {
    title: product.title,
    description: product.description || '',
    openGraph: {
      title: product.title,
      description: product.description || '',
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

// Page for displaying a single product detail
export default async function ProductBySlug({ params }: ProductPageProps) {
  const product = (await getProductBySlug((await params).slug)).res;

  if (!product) {
    notFound();
  }

  return (
    <main className='container mx-auto max-w-3xl px-4 py-12'>
      <div className='flex flex-col md:flex-row gap-8'>
        <div className='w-full md:w-1/2 flex justify-center'>
          {product.images && product.images.length > 0 ? (
            <img
              src={product.images[0].path}
              alt={product.title}
              className='rounded-lg object-contain w-full max-h-[400px] border'
            />
          ) : (
            <div className='w-full h-[300px] flex items-center justify-center bg-muted'>
              <span className='text-gray-400'>No Image</span>
            </div>
          )}
        </div>
        <div className='flex-1 flex flex-col gap-4'>
          <h1 className='text-3xl font-bold'>{product.title}</h1>
          {product.description && <p className='text-base text-gray-700'>{product.description}</p>}

          <div className='flex items-center gap-3 text-xl mt-4'>
            {product.salePrice && +product.salePrice < (+product?.price! ?? product.basePrice) ? (
              <>
                <span className='text-primary font-bold'>${product.salePrice.toFixed(2)}</span>
                <span className='line-through text-gray-500'>
                  ${(+product?.price! ?? product.basePrice).toFixed(2)}
                </span>
              </>
            ) : (
              <span className='text-primary font-bold'>
                ${(+product?.price! ?? product.basePrice).toFixed(2)}
              </span>
            )}
          </div>

          {product.productSpecs && product.productSpecs.length > 0 && (
            <div className='mt-6'>
              <h2 className='text-lg font-medium mb-2'>Specifications:</h2>
              <ul className='grid grid-cols-1 md:grid-cols-2 gap-2'>
                {product.productSpecs.map((spec) => (
                  <li key={spec.id} className='text-sm text-gray-600'>
                    <span className='font-medium'>Values: </span>
                    <span>{spec.values?.join(', ') || 'N/A'}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className='mt-8'>
            <button
              className='bg-card hover:bg-card/80 text-card-foreground px-6 py-3 rounded-md shadow transition disabled:opacity-50'
              disabled
            >
              Add to Cart
            </button>
          </div>

          <div className='mt-6'>
            <Link href='/shop' className='text-blue-600 hover:underline'>
              ← Back to shop
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
