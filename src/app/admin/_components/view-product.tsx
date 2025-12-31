"use client";
import { useRouter } from "next/navigation";
import React from "react";

export default function ViewProduct({ slug }: { slug: string }) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push(`/shop/${slug}`)}
      className="bg-slate-100 px-5 py-2 hover:bg-slate-200 rounded transition-all"
    >
      View Product
    </button>
  );
}
