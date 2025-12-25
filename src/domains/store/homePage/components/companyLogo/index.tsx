import { COMPANIES_LOGOS } from '@/shared/constants/store/homePage/compayLogos';

import { JsonValue } from 'next-auth/adapters';
import CompanyLogo from './CompanyLogo';

export const CompanyLogoList = ({
  COMPANIES_LOGOS,
}: {
  COMPANIES_LOGOS:
    | ({
        upload: {
          path: string;
          fileName: string;
          altText: string | null;
        } | null;
      } & {
        id: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        metadata: JsonValue;
        createdById: string;
        publishedById: string | null;
        logo: string | null;
      })[]
    | undefined;
}) => {
  return (
    <div className='w-full mt-24 mb-12 md:mb-32 flex flex-col'>
      <h2 className='text-2xl font-medium text-foreground text-center mb-10'>Selected Brands</h2>
      <div className='flex justify-between items-center md:flex-row md:gap-0 flex-col gap-8'>
        {COMPANIES_LOGOS?.map((companyLogo, idx) => (
          <CompanyLogo key={idx} url='' {...companyLogo} />
        ))}
      </div>
    </div>
  );
};
