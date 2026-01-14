import Prisma from "@/shared/lib/prisma";
import { authAdmin, authUser } from "@/shared/lib/utils/auth";
export async function getAdminDashboard() {
  try {
    // const { userId } = getAuth(request);
    const session = await authUser();

    if (!session)
      return {
        success: false,
        message: "Unauthorized",
      };

    const isAdmin = await authAdmin();
    if (!isAdmin)
      return {
        success: false,
        message: "Unauthorized",
      };

    const orders = await Prisma.order.count();
    const allOrders = await Prisma.order.findMany({
      select: {
        createdAt: true,
        totalAmount: true,
      },
    });
    let totalRevenue = 0;
    allOrders.forEach((order) => {
      totalRevenue += Number(order.totalAmount);
    });
    const revenue = totalRevenue.toFixed(2);
    const products = await Prisma.product.count();

    // Convert all decimals to Numbers (specifically for revenue and allOrders.totalAmount)
    const allOrdersNumbered = allOrders.map((order) => ({
      ...order,
      totalAmount: Number(order.totalAmount),
    }));
    const dashboardData = {
      orders,
      products,
      revenue: Number(revenue),
      allOrders: allOrdersNumbered,
    };

    return {
      success: true,
      message: "Dashboard data fetched",
      data: dashboardData,
    };
  } catch (err: unknown) {
    console.error("[API] error", err);

    if (err instanceof Error) {
      return {
        success: false,
        message: err.message,
      };
    }
    return {
      success: false,
      message: "Something went wrong",
    };
  }
}

export async function getStoreDashboard() {
  try {
    const session = await authUser();

    if (!session)
      return {
        success: false,
        message: "Unauthorized",
      };

    const isAdmin = await authAdmin();
    if (!isAdmin)
      return {
        success: false,
        message: "Unauthorized",
      };

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
      totalOrders: Number(orders.length),
      totalEarnings: Math.round(
        orders.reduce((acc, order) => acc + Number(order.totalAmount), 0),
      ),
      totalProducts: Number(product.length),
      totalRatings: Number(ratings.length),
    };

    return {
      success: true,
      message: "Dashboard data fetched",
      data: dashboard,
    };
  } catch (err: unknown) {
    console.error("[API] error", err);

    // detect Neon/Prisma network/connect-timeout errors (relaxed check)
    if (err instanceof Error) {
      const isNetworkErr =
        (typeof err.message === "string" &&
          err.message.includes("fetch failed")) ||
        (typeof err === "object" &&
          err !== null &&
          "cause" in err &&
          typeof (err as { cause?: unknown }).cause === "object" &&
          (err as { cause?: { code?: unknown } }).cause !== null &&
          "code" in (err as { cause: { code?: unknown } }).cause &&
          (err as { cause: { code?: unknown } }).cause.code ===
            "UND_ERR_CONNECT_TIMEOUT") ||
        (typeof err.name === "string" && err.name === "NeonDbError") ||
        ("code" in err && (err as { code?: unknown }).code === "ENOTFOUND");

      if (isNetworkErr) {
        return {
          success: false,
          message: err instanceof Error ? err.message : "Something went wrong",
        };
      }
    } else {
      return {
        success: false,
        message: "Something went wrong",
      };
    }
  }
}
