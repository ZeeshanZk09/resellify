import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/shared/lib/prisma";
/**
 * POST /api/products/bulk
 * Fetch multiple products by IDs
 */
export async function POST(request: NextRequest) {
  try {
    const { ids } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "Product IDs array is required" },
        { status: 400 },
      );
    }

    const products = await prisma.product.findMany({
      where: {
        id: { in: ids },
        status: "PUBLISHED",
        visibility: "PUBLIC",
      },
      select: {
        id: true,
        title: true,
        slug: true,
        basePrice: true,
        salePrice: true,
        images: {
          select: {
            path: true,
          },
          take: 1,
        },
        categories: {
          select: {
            category: {
              select: {
                name: true,
              },
            },
          },
          take: 1,
        },
        reviews: {
          select: {
            rating: true,
          },
        },
      },
      // Preserve order of input IDs
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform to match ProductCard props
    const transformed = products.map((product) => {
      const avgRating =
        product.reviews.reduce((sum, r) => sum + r.rating, 0) /
          product.reviews.length || 0;

      return {
        id: product.id,
        name: product.title,
        slug: product.slug,
        basePrice: product.basePrice,
        dealPrice: product.salePrice || undefined,
        images: product.images,
        category: product.categories[0]?.category.name,
        rating: avgRating,
        reviewCount: product.reviews.length,
        visibility: "PUBLIC" as const,
      };
    });

    return NextResponse.json(transformed);
  } catch (error) {
    console.error("Error fetching products in bulk:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 },
    );
  }
}
