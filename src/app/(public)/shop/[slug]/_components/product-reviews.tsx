'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { Avatar } from '@/shared/components/ui/avatar';
import { AvatarFallback, AvatarImage } from '@radix-ui/react-avatar';
import { User } from '@/shared/lib/generated/prisma/browser';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { cn } from '@/shared/utils/styling';
import { PlusIcon, SendIcon, StarIcon } from 'lucide-react';
import { toast } from 'sonner';
import { GetAllReviews, createReview, getReviews } from '@/actions/reviews/review';
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
  averageRating,
}: {
  productId: string;
  averageRating: number;
}) {
  const [open, setOpen] = useState(false);
  const [reviews, setReviews] = useState<GetAllReviews>([]);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [commentError, setCommentError] = useState(false);
  const [titleError, setTitleError] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchReviews = useCallback(async () => {
    try {
      const reviews = (await getReviews(productId)).reviews;
      setReviews(reviews);
    } catch (error) {
      let errorMessage = 'Failed to fetch reviews';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      toast.error(errorMessage);
      console.error('Error fetching reviews:', error);
    }
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (reviews !== undefined) {
      timer = setTimeout(() => {
        setLoading(false);
      }, 600);
    }
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleRating = (newRating: number) => {
    setRating(newRating);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !comment.trim() || rating === 0) {
      toast.error('Please fill in all fields');
      return;
    }
    try {
      const result = await createReview(productId, rating, title, comment);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success('Review added successfully');
        setOpen(false);
      }
    } catch (error) {
      toast.error('Failed to add review');
      console.error(error);
    } finally {
      setRating(0);
      setTitle('');
      setComment('');
      fetchReviews();
      setLoading(false);
    }
  };
  return (
    <div className='space-y-8'>
      <div className='flex items-center justify-between gap-6'>
        <h2 className='text-2xl font-medium text-foreground'>Product Reviews</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant='outline'>
              <PlusIcon
                width={24}
                className='h-4 w-4'
                fill='currentColor'
                strokeWidth={1.5}
                stroke='currentColor'
              />
              <span className='text-sm'>Write a Review</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className='text-2xl font-medium text-foreground'>
                Write a Review
              </DialogTitle>
            </DialogHeader>
            <div className='flex flex-col gap-4'>
              <div className='flex flex-col gap-2'>
                <Label className='text-sm font-medium text-foreground'>Rating</Label>

                <div className='flex items-center gap-2'>
                  {[...Array(5)].map((_, i) => (
                    <StarIcon
                      key={i}
                      onClick={() => handleRating(i + 1)}
                      aria-label={`Rate ${i + 1} out of 5`}
                      width={24}
                      className={cn(
                        'h-4 w-4',
                        i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                      )}
                    />
                  ))}
                </div>
              </div>
              <div className='flex flex-col gap-2'>
                <Label className='text-sm font-medium text-foreground'>Title</Label>
                <Input
                  placeholder='Write your review title here...'
                  className='w-full'
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  onInvalid={(e) => setTitleError(true)}
                  aria-invalid={titleError}
                  aria-describedby='title-error'
                />
                {titleError && (
                  <p className='text-sm text-red-500' id='title-error'>
                    Title is required
                  </p>
                )}
              </div>
              <div className='flex flex-col gap-2'>
                <Label className='text-sm font-medium text-foreground'>Comment</Label>
                <Textarea
                  placeholder='Write your review here...'
                  className='w-full'
                  rows={4}
                  maxLength={500}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  required
                  minLength={10}
                  onInvalid={(e) => setCommentError(true)}
                />
                {commentError && (
                  <p className='text-sm text-red-500'>Review must be at least 10 characters long</p>
                )}
              </div>
            </div>
            <Button
              onClick={handleSubmit}
              aria-label='Submit Review'
              disabled={rating === 0}
              type='submit'
              variant='default'
              className='w-full'
            >
              <SendIcon width={24} className='h-4 w-4' strokeWidth={1.5} stroke='currentColor' />
              Submit Review
            </Button>
          </DialogContent>
        </Dialog>
      </div>
      {loading ? (
        <div className='max-w-sm mt-4'>
          {[...Array(3)].map((_, idx) => (
            <div key={idx} className='mb-4 animate-pulse'>
              <div className='flex justify-between items-center'>
                <div className='bg-gray-200 rounded-full size-9' />
                <div className='flex-1 ml-3'>
                  <div className='h-3 w-24 bg-gray-200 rounded mb-2'></div>
                  <div className='flex gap-1 mb-1'>
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className='w-4 h-4 bg-gray-200 rounded' />
                    ))}
                    <div className='ml-1 h-3 w-10 bg-gray-200 rounded' />
                  </div>
                </div>
              </div>
              <div className='h-3 w-48 bg-gray-200 rounded my-2'></div>
              <div className='h-2 w-32 bg-gray-100 rounded' />
            </div>
          ))}
        </div>
      ) : reviews?.length === 0 ? (
        <div className='mt-4'>
          <p className='text-sm text-gray-500'>
            No reviews yet. Be the first to review this product!
          </p>
        </div>
      ) : (
        <div className='max-w-sm'>
          {reviews?.map((review) => (
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
                  <h3>{review?.user?.name}</h3>
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
