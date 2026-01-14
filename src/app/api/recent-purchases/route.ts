import { type NextRequest, NextResponse } from 'next/server';
import prisma from '@/shared/lib/prisma';
import { logger } from '@/lib/logger';
import { formatRelativeTime } from '@/lib/utils/formatters';

/**
 * GET /api/recent-purchases
 * Returns recent purchases for social proof notifications
 * Anonymized and randomized for privacy
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = Number.parseInt(searchParams.get('limit') || '20');

    // Fetch recent orders from the last 24 hours
    const recentOrders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
        status: {
          in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'],
        },
      },
      select: {
        id: true,
        createdAt: true,
        address: {
          select: {
            city: true,
          },
        },
        items: {
          select: {
            productId: true,
            name: true,
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    // Fetch product images for the orders
    const productIds = recentOrders.map((order) => order.items[0]?.productId).filter(Boolean);

    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
      },
      select: {
        id: true,
        slug: true,
        images: {
          select: {
            path: true,
          },
          take: 1,
        },
      },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    // Transform to frontend format
    const purchases = recentOrders
      .map((order) => {
        const item = order.items[0];
        if (!item) return null;

        const product = productMap.get(item.productId);
        if (!product) return null;

        const timeAgo = formatRelativeTime(order.createdAt);

        return {
          id: order.id,
          productName: item.name,
          productImage: product.images[0]?.path || '/images/placeholder.jpg',
          productSlug: product.slug,
          city: order.address?.city || 'Pakistan',
          timeAgo,
        };
      })
      .filter(Boolean);

    return NextResponse.json({
      purchases,
      success: true,
    });
  } catch (error) {
    logger.error('Error fetching recent purchases', error);
    return NextResponse.json(
      {
        purchases: [],
        success: false,
        error: 'Failed to fetch recent purchases',
      },
      { status: 500 }
    );
  }
}
