import { authAdmin, authUser } from '@/shared/lib/utils/auth';
import Prisma from '@/shared/lib/prisma';
export async function getAdminDashboard() {
  try {
    // const { userId } = getAuth(request);
    const session = await authUser();

    if (!session)
      return {
        success: false,
        message: 'Unauthorized',
      };

    const isAdmin = await authAdmin();
    if (!isAdmin)
      return {
        success: false,
        message: 'Unauthorized',
      };

    const orders = await Prisma.order.count();
    const allOrders = await Prisma.order.findMany({
      select: {
        createdAt: true,
        totalAmount: true,
      },
    });
    let totalRevenue = 0;
    allOrders.map((order) => (totalRevenue += +order.totalAmount));
    const revenue = totalRevenue.toFixed(2);
    const products = await Prisma.product.count();

    const dashboardData = { orders, products, revenue, allOrders };

    return {
      success: true,
      message: 'Dashboard data fetched',
      data: dashboardData,
    };
  } catch (err: any) {
    console.error('[API] error', err);

    // detect Neon/Prisma network/connect-timeout errors (relaxed check)
    const isNetworkErr =
      err?.message?.includes('fetch failed') ||
      err?.cause?.code === 'UND_ERR_CONNECT_TIMEOUT' ||
      err?.name === 'NeonDbError' ||
      err?.code === 'ENOTFOUND';

    if (isNetworkErr) {
      return {
        success: false,
        message: 'Service Unavailable',
      };
    }
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Something went wrong',
    };
  }
}

export async function getStoreDashboard() {
  try {
    const session = await authUser();

    if (!session) return false;

    const isAdmin = await authAdmin();
    if (!isAdmin) return false;

    const orders = await Prisma.order.findMany({
      where: {},
    });

    const product = await Prisma.product.findMany({
      where: {},
    });

    const ratings = await Prisma.review.findMany({
      where: {
        productId: {
          in: product.map((item) => item.id),
        },
      },
      include: {
        user: true,
        product: {
          include: {
            waitlists: true,

            tags: true,

            reviews: true,

            productVariants: true,
            productOffers: true,
            productSpecs: true,

            orderItems: true,

            images: true,

            favouritedBy: true,

            couponProducts: true,
            categories: true,
          },
        },
      },
    });

    const dashboard = {
      ratings,
      totalOrders: orders.length,
      totalEarnings: Math.round(orders.reduce((acc, order) => acc + +order.totalAmount, 0)),
      totalProducts: product.length,
      totalRatings: ratings.length,
    };

    return dashboard;
  } catch (err: any) {
    console.error('[API] error', err);

    // detect Neon/Prisma network/connect-timeout errors (relaxed check)
    const isNetworkErr =
      err?.message?.includes('fetch failed') ||
      err?.cause?.code === 'UND_ERR_CONNECT_TIMEOUT' ||
      err?.name === 'NeonDbError' ||
      err?.code === 'ENOTFOUND';

    if (isNetworkErr) {
      return false;
    }
    return false;
  }
}
