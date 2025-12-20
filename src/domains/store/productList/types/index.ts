import { Brand } from "@/shared/lib/generated/prisma/client";

export type TListItem = {
  id: string;
  name: string;
  isAvailable: boolean;
  specialFeatures: string[];
  images: string[];
  price: number;
  salePrice: number | null;
  brand: Brand;
};

export type TFilters = {
  stockStatus: "all" | "inStock" | "outStock";
  priceMinMax: [number, number];
  priceMinMaxLimitation: [number, number];
  brands: TFilterBrands[];
};

export type TFilterBrands = Brand & {
  isSelected: boolean;
};

// USER JB FILTRATION KRE GA: name, slug?,  price,  publishedAt, (is field ko use kia jaye ga products ko published dikhany ke lia so jo pusblishedAt honge sirf wohi store pe nazar aaye ge) featured, averageRating (will be calcuted upon reviews of users and the value of averageRating will be in-between 0-5 and it will be floating). categories, tags, (will bhi entered in search box with #)
// ADMIN JB FILTRATION KRE GA // ...including user filteration fields sku status visibility createdAt createdBy inventory lowStockThreshold (based on inventory) reviewCount // (by visits and reviews of that product will be counted for each products to check out analytics and lead)
export type TUserListSort = {
  sortName:
    | "id"
    | "price"
    | "name"
    | "slug"
    | "averageRating"
    | "featured"
    | "publishedAt"
    | "category"
    | "tag";
  sortType: "asc" | "desc";
};

export type TAdminListSort = {
  sortName:
    | "id"
    | "price"
    | "name"
    | "slug"
    | "averageRating"
    | "featured"
    | "sku"
    | "status"
    | "visibility"
    | "createdAt"
    | "createdBy"
    | "inventory"
    | "lowStockThreshold"
    | "reviewCount";
  sortType: "asc" | "desc";
};

export type TPageStatus =
  | "pageLoading"
  | "filterLoading"
  | "filledProductList"
  | "filterHasNoProduct"
  | "categoryHasNoProduct";
