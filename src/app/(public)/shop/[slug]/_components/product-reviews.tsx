'use client';
import React, { useEffect, useState } from 'react';
import WriteReviewModal from './write-rewiew-modal';
import { Avatar } from '@/shared/components/ui/avatar';
import { AvatarFallback, AvatarImage } from '@radix-ui/react-avatar';
import { User } from '@/shared/lib/generated/prisma/browser';
import { Button } from '@/shared/components/ui/button';
import { StarIcon } from 'lucide-react';

// Generate consistent color based on user name
function getAvatarColor(name: string): string {
  const colors = [
    '#3B82F6', // blue
    '#10B981', // green
    '#F59E0B', // amber
    '#EF4444', // red
    '#8B5CF6', // purple
    '#EC4899', // pink
    '#06B6D4', // cyan
    '#F97316', // orange
    '#6366F1', // indigo
    '#14B8A6', // teal
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export default function ProductReviews({
  productId,
  reviews,
  averageRating,
}: {
  productId: string;
  averageRating: number;
  reviews: {
    id: string;
    title: string | null;
    createdAt: Date;
    updatedAt: Date | null;
    productId: string;
    userId: string;
    rating: number;
    comment: string | null;
    user: User;
  }[];
}) {
  const [open, setOpen] = useState(false);
  const [reviewsState, setReviewsState] = useState(reviews);
  useEffect(() => {
    setReviewsState(reviews || []);
  }, [reviews]);
  return (
    <div>
      <div className='flex items-center justify-between'>
        <h2 className='text-2xl font-medium text-foreground'>Product Reviews</h2>
        <WriteReviewModal productId={productId} open={open} onOpenChange={setOpen} />
      </div>
      {reviewsState.length === 0 ? (
        <div className='mt-4'>
          <p className='text-sm text-gray-500'>
            No reviews yet. Be the first to review this product!
          </p>
        </div>
      ) : (
        <div className='max-w-sm'>
          {reviewsState.map((review) => (
            <div key={review.id} className='mb-4'>
              <div className='flex justify-between'>
                <Avatar
                  className='size-9 flex justify-center items-center'
                  style={{ backgroundColor: getAvatarColor(review.user?.name || 'User') }}
                >
                  <AvatarFallback className='uppercase'>
                    {(review.user?.name as string)?.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3>{review.user.name}</h3>
                  <span>
                    {[...Array(5)].map((_, i) => (
                      <StarIcon
                        key={i}
                        className={`inline-block w-4 h-4 ${
                          i < Math.round(review.rating)
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300'
                        }`}
                        aria-hidden='true'
                      />
                    ))}
                    {/* Optionally: show numerical rating */}
                    <span className='ml-1 text-xs text-gray-500'>
                      {review.rating.toFixed(1)} / 5
                    </span>
                  </span>
                </div>
              </div>

              <p className='text-sm font-semibold text-gray-700'>{review.comment}</p>
              <p className='text-sm text-gray-500'>{review.title}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
