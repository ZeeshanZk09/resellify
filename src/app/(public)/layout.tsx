import { ReactNode } from 'react';
import Header from '@/shared/components/home/header';
import Footer from '@/shared/components/home/footer';

export default async function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <main className='w-full min-h-screen'>{children}</main>
      <Footer />
    </>
  );
}
