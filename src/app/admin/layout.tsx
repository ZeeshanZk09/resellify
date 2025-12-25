import { auth } from '@/auth';
import AdminNavbar from '@/shared/components/admin/AdminNavbar';
import AdminSidebar from '@/shared/components/admin/AdminSidebar';
import { redirect } from 'next/navigation';

import { ReactNode } from 'react';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session || session.user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  return (
    <div className='flex flex-col min-h-screen overflow-hidden'>
      <AdminNavbar name={session?.user?.name!} />
      <div
        className='flex flex-1 items-start h-full overflow-y-scroll no-scrollbar [&::-webkit-scrollbar]:w-1
  [&::-webkit-scrollbar-track]:bg-gray-100
  [&::-webkit-scrollbar-thumb]:bg-gray-300'
      >
        <AdminSidebar />
        <div
          className='flex-1 h-full p-5 lg:pl-12 lg:pt-12 overflow-y-scroll [&::-webkit-scrollbar]:w-1
  [&::-webkit-scrollbar-track]:bg-gray-100
  [&::-webkit-scrollbar-thumb]:bg-gray-300'
        >
          {children}
        </div>
      </div>
      ;
    </div>
  );
}
