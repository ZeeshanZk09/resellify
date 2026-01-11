'use client';

import React, { useEffect, useState } from 'react';
import { Input } from './ui/input';
import { useRouter } from 'next/navigation';

export default function SearchInput() {
  const [query, setQuery] = useState('');
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  useEffect(() => {
    if (mounted) return;
    setMounted(true);
  }, []);

  const handleClear = () => {
    setQuery('');
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!query.trim()) return; // Prevent empty search

    // Navigate to a search results page with query params
    router.push(`/shop?query=${encodeURIComponent(query)}`);
  };

  if (!mounted) {
    return (
      <div className='hidden sm:flex max-w-lg w-full h-10 bg-muted animate-pulse rounded-md' />
    );
  }

  return (
    <form onSubmit={handleSubmit} className='hidden sm:flex items-center max-w-lg w-full relative'>
      <Input
        type='search'
        value={query}
        onChange={handleChange}
        placeholder='Search...'
        className='bg-background w-full p-2 border-none outline-none text-lg'
      />
      {query && (
        <button
          type='button'
          onClick={handleClear}
          className='absolute right-2 text-foreground/80 hover:text-foreground'
        >
          ✕
        </button>
      )}
    </form>
  );
}
