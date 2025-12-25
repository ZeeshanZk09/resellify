'use client';

import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  LayoutListIcon,
  ShieldCheckIcon,
  SquarePenIcon,
  SquarePlusIcon,
  StoreIcon,
  TicketPercentIcon,
  User,
} from 'lucide-react';
import Link from 'next/link';

const AdminSidebar = () => {
  const pathname = usePathname();

  const sidebarLinks = [
    { name: 'Dashboard', href: '/admin', icon: HomeIcon },
    { name: 'Users', href: '/admin/users', icon: User },
    { name: 'Coupons', href: '/admin/coupons', icon: TicketPercentIcon },
    { name: 'Add Product', href: '/store/add-product', icon: SquarePlusIcon },
    { name: 'Manage Product', href: '/store/manage-product', icon: SquarePenIcon },
    { name: 'Orders', href: '/store/orders', icon: LayoutListIcon },
  ];

  return (
    <div className='inline-flex h-full flex-col gap-5 border-r border-slate-200 sm:min-w-60'>
      {/* <div className='flex flex-col gap-3 justify-center items-center pt-8 max-sm:hidden'>
        <ImageKit
          className='w-14 h-14 rounded-full'
          src={user?.imageUrl || assets.gs_logo}
          alt={`${user?.firstName}_logo` || 'Admin_logo'}
        />
        <p className='text-slate-700'>Hi, {user?.fullName || 'Admin'}</p>
      </div> */}

      <div className='max-sm:mt-6'>
        {sidebarLinks.map((link, index) => (
          <Link
            key={index}
            href={link.href}
            className={`relative flex items-center gap-3 text-slate-500 hover:bg-slate-50 p-2.5 transition ${
              pathname === link.href && 'bg-slate-100 sm:text-slate-600'
            }`}
          >
            <link.icon size={18} className='sm:ml-5' />
            <p className='max-sm:hidden'>{link.name}</p>
            {pathname === link.href && (
              <span className='absolute bg-green-500 right-0 top-1.5 bottom-1.5 w-1 sm:w-1.5 rounded-l'></span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AdminSidebar;
