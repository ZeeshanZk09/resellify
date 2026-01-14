'use client';

import { Pencil, Search, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { getAllProductsForAdmin } from '@/actions/product/product';
import EditProductDialog from './_components/edit-product-dialog';
import DeleteProductDialog from './_components/delete-product-dialog';
import ToggleStock from './_components/toggle-stock';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import type { Product } from '@/shared/lib/generated/prisma/client';

type ProductWithCategories = Product & {
  images: Array<{
    id: string;
    path: string;
    width: number | null;
    height: number | null;
  }>;
  categories: Array<{
    category: {
      id: string;
      name: string;
    };
  }>;
};

export default function StoreManageProducts() {
  const [products, setProducts] = useState<ProductWithCategories[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductWithCategories[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editProductId, setEditProductId] = useState<string | null>(null);
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const [deleteProductName, setDeleteProductName] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const currency = 'Rs';

  // Fetch products
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAllProductsForAdmin();
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (result.data) {
        setProducts(result.data as ProductWithCategories[]);
        setFilteredProducts(result.data as ProductWithCategories[]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Search functionality
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProducts(products);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = products.filter((product) => {
      // Search by title
      if (product.title.toLowerCase().includes(query)) return true;

      // Search by SKU
      if (product.sku?.toLowerCase().includes(query)) return true;

      // Search by slug
      if (product.slug.toLowerCase().includes(query)) return true;

      // Search by category names
      if (product.categories?.some((pc) => pc.category.name.toLowerCase().includes(query))) {
        return true;
      }

      return false;
    });

    setFilteredProducts(filtered);
  }, [searchQuery, products]);

  const handleEdit = (productId: string) => {
    setEditProductId(productId);
    setEditDialogOpen(true);
  };

  const handleDelete = (productId: string, productName: string) => {
    setDeleteProductId(productId);
    setDeleteProductName(productName);
    setDeleteDialogOpen(true);
  };

  const handleEditSuccess = () => {
    fetchProducts();
  };

  const handleDeleteSuccess = () => {
    fetchProducts();
  };

  if (loading) {
    return (
      <section className='py-6'>
        <div className='flex items-center justify-center py-12'>
          <div className='text-center'>
            <div className='inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]'></div>
            <p className='mt-4 text-muted-foreground'>Loading products...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className='py-6'>
      <div className='mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <h1 className='text-4xl text-slate-500'>
          Manage <span className='text-slate-800 font-medium'>Products</span>
        </h1>

        {/* Search Bar */}
        <div className='relative w-full sm:w-auto sm:min-w-[300px]'>
          <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            type='text'
            placeholder='Search by name, SKU, slug, or category...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='pl-10'
          />
        </div>
      </div>

      {/* Results count */}
      {searchQuery && (
        <div className='mb-4 text-sm text-muted-foreground'>
          Found {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} matching
          &quot;{searchQuery}&quot;
        </div>
      )}

      {filteredProducts.length === 0 ? (
        <div className='rounded-lg border border-dashed p-12 text-center'>
          <p className='text-muted-foreground'>
            {searchQuery ? 'No products found matching your search.' : 'No products found.'}
          </p>
        </div>
      ) : (
        <div className='rounded-lg border ring ring-slate-200 overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='w-full text-left text-sm'>
              <thead className='bg-slate-50 text-gray-700 uppercase tracking-wider'>
                <tr>
                  <th className='px-4 py-3'>Name</th>
                  <th className='px-4 py-3 hidden md:table-cell'>Description</th>
                  <th className='px-4 py-3 hidden md:table-cell'>MRP</th>
                  <th className='px-4 py-3'>Price</th>
                  <th className='px-4 py-3'>Status</th>
                  <th className='px-4 py-3'>Actions</th>
                </tr>
              </thead>
              <tbody className='text-slate-700'>
                {filteredProducts.map((product) => (
                  <tr
                    key={product.id}
                    className='border-t border-gray-200 hover:bg-gray-50 transition-colors'
                  >
                    <td className='px-4 py-3'>
                      <div className='flex gap-2 items-center'>
                        {product.images && product.images.length > 0 && (
                          <Image
                            className='w-14 h-14 p-1 shadow rounded cursor-pointer object-cover'
                            src={product.images[0].path}
                            alt={product.title}
                            width={product.images[0].width || 56}
                            height={product.images[0].height || 56}
                          />
                        )}
                        <div className='flex flex-col'>
                          <span className='font-medium'>{product.title}</span>
                          <span className='text-xs text-muted-foreground'>SKU: {product.sku}</span>
                        </div>
                      </div>
                    </td>
                    <td className='px-4 py-3 max-w-md text-slate-600 hidden md:table-cell truncate'>
                      {product.description || product.shortDescription || '-'}
                    </td>
                    <td className='px-4 py-3 hidden md:table-cell'>
                      {product.salePrice ? (
                        <span className='line-through text-muted-foreground'>
                          {currency} {product.salePrice.toLocaleString()}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className='px-4 py-3'>
                      <span className='font-semibold'>
                        {currency} {product.basePrice.toLocaleString()}
                      </span>
                    </td>
                    <td className='px-4 py-3'>
                      <div className='flex flex-col gap-1'>
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${
                            product.status === 'PUBLISHED'
                              ? 'bg-green-100 text-green-700 border-green-300'
                              : product.status === 'DRAFT'
                              ? 'bg-yellow-100 text-yellow-700 border-yellow-300'
                              : 'bg-gray-100 text-gray-700 border-gray-300'
                          }`}
                        >
                          {product.status}
                        </span>
                        <ToggleStock product={product} />
                      </div>
                    </td>
                    <td className='px-4 py-3'>
                      <div className='flex items-center gap-2'>
                        <Button
                          type='button'
                          size='sm'
                          variant='outline'
                          onClick={() => handleEdit(product.id)}
                          className='h-8 w-8 p-0'
                        >
                          <Pencil className='h-4 w-4' />
                          <span className='sr-only'>Edit product</span>
                        </Button>
                        <Button
                          type='button'
                          size='sm'
                          variant='destructive'
                          onClick={() => handleDelete(product.id, product.title)}
                          className='h-8 w-8 p-0'
                        >
                          <Trash2 className='h-4 w-4' />
                          <span className='sr-only'>Delete product</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      <EditProductDialog
        productId={editProductId}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={handleEditSuccess}
      />

      {/* Delete Dialog */}
      <DeleteProductDialog
        productId={deleteProductId}
        productName={deleteProductName}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onSuccess={handleDeleteSuccess}
      />
    </section>
  );
}
