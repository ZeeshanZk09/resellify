import Link from 'next/link';
import UserButton from '../profile/user-btn';

const AdminNavbar = ({ name }: { name: string }) => {
  return (
    <div className='flex items-center justify-between px-6 sm:px-12 py-3 border-b border-slate-200 transition-all'>
      <Link href='/' className='relative text-lg sm:text-4xl font-semibold text-slate-700'>
        <h1 className='logo small' aria-label='Resellify - brand'>
          <span className='mark' aria-hidden>
            R
          </span>
          <span className='word'>Resellify</span>
        </h1>

        <p className='absolute text-[10px] font-semibold -top-1 -right-13 px-3 p-0.5 rounded-full flex items-center gap-2 text-white bg-green-500'>
          Admin
        </p>
      </Link>
      <div className='flex items-center gap-3'>
        <p>Hi, {name || 'Admin'}</p>
        <UserButton />
      </div>
    </div>
  );
};

export default AdminNavbar;
