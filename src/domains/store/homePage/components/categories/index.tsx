"use client";

import { useEffect, useState, useTransition } from "react";

import { SK_Box } from "@/shared/components/ui-v2/skeleton";

import CategoryListItem from "./catListItem";
import { Category } from "@/shared/lib/generated/prisma/browser";
import { getAllCategories } from "@/actions/category/category";

export const HomeCategoryList = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [catId, setCatId] = useState("");
  const [isPending, setIsPending] = useState(true);

  useEffect(() => {
    const getCategories = async () => {
      const { categories, subCategories } = await getAllCategories(catId);
      console.log(categories);
      if (categories) {
        setCategories(categories);
      }
    };

    getCategories();

    let timer: NodeJS.Timeout;
    if (categories !== undefined) {
      timer = setTimeout(() => {
        setIsPending(false);
      }, 0);
    }
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="max-w-xs w-[30%] h-[500px] hidden lg:block bg-card rounded-xl px-6 text-card-foreground shadow-md z-3">
      <ul className="mt-3">
        {isPending ? (
          <div className="flex flex-col gap-7 justify-center mt-5">
            {Skeletons()}
          </div>
        ) : !categories || categories.length === 0 ? (
          <div className="text-xl">
            <p>No Category Found</p>
          </div>
        ) : (
          categories.map((item, index) => (
            <CategoryListItem
              key={index}
              categoryData={item}
              setCatId={setCatId}
              className={index === categories.length - 1 ? "border-b-0" : ""}
            />
          ))
        )}
      </ul>
    </div>
  );
};

const Skeletons = () => {
  const skeletons: React.ReactNode[] = [];
  for (let i = 0; i <= 10; i++) {
    skeletons.push(<SK_Box key={i} width="100%" height="16px" />);
  }
  return skeletons;
};
