import Image from "next/image";
import Link from "next/link";
import { type Dispatch, type SetStateAction, useEffect, useState } from "react";
import { getSubCategoriesById } from "@/actions/category/category";
import type { Category } from "@/shared/lib/generated/prisma/client";
// import { TGroupJSON } from "@/shared/types/categories";
import { cn } from "@/shared/utils/styling";

type TProps = {
  setCatId: Dispatch<SetStateAction<string>>;
  categoryData: Category;
  className?: string;
};

type SubCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date | null;
};

const CategoryListItem = ({ categoryData, setCatId, className }: TProps) => {
  const { name, slug, id } = { ...categoryData };

  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (hovered) {
      getSubCategoriesById(id).then((res) => {
        if ((res as any).res) {
          setSubCategories((res as any).res);
        } else {
          setSubCategories([]);
        }
      });
      setCatId(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hovered, id]);

  return (
    <li
      className={cn(
        "w-full h-12 flex justify-between items-center relative border-b border-foreground cursor-pointer hover:[&_.subCat]:visible hover:[&_.subCat]:opacity-100",
        className,
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link
        href={"/categories/" + slug}
        className="text-foreground/80 transition-colors duration-300 hover:text-foreground"
      >
        <div className="w-7 inline-block">
          {/* <Image
            src={"/icons/" + group.iconUrl + ".svg"}
            alt={group.name}
            width={group.iconSize[0]}
            height={group.iconSize[1]}
          />*/}
        </div>
        {name}
      </Link>
      <div>
        {subCategories && subCategories.length > 0 && (
          <Image
            className={"styles.arrow"}
            src={"/icons/arrowIcon01.svg"}
            width={6}
            height={10}
            alt=""
          />
        )}
      </div>
      {subCategories && subCategories.length > 0 && (
        <div className="w-[300px] subCat absolute z-[12] left-56 top-0 flex flex-col p-3 bg-card rounded-lg overflow-hidden shadow-md transition-all duration-400 invisible opacity-0 group-hover:visible group-hover:opacity-100">
          {subCategories.map((item, index) => (
            <div className="w-full flex flex-col" key={item.id ?? index}>
              <Link
                href={"/categories/" + slug + "/" + item.slug}
                className="text-card-foreground px-3 py-2 border border-background rounded-md transition-all duration-300 hover:border-background/80 hover:bg-background/80"
              >
                {item.name}
              </Link>
              {/* 
                If you want to fetch and nest deeper subcategories, 
                you can implement the same pattern recursively here.
              */}
            </div>
          ))}
        </div>
      )}
    </li>
  );
};

export default CategoryListItem;
