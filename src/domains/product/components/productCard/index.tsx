import Image from 'next/image';
import Link from 'next/link';

import { TProductCard } from '@/shared/types/common';
import { cn } from '@/shared/utils/styling';

const ProductCard = ({
  name,
  images,
  basePrice,
  dealPrice,
  specs,
  url,
  isAvailable = true,
  staticWidth = false,
}: TProductCard) => {
  return (
    <Link
      href={url || '/'}
      className={cn(
        'bg-card rounded-xl p-3 flex flex-col transition-all duration-200 w-full max-w-xs  shadow-sm hover:shadow-md',
        staticWidth && 'min-w-64'
      )}
      style={{ minWidth: 0 }}
    >
      <div className='relative w-full aspect-[4/3] mb-2 rounded-lg overflow-hidden border border-border'>
        {images?.[0]?.path ? (
          <Image
            src={images[0].path}
            alt={name}
            fill
            sizes='(max-width: 420px) 100vw, 240px'
            className='object-contain bg-white'
            priority={false}
          />
        ) : (
          <div className='flex items-center justify-center bg-muted w-full h-full text-muted-foreground text-xs'>
            No Image
          </div>
        )}
        {!isAvailable && (
          <div className='absolute inset-0 flex items-center justify-center bg-card/70 z-10'>
            <span className='text-xs font-medium text-card-foreground px-3 py-1 rounded bg-card/80'>
              Out of Stock
            </span>
          </div>
        )}
      </div>
      <span className='text-card-foreground font-semibold text-base truncate mb-1'>{name}</span>
      <div className='flex flex-wrap gap-1 mb-2 min-h-5'>
        {specs?.slice(0, 2).map(({ values }, index) => (
          <span key={index} className='text-xs text-card-foreground/60 truncate'>
            {values.join(', ')}
          </span>
        ))}
      </div>
      <div className='flex items-baseline justify-between mt-auto'>
        <div className='flex flex-col'>
          {dealPrice ? (
            <>
              <span className='text-primary font-bold text-lg'>
                {dealPrice.toLocaleString('en-us', { minimumFractionDigits: 2 })}€
              </span>
              {basePrice && +basePrice > 0 ? (
                <span className='line-through text-xs text-card-foreground/50'>
                  {basePrice.toLocaleString('en-us', { minimumFractionDigits: 2 })}€
                </span>
              ) : null}
            </>
          ) : (
            <span className='text-card-foreground font-bold text-lg'>
              {basePrice?.toLocaleString('en-us', { minimumFractionDigits: 2 })}€
            </span>
          )}
        </div>
        {dealPrice && basePrice && (
          <span className='ml-2 text-xs text-green-600 font-semibold bg-green-100 px-2 py-0.5 rounded'>
            -{Math.round(100 - (dealPrice / +basePrice) * 100)}%
          </span>
        )}
        {/* Remove heart/favorite button for simpler UI */}
      </div>
    </Link>
  );
};

export default ProductCard;
