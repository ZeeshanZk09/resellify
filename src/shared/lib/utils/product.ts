import prisma from "../prisma";
import { Decimal, InputJsonValue } from "@prisma/client/runtime/client";
import { TwitterCard, Upload } from "../generated/prisma/client";
import {
  DecimalJsLike,
  NullableJsonNullValueInput,
} from "../generated/prisma/internal/prismaNamespace";

function generateProductStructuredData(
  product: {
    metaTitle?: string | null;
    title: string;
    metaDescription?: string | null;
    shortDescription?: string | null;
    description?: string | null;
    sku?: string | null;
    canonicalUrl?: string | null;
    currency?: string | null;
    price?: string | number | Decimal | DecimalJsLike | null | undefined;
    status?: string | null;
    visibility?: string | null;
    averageRating?: number | null;
    reviewCount?: number | null;
  } & { images?: Upload[] }
) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.metaTitle || product.title,
    description:
      product.metaDescription ||
      product.shortDescription ||
      product.description,
    image: product.images?.map((img) => img.path) || [],
    sku: product.sku,
    url: product.canonicalUrl,
    offers: {
      "@type": "Offer",
      priceCurrency: product.currency || "PKR",
      price: product.price?.toString() || "0",
      availability:
        product.status === "PUBLISHED" && product.visibility === "PUBLIC"
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
    },
    aggregateRating: product.reviewCount
      ? {
          "@type": "AggregateRating",
          ratingValue: product.averageRating?.toFixed(1) || "0",
          reviewCount: product.reviewCount,
        }
      : undefined,
  };
}

function generateProductMetadata(
  product: {
    shortDescription: string | null | undefined;
    description: string | null | undefined;
    metaKeywords: NullableJsonNullValueInput | InputJsonValue | undefined;
    title: string;
    metadata: NullableJsonNullValueInput | InputJsonValue | undefined;
  },
  imageId: string
): {
  metaDescription: string | null | undefined;
  metaKeywords: NullableJsonNullValueInput | InputJsonValue | undefined;
  metaTitle: string;
  metadata: NullableJsonNullValueInput | InputJsonValue | undefined;
  ogDescription: string | null | undefined;
  ogImageId: string;
  ogTitle: string;
  twitterCard: TwitterCard;
} {
  return {
    metaDescription: product.shortDescription || product.description,
    metaKeywords: product.metaKeywords,
    metaTitle: product.title,
    metadata: product.metadata,
    ogDescription: product.shortDescription,
    ogImageId: imageId,
    ogTitle: product.title,
    twitterCard: "SUMMARY",
  };
}

type ValidationError<T> = {
  error: string;
  field: keyof T;
} | null;

/**
 * Validate required fields of any object
 */
function validateRequiredFields<T extends Record<string, unknown>>(
  data: T
): ValidationError<T> {
  for (const field of Object.keys(data) as Array<keyof T>) {
    const value = data[field];
    if (
      value === undefined ||
      value === null ||
      (typeof value === "string" && value.trim() === "") ||
      (Array.isArray(value) && value.length === 0)
    ) {
      return {
        error: `Missing required field: ${String(field)}`,
        field,
      };
    }
  }
  return null;
}

export type Option = { id: string; name: string };
export type OptionSet = { id: string; options: Option[] };

export function generateAllCombinations(
  optionSets: OptionSet[]
): Array<{ optionSetId: string; optionId: string; optionName: string }[]> {
  if (!optionSets || optionSets.length === 0) return [];

  const combinations: Array<
    { optionSetId: string; optionId: string; optionName: string }[]
  > = [];

  function generate(
    current: { optionSetId: string; optionId: string; optionName: string }[],
    depth: number
  ): void {
    if (depth === optionSets.length) {
      combinations.push([...current]);
      return;
    }

    const currentSet = optionSets[depth];
    for (const option of currentSet.options) {
      current.push({
        optionSetId: currentSet.id,
        optionId: option.id,
        optionName: option.name,
      });
      generate(current, depth + 1);
      current.pop();
    }
  }

  generate([], 0);
  return combinations;
}

export function calculateVariantCount(optionSets: OptionSet[]): number {
  if (!optionSets || optionSets.length === 0) return 0;

  return optionSets.reduce((total, set) => {
    const optionCount = set.options?.length || 0;
    return total * (optionCount > 0 ? optionCount : 1);
  }, 1);
}

export {
  generateProductStructuredData,
  generateProductMetadata,
  validateRequiredFields,
};
