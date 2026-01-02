'use client';
import { createReview } from '@/actions/reviews/review';
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
import { useState } from 'react';
import { toast } from 'sonner';

export default function WriteReviewModal({
  productId,
  open,
  onOpenChange,
}: {
  productId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [commentError, setCommentError] = useState(false);
  const [titleError, setTitleError] = useState(false);
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
        onOpenChange(false);
      }
    } catch (error) {
      toast.error('Failed to add review');
      console.error(error);
    } finally {
      setRating(0);
      setTitle('');
      setComment('');
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
          <DialogTitle className='text-2xl font-medium text-foreground'>Write a Review</DialogTitle>
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
  );
}
