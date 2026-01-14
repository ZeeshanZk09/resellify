"use client";

import { useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useState, useTransition } from "react";
import { Input } from "./ui/input";
import { toast } from "sonner";

type SearchApiResult =
  | {
      type: "category";
      parentSlug: string;
      categorySlug: string;
    }
  | {
      type: "product";
      slug: string;
    }
  | null;

export default function SearchInput() {
  const [query, setQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  useEffect(() => {
    if (mounted) return;
    setMounted(true);
  }, [mounted]);

  const handleClear = () => {
    setQuery("");
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const currentQuery = query.trim();
    if (!currentQuery) return;

    startTransition(async () => {
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(currentQuery)}`
        );

        if (!response.ok) {
          toast.error("Search failed, showing results list instead.");
          router.push(`/shop?query=${encodeURIComponent(currentQuery)}`);
          return;
        }

        const data = (await response.json()) as { result: SearchApiResult };
        if (!data.result) {
          router.push(`/shop?query=${encodeURIComponent(currentQuery)}`);
          return;
        }

        if (data.result.type === "category") {
          router.push(
            `/category/${encodeURIComponent(
              data.result.parentSlug
            )}/${encodeURIComponent(data.result.categorySlug)}`
          );
          return;
        }

        if (data.result.type === "product") {
          router.push(`/shop/${encodeURIComponent(data.result.slug)}`);
          return;
        }
      } catch (error) {
        toast.error("Search failed, showing results list instead.");
        router.push(`/shop?query=${encodeURIComponent(currentQuery)}`);
      }
    });
  };

  if (!mounted) {
    return (
      <div className="hidden sm:flex max-w-lg w-full h-10 bg-muted animate-pulse rounded-md" />
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="hidden sm:flex items-center max-w-lg w-full relative"
      aria-label="Search products and categories"
      role="search"
    >
      <Input
        type="search"
        value={query}
        onChange={handleChange}
        placeholder="Search by product or category..."
        className="bg-background w-full p-2 pr-8 border-none outline-none text-lg"
        aria-label="Search"
      />
      {query && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2 text-foreground/80 hover:text-foreground"
          aria-label="Clear search"
        >
          ✕
        </button>
      )}
      {isPending && (
        <span className="absolute right-8 text-xs text-foreground/60">
          Searching…
        </span>
      )}
    </form>
  );
}
