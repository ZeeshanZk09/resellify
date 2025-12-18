import { Product, ProductImage } from '../generated/prisma/client';

function generateProductStructuredData(product: Product & { images?: ProductImage[] }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.metaTitle || product.name,
    description: product.metaDescription || product.shortDescription || product.description,
    image: product.images?.map((img) => img.path) || [],
    sku: product.sku,
    url: product.canonicalUrl,
    offers: {
      '@type': 'Offer',
      priceCurrency: product.currency || 'PKR',
      price: product.price?.toString() || '0',
      availability:
        product.status === 'PUBLISHED' && product.visibility === 'PUBLIC'
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
    },
    aggregateRating: product.reviewCount
      ? {
          '@type': 'AggregateRating',
          ratingValue: product.averageRating?.toFixed(1) || '0',
          reviewCount: product.reviewCount,
        }
      : undefined,
  };
}

export { generateProductStructuredData };
