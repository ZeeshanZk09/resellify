import { ChevronRight, Home } from "lucide-react";
import Link from "next/link";

interface BreadcrumbsProps {
  category?: {
    name: string;
    slug: string;
  };
  productTitle: string;
}

export default function Breadcrumbs({
  category,
  productTitle,
}: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="py-4">
      <ol className="flex items-center gap-2 text-sm text-gray-600 flex-wrap">
        <li>
          <Link
            href="/"
            className="flex items-center gap-1 hover:text-primary transition-colors"
            aria-label="Go to homepage"
          >
            <Home size={16} />
            <span className="sr-only">Home</span>
          </Link>
        </li>

        {category && (
          <>
            <li aria-hidden="true">
              <ChevronRight size={16} />
            </li>
            <li>
              <Link
                href={`/category/${category.slug}`}
                className="hover:text-primary transition-colors"
              >
                {category.name}
              </Link>
            </li>
          </>
        )}

        <li aria-hidden="true">
          <ChevronRight size={16} />
        </li>
        <li
          aria-current="page"
          className="font-medium text-gray-900 truncate max-w-[200px]"
        >
          {productTitle}
        </li>
      </ol>
    </nav>
  );
}
