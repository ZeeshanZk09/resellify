"use server";
import { auth } from "@/auth";
import prisma from "@/shared/lib/prisma";

export type GetFavProducts = Awaited<ReturnType<typeof getFavProducts>>["favs"];
export type ToggleFavProduct = Awaited<
  ReturnType<typeof toggleFavProduct>
>["success"];
export type GetFavProduct = Awaited<ReturnType<typeof getFavProduct>>["fav"];

async function toggleFavProduct(productId: string, status: boolean) {
  try {
    const session = await auth();
    const userId = session?.user.id;

    console.log("[toggleFavProduct] session.user.id:", userId);
    console.log("[toggleFavProduct] productId:", productId, "status:", status);

    if (!userId)
      return {
        error: "Unauthorized",
      };

    await prisma.favourite.upsert({
      where: {
        OR: [
          {
            userId,
          },
          { productId },
        ],
        userId_productId: {
          userId,
          productId,
        },
      },
      update: {
        isFav: status,
      },
      create: {
        userId,
        productId,
        isFav: status,
      },
    });

    return {
      success: true,
    };
  } catch (error) {
    console.log("[toggleFavProduct] error:", error);
    return {
      error: "Failed to favourite product.",
      success: false,
    };
  }
}

async function getFavProduct(productId: string) {
  try {
    const session = await auth();
    const userId = session?.user.id!;

    console.log("[getFavProduct] session.user.id:", userId);
    console.log("[getFavProduct] productId:", productId);

    if (!userId)
      return {
        error: "Unauthorized",
      };

    console.log(
      "[getFavProduct] fetching favourite for userId:",
      userId,
      "productId:",
      productId
    );
    const fav = await prisma.favourite.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
      include: {
        product: true,
      },
    });
    console.log("[getFavProduct] found favourite:", fav);

    if (!fav) {
      console.log("[getFavProduct] no favourite found, returning fav: false");
      return {
        fav: false,
        success: true,
      };
    }
    console.log("[getFavProduct] returning favourite product");
    return {
      favProduct: fav,
      fav: fav?.isFav!,
      success: true,
    };
  } catch (error) {
    console.log("[getFavProduct] error:", error);
    return {
      fav: false,
      error: "No product found",
      success: false,
    };
  }
}

async function getFavProducts() {
  try {
    const session = await auth();
    const userId = session?.user.id!;

    if (!userId)
      return {
        error: "Unauthorized",
      };
    const favs = await prisma.favourite.findMany({
      where: {
        userId,
        isFav: true,
      },
      include: {
        product: {
          include: {
            images: true,
          },
        },
      },
    });
    return {
      favs: favs,
      success: true,
    };
  } catch (error) {
    console.log(error);
    return {
      favs: null,
      error: "No products found",
      success: false,
    };
  }
}

export { toggleFavProduct, getFavProduct, getFavProducts };
