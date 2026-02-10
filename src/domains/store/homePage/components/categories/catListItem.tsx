import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState, useTransition } from 'react';
import { getSubCategoriesById } from '@/actions/category/category';
import type { Category } from '@/shared/lib/generated/prisma/client';
import { cn } from '@/shared/utils/styling';

type TProps = {
  readonly categoryData: Category;
  readonly className?: string;
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

const CategoryListItem = ({ categoryData, className }: TProps) => {
  const { name, slug, id } = categoryData;

  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [hovered, setHovered] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (hovered) {
      startTransition(async () => {
        const res = await getSubCategoriesById(id);
        if ('res' in res) {
          setSubCategories(res.res as SubCategory[]);
        } else {
          setSubCategories([]);
        }
      });
    }
  }, [hovered, id]);

  return (
    <li
      className={cn(
        'w-full h-12 flex justify-between items-center relative border-b border-foreground cursor-pointer group',
        className
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link
        href={'/category/' + slug}
        className='text-foreground/80 transition-colors duration-300 hover:text-foreground flex items-center'
      >
        <div className='w-7 inline-block' />
        {name}
      </Link>
      <div className='flex items-center'>
        {isPending ? (
          <div className='w-4 h-4 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin mr-2' />
        ) : (
          subCategories.length > 0 && (
            <Image src='/icons/arrowIcon01.svg' width={6} height={10} alt='' className='mr-2' />
          )
        )}
      </div>
      {subCategories.length > 0 && (
        <div className='w-75 subCat absolute z-10 left-full top-0 flex flex-col p-3 bg-card rounded-lg overflow-hidden shadow-md transition-all duration-300 invisible opacity-0 group-hover:visible group-hover:opacity-100'>
          {subCategories.map((item) => (
            <div className='w-full flex flex-col' key={item.id}>
              <Link
                href={'/category/' + slug + '/' + item.slug}
                className='text-card-foreground px-3 py-2 border border-background rounded-md transition-all duration-300 hover:border-background/80 hover:bg-background/80'
              >
                {item.name}
              </Link>
            </div>
          ))}
        </div>
      )}
    </li>
  );
};

export default CategoryListItem;
