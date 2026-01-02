'use server';
import { auth } from '@/auth';
import prisma from '@/shared/lib/prisma';

async function createReview(productId: string, rating: number, title: string, comment: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: 'Unauthorized' };

    const product = await prisma.product.findUnique({
      where: {
        id: productId,
      },
    });
    if (!product) return { error: 'Product not found', status: 404 };

    const review = await prisma.review.create({
      data: {
        userId: session.user.id,
        productId: productId,
        rating: rating,
        title: title,
        comment: comment,
      },
    });

    const productReviewCount = await prisma.product.findUnique({
      where: {
        id: productId,
      },
      select: {
        reviews: true,
      },
    });

    await prisma.product.update({
      where: {
        id: productId,
      },
      data: {
        averageRating:
          productReviewCount && productReviewCount.reviews.length > 0
            ? productReviewCount.reviews.reduce((sum, r) => sum + (r.rating ?? 0), 0) /
              productReviewCount.reviews.length
            : 0,
        reviewCount: (product.reviewCount ?? 0) + 1,
      },
    });

    return { success: 'Review added successfully', status: 200, review: review };
  } catch (error) {
    console.error(error);
    return { error: 'Failed to add review', status: 500 };
  }
}

export { createReview };
