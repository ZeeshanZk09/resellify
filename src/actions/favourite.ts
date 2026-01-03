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
    const userId = session?.user.id!;

    if (!userId)
      return {
        error: "Unauthorized",
      };

    let fav = await prisma.favourite.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (!fav) {
      fav = await prisma.favourite.create({
        data: {
          userId: userId,
          productId,
          isFav: status,
        },
      });
    } else {
      fav = await prisma.favourite.update({
        where: {
          userId_productId: {
            userId,
            productId,
          },
        },
        data: {
          isFav: status,
        },
      });
    }

    return {
      fav: fav.isFav,
      success: true,
    };
  } catch (error) {
    console.log(error);
    return {
      fav: false,
      error: "Failed to favourite product.",
      success: false,
    };
  }
}

async function getFavProduct(productId: string) {
  try {
    const session = await auth();
    const userId = session?.user.id!;

    if (!userId)
      return {
        error: "Unauthorized",
      };

    console.log("getFavProduct", productId);
    const fav = await prisma.favourite.findUnique({
      where: {
        productId,
        isFav: true,
      },
      include: {
        product: true,
      },
    });
    console.log("fav", fav);

    if (!fav) {
      return {
        fav: false,
        success: true,
      };
    }
    return {
      favProduct: fav,
      fav: fav?.isFav!,
      success: true,
    };
  } catch (error) {
    console.log(error);
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
