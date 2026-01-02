'use client';

import { useState } from 'react';
import {
  Share2,
  Copy,
  Check,
  Truck,
  RefreshCw,
  ShieldCheck,
  Heart,
  ShoppingBag,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';
import { FacebookIcon, InstagramIcon } from '@/shared/components/icons/svgIcons';

export default function SocialShare() {
  const [copied, setCopied] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    instagram: `https://www.instagram.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (window === undefined) return null;
  return (
    <div className='w-full space-y-6 sm:space-y-8'>
      {/* Share Dropdown */}
      <div className='relative'>
        <Button
          variant='outline'
          className='w-full py-6 text-base sm:text-lg font-semibold'
          size='lg'
          onClick={() => setShowShareMenu(!showShareMenu)}
          aria-expanded={showShareMenu}
          aria-label='Share options'
        >
          <Share2 className='mr-2 h-5 w-5' />
          Share this product
        </Button>

        {showShareMenu && (
          <>
            {/* Backdrop for mobile */}
            <div
              className='fixed inset-0 z-40 sm:hidden'
              onClick={() => setShowShareMenu(false)}
              aria-hidden='true'
            />

            {/* Share Menu */}
            <div
              className={cn(
                'absolute left-0 right-0 sm:left-auto sm:right-0',
                'mt-2 bg-white border rounded-xl shadow-xl z-50',
                'animate-in fade-in-0 zoom-in-95 duration-200',
                'transform origin-top',
                'sm:w-64'
              )}
            >
              <div className='p-4 space-y-3'>
                <h3 className='font-semibold text-sm sm:text-base mb-2'>Share via</h3>

                <a
                  href={shareLinks.facebook}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 transition-colors'
                  onClick={() => setShowShareMenu(false)}
                >
                  <div className='p-2 rounded-lg bg-blue-100'>
                    <FacebookIcon width={24} className='h-5 w-5 text-blue-600' />
                  </div>
                  <span className='flex-1 text-sm sm:text-base'>Facebook</span>
                </a>

                <a
                  href={shareLinks.instagram}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='flex items-center gap-3 p-3 rounded-lg hover:bg-sky-50 transition-colors'
                  onClick={() => setShowShareMenu(false)}
                >
                  <div className='p-2 rounded-lg bg-sky-100'>
                    <InstagramIcon width={24} className='h-5 w-5 text-sky-600' />
                  </div>
                  <span className='flex-1 text-sm sm:text-base'>Instagram</span>
                </a>

                <button
                  onClick={handleCopyLink}
                  className='flex items-center gap-3 w-full p-3 rounded-lg hover:bg-gray-50 transition-colors'
                >
                  <div className='p-2 rounded-lg bg-gray-100'>
                    {copied ? (
                      <Check className='h-5 w-5 text-green-600' />
                    ) : (
                      <Copy className='h-5 w-5 text-gray-600' />
                    )}
                  </div>
                  <span className='flex-1 text-left text-sm sm:text-base'>
                    {copied ? 'Copied!' : 'Copy link'}
                  </span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Quick Share Buttons (Mobile) */}
      <div className='sm:hidden'>
        <div className='flex items-center justify-between gap-2'>
          <a
            href={shareLinks.facebook}
            target='_blank'
            rel='noopener noreferrer'
            className='flex-1 flex items-center justify-center gap-2 p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors'
            aria-label='Share on Facebook'
          >
            <FacebookIcon width={24} className='h-4 w-4' />
            <span className='text-sm'>Facebook</span>
          </a>
          <a
            href={shareLinks.instagram}
            target='_blank'
            rel='noopener noreferrer'
            className='flex-1 flex items-center justify-center gap-2 p-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors'
            aria-label='Share on Instagram'
          >
            <InstagramIcon width={24} className='h-4 w-4' />
            <span className='text-sm'>Instagram</span>
          </a>
        </div>
      </div>
    </div>
  );
}
