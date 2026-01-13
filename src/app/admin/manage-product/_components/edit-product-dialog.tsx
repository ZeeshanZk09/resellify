'use client';

import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { getProductById, updateProduct, type UpdateProductInput } from '@/actions/product/product';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Textarea } from '@/shared/components/ui/textarea';
import type { Product } from '@/shared/lib/generated/prisma/client';

interface EditProductDialogProps {
  productId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function EditProductDialog({
  productId,
  open,
  onOpenChange,
  onSuccess,
}: EditProductDialogProps) {
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [fetching, setFetching] = useState(false);

  const form = useForm<UpdateProductInput>({
    defaultValues: {
      id: '',
      title: '',
      slug: '',
      sku: '',
      basePrice: 0,
      salePrice: null,
      description: '',
      shortDescription: '',
      status: 'DRAFT',
      visibility: 'UNLISTED',
      inventory: 0,
      lowStockThreshold: 5,
    },
  });

  // Fetch product data when dialog opens
  useEffect(() => {
    if (open && productId) {
      setFetching(true);
      getProductById(productId)
        .then((result) => {
          if (result.error) {
            toast.error(result.error);
            onOpenChange(false);
            return;
          }

          if (result.data) {
            setProduct(result.data);
            form.reset({
              id: result.data.id,
              title: result.data.title,
              slug: result.data.slug,
              sku: result.data.sku,
              basePrice: result.data.basePrice,
              salePrice: result.data.salePrice,
              description: result.data.description || '',
              shortDescription: result.data.shortDescription || '',
              status: result.data.status,
              visibility: result.data.visibility,
              inventory: result.data.inventory,
              lowStockThreshold: result.data.lowStockThreshold,
            });
          }
        })
        .catch((error) => {
          console.error('Error fetching product:', error);
          toast.error('Failed to load product data');
          onOpenChange(false);
        })
        .finally(() => {
          setFetching(false);
        });
    }
  }, [open, productId, form, onOpenChange]);

  const onSubmit = async (data: UpdateProductInput) => {
    if (!productId) return;

    setLoading(true);
    try {
      const result = await updateProduct({
        ...data,
        id: productId,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success('Product updated successfully');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Failed to update product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
          <DialogDescription>Update product information below.</DialogDescription>
        </DialogHeader>

        {fetching ? (
          <div className='flex items-center justify-center py-8'>
            <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='title'
                  rules={{ required: 'Product title is required' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Product Title <span className='text-destructive'>*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder='Product Title' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='slug'
                  rules={{ required: 'Slug is required' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Slug <span className='text-destructive'>*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder='product-slug' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='sku'
                  rules={{ required: 'SKU is required' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        SKU <span className='text-destructive'>*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder='SKU' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='basePrice'
                  rules={{
                    required: 'Base price is required',
                    min: { value: 0, message: 'Price must be positive' },
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Base Price <span className='text-destructive'>*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          placeholder='0'
                          {...field}
                          onChange={(e) => field.onChange(Number.parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='salePrice'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sale Price (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          placeholder='0'
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value ? Number.parseFloat(e.target.value) : null
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='inventory'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Inventory</FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          placeholder='0'
                          {...field}
                          onChange={(e) => field.onChange(Number.parseInt(e.target.value, 10) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='status'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select status' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='DRAFT'>Draft</SelectItem>
                          <SelectItem value='PUBLISHED'>Published</SelectItem>
                          <SelectItem value='ARCHIVED'>Archived</SelectItem>
                          <SelectItem value='SCHEDULED'>Scheduled</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='visibility'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Visibility</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select visibility' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='PUBLIC'>Public</SelectItem>
                          <SelectItem value='PRIVATE'>Private</SelectItem>
                          <SelectItem value='UNLISTED'>Unlisted</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name='shortDescription'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Short Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='Brief description for product listings'
                        className='resize-none'
                        rows={3}
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='description'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='Full product description'
                        className='resize-none'
                        rows={5}
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type='submit' disabled={loading}>
                  {loading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
