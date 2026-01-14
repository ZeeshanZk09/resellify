import Fuse from "fuse.js";
import { type NextRequest, NextResponse } from "next/server";
import { findCategoryByQuery } from "@/actions/category/category";
import { searchProductByQuery } from "@/actions/product/product";

type CategoryResult = {
  type: "category";
  parentSlug: string;
  categorySlug: string;
  label: string;
};

type ProductResult = {
  type: "product";
  slug: string;
  label: string;
};

type SearchResult = CategoryResult | ProductResult;

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const rawQuery = url.searchParams.get("q") || "";
  const query = rawQuery.trim();
  const normalizedQuery = query.toLowerCase();

  if (!query) {
    return NextResponse.json({ result: null });
  }

  try {
    const [categoryResult, productResult] = await Promise.all([
      findCategoryByQuery(query),
      searchProductByQuery(query),
    ]);

    console.log("query result: ", categoryResult, productResult, query);

    const documents: SearchResult[] = [];
    if (categoryResult.data && !categoryResult.error) {
      const { parentSlug, categorySlug } = categoryResult.data;
      documents.push({
        type: "category",
        parentSlug,
        categorySlug,
        label: `${parentSlug}/${categorySlug}`,
      });
    }

    if (productResult.data && !productResult.error) {
      const { slug } = productResult.data;
      documents.push({
        type: "product",
        slug,
        label: slug,
      });
    }

    if (documents.length === 0) {
      return NextResponse.json({ result: null });
    }

    if (documents.length === 1) {
      return NextResponse.json({ result: documents[0] });
    }

    const categoryDoc = documents.find((doc) => doc.type === "category");
    const productDoc = documents.find((doc) => doc.type === "product");

    if (
      categoryDoc &&
      (normalizedQuery === categoryDoc.categorySlug.toLowerCase() ||
        normalizedQuery ===
          `${categoryDoc.parentSlug}/${categoryDoc.categorySlug}`.toLowerCase() ||
        normalizedQuery === categoryDoc.parentSlug.toLowerCase())
    ) {
      return NextResponse.json({ result: categoryDoc });
    }

    if (productDoc && normalizedQuery === productDoc.slug.toLowerCase()) {
      return NextResponse.json({ result: productDoc });
    }

    const fuse = new Fuse<SearchResult>(documents, {
      keys: ["label"],
      includeScore: true,
      threshold: 0.4,
      distance: 100,
    });

    const [best] = fuse.search(query);
    const result = best?.item ?? documents[0];

    return NextResponse.json({ result });
  } catch {
    return NextResponse.json({ result: null }, { status: 500 });
  }
}
