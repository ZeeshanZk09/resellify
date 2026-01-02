'use server';
import { auth } from '@/auth';
import prisma from '@/shared/lib/prisma';

async function toggleFavProduct(productId: string, status: boolean) {
  try {
    const session = await auth();
    const userId = session?.user.id!;

    if (!userId)
      return {
        error: 'Unauthorized',
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
      error: 'Failed to favourite product.',
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
        error: 'Unauthorized',
      };
    const fav = await prisma.favourite.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });
    return {
      fav: fav?.isFav!,
      success: true,
    };
  } catch (error) {
    console.log(error);
    return {
      fav: false,
      error: 'No product found',
      success: false,
    };
  }
}

export { toggleFavProduct, getFavProduct };
