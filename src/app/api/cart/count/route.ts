import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/shared/lib/prisma";

/**
 * GET /api/cart/count
 * Returns the cart item count for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      // Return 0 for unauthenticated users
      return NextResponse.json({ count: 0 });
    }

    const cart = await prisma.cart.findUnique({
      where: {
        userId: session.user.id,
      },
      select: {
        items: {
          select: {
            quantity: true,
          },
        },
      },
    });

    const count =
      cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;

    return NextResponse.json({ count });
  } catch (error) {
    console.error("Error fetching cart count:", error);
    return NextResponse.json({ count: 0 }, { status: 500 });
  }
}
