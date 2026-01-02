'use client';

import { useState } from 'react';
import { ShoppingCart, Minus, Plus } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { useRouter } from 'next/navigation';

interface AddToCartButtonProps {
  slug: string;
  price: number;
  currency: string;
  visible: boolean;
  variants?: any[];
}

export default function AddToCartButton({
  slug,
  price,
  currency,
  visible,
  variants,
}: AddToCartButtonProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const handleAddToCart = async () => {
    if (!selectedVariant && variants && variants.length > 0) {
      // Show error or select first variant
      if (!selectedVariant && variants.length > 0) {
        setSelectedVariant(variants[0].id);
        return;
      }

      setIsLoading(true);
      try {
        // Implement add to cart logic
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleClick = () => {
    router.push(`/checkout?product_slug=${slug}&qty=${quantity}`);
  };
  const isOutOfStock = !visible;

  return (
    <div className='space-y-4'>
      <div className='flex items-center gap-4'>
        <div className='flex items-center border rounded-lg'>
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className='px-3 py-2 hover:bg-gray-100 disabled:opacity-50'
            disabled={quantity <= 1}
            aria-label='Decrease quantity'
          >
            <Minus size={16} />
          </button>
          <span className='px-4 py-2 min-w-[60px] text-center' aria-live='polite'>
            {quantity}
          </span>
          <button
            onClick={() => setQuantity(quantity + 1)}
            className='px-3 py-2 hover:bg-gray-100 disabled:opacity-50'
            disabled={quantity >= 100 || !visible}
            aria-label='Increase quantity'
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      <Button
        onClick={handleAddToCart}
        disabled={isOutOfStock || isLoading}
        className='w-full py-6 text-lg font-semibold'
        size='lg'
        aria-label={isOutOfStock ? 'Out of stock' : `Add ${quantity} items to cart`}
      >
        {isLoading ? (
          <span className='flex items-center gap-2'>
            <span className='animate-spin'>⟳</span>
            Adding...
          </span>
        ) : isOutOfStock ? (
          'Out of Stock'
        ) : (
          <span className='flex items-center justify-center gap-2'>
            <ShoppingCart size={20} />
            Add to Cart • {currency} {(price * quantity).toFixed(2)}
          </span>
        )}
      </Button>

      <Button
        onClick={handleClick}
        variant='outline'
        className='w-full py-6 text-lg font-semibold'
        size='lg'
      >
        Buy Now
      </Button>
    </div>
  );
}
