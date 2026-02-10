"use client";

import { useRouter } from "next/navigation";
import type React from "react";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { globalSearch } from "@/actions/global-search";
import { Input } from "./ui/input";
import { Search, X, Loader2 } from "lucide-react";
import { Button } from "./ui/button";

export default function SearchInput() {
  const [query, setQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  const [state, formAction, isPending] = useActionState(globalSearch, { result: null });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (state?.result) {
      const result = state.result;
      if (result.type === "category") {
        router.push(
          `/category/${encodeURIComponent(result.parentSlug)}/${encodeURIComponent(
            result.categorySlug,
          )}`,
        );
      } else if (result.type === "product") {
        router.push(`/shop/${encodeURIComponent(result.slug)}`);
      }
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleClear = () => {
    setQuery("");
  };

  if (!mounted) {
    return (
      <div className="hidden sm:flex max-w-lg w-full h-10 bg-muted animate-pulse rounded-md" />
    );
  }

  return (
    <form
      action={formAction}
      className="hidden sm:flex items-center max-w-lg w-full relative"
      aria-label="Search products and categories"
      role="search"
    >
      <div className="relative w-full">
        <Input
          type="search"
          name="q"
          value={query}
          onChange={handleChange}
          placeholder="Search by product or category..."
          className="pr-10 pl-4 w-full"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {query && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
              onClick={handleClear}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          <Button
            type="submit"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-primary"
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
