import { getAllProducts } from '@/actions/product/product';
import ProductCard from '@/domains/product/components/productCard';
import { MoveLeftIcon } from 'lucide-react';

export default async function Shop({ searchParams }: { searchParams: { search?: string } }) {
  const search = searchParams?.search ?? '';

  // Server-side fetch
  const products = await getAllProducts();

  if (!products) {
    return (
      <div className='min-h-[70vh] flex items-center justify-center'>
        <p className='text-slate-500'>Products not found.</p>
      </div>
    );
  }

  // Server-side filtering
  const filteredProducts = search
    ? products.filter((product) => product.name.toLowerCase().includes(search.toLowerCase()))
    : products;

  return (
    <div className='min-h-[70vh] mx-6'>
      <div className='max-w-7xl mx-auto'>
        <a
          href='/shop'
          className='text-2xl text-slate-500 my-6 flex items-center gap-2 cursor-pointer'
        >
          {search && <MoveLeftIcon size={20} />}
          All <span className='text-slate-700 font-medium'>Products</span>
        </a>

        <div className='grid grid-cols-2 sm:flex flex-wrap gap-6 xl:gap-12 mx-auto mb-32'>
          {filteredProducts.map((product) => (
            // <ProductCard key={product.id} imgUrl={} />
          ))}
        </div>
      </div>
    </div>
  );
}
