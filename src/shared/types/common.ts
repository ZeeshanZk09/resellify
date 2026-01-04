// import { NameValue, OptionSetType, PageType } from '@prisma/client';
import { ProductSpec, Upload, Visibility, Visit } from '../lib/generated/prisma/client';
import { Decimal } from '@prisma/client/runtime/client';

export type TProductCard = {
  name: string;
  visibility: Visibility;
  specs: ProductSpec[];
  basePrice: number | Decimal;
  dealPrice?: number | null;
  images: Upload[];
  url: string;
  staticWidth?: boolean;
};

export type TSlide = {
  imgUrl: string;
  url?: string;
  alt: string;
  msg?: {
    title: string;
    desc?: string;
    buttonText?: string;
  };
};

export type TBlogCard = {
  title: string;
  imgUrl: string;
  url: string;
  shortText: string;
};

type TSubCategory = {
  name: string;
  url: string;
  subCategories?: {
    name: string;
    url: string;
  }[];
};

export type TCategory = {
  name: string;
  iconUrl: string;
  iconSize: [number, number];
  url: string;
  subCategories?: TSubCategory[];
};

// export type TOptionSet = {
//   id: string;
//   name: string;
//   options: NameValue[];
//   type: OptionSetType;
// };

export type TSingleOption = {
  optionSetID: string;
  name: string;
  value: string;
};

export type TSpecGroup = {
  id: string;
  title: string;
  keys: string[]; // Changed from 'specs' to 'keys' to match Prisma schema
};

export type TSingleSpec = {
  specGroupID: string;
  key: string; // Changed from 'value' to 'key' to match updated action signature
};

export type TAddPageVisit = Visit;
