import Link from 'next/link';
import UserButton from '../profile/user-btn';

const AdminNavbar = ({ name }: { name: string }) => {
  return (
    <div className='w-full fixed flex items-center justify-between px-6 sm:px-12 py-3 border-b border-foreground/05 bg-background transition-all z-50'>
      <Link href='/' className='relative text-lg sm:text-4xl font-semibold text-slate-700'>
        <h1 className='logo small' aria-label='GO Shop - brand'>
          <span className='mark' aria-hidden>
            Go
          </span>
          <span className='word'>Shop</span>
        </h1>

        <p className='absolute text-[10px] font-semibold -top-2 -right-13 px-3 p-0.5 rounded-full flex items-center gap-2 text-white bg-green-500'>
          Admin
        </p>
      </Link>
      <div className='flex items-center gap-3'>
        <p className='hidden sm:block'>Hi, {name || 'Admin'}</p>
        <UserButton />
      </div>
    </div>
  );
};

export default AdminNavbar;
