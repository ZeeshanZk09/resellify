'use client';

import { useEffect, useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Switch } from '@/shared/components/ui/switch';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Separator } from '@/shared/components/ui/separator';
import { toast } from 'sonner';
import { Textarea } from '@/shared/components/ui/textarea';
import { Category } from '@/shared/lib/generated/prisma/browser';
import { addProduct } from '@/actions/product/product';
import { Trash2, Plus } from 'lucide-react';
import { getSubCategoriesById } from '@/actions/category/category';
import { generateProductSlug } from '@/shared/lib/utils/category';

// Define Zod schema matching AddProductInput
const productSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  sku: z.string().min(1, 'SKU is required'),
  basePrice: z.number().min(0, 'Base price must be positive'),
  salePrice: z.number().optional().nullable(),
  description: z.string().optional().nullable(),
  shortDescription: z.string().optional().nullable(),
  currency: z.string().default('PKR'),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
  visibility: z.enum(['PUBLIC', 'PRIVATE', 'UNLISTED']).default('UNLISTED'),
  inventory: z.number().min(0).default(0),
  lowStockThreshold: z.number().min(0).default(5),
  images: z.preprocess((val) => {
    if (val instanceof FileList) {
      return Array.from(val);
    }
    return val;
  }, z.array(z.instanceof(File)).min(1, 'At least one image is required')),
  optionSets: z
    .array(
      z.object({
        name: z.string().min(1, 'Option set name is required'),
        type: z
          .enum(['TEXT', 'COLOR', 'NUMBER', 'SIZE', 'MEASURE', 'RANGE', 'BOOLEAN'])
          .default('TEXT'),
        options: z
          .array(
            z.object({
              name: z.string().min(1, 'Option name is required'),
              value: z.string().optional().nullable(),
              position: z.number().default(0),
            })
          )
          .default([]),
      })
    )
    .optional()
    .default([]),
  variants: z
    .array(
      z.object({
        sku: z.string().optional().nullable(),
        title: z.string().optional().nullable(),
        price: z.number().min(0, 'Price must be positive'),
        salePrice: z.number().optional().nullable(),
        stock: z.number().default(0),
        isDefault: z.boolean().default(false),
        weightGram: z.number().optional().nullable(),
        options: z.array(z.string()).default([]),
      })
    )
    .optional()
    .default([]),
  specs: z
    .object({
      groupTitle: z.string(),
      keys: z.array(z.string()),
      values: z.array(z.string()),
    })
    .optional(),
  tags: z
    .array(
      z.object({
        name: z.string(),
        slug: z.string(),
      })
    )
    .optional()
    .default([]),
  category: z.object({
    name: z.string().min(1, 'Category name is required'),
    slug: z.string().min(1, 'Category slug is required'),
    description: z.string().optional().nullable(),
    parentId: z.string().optional().nullable(),
  }),
});

type ProductFormData = z.infer<typeof productSchema>;

interface AddProductFormProps {
  initialCategories: Category[];
}

export default function AddProductForm({ initialCategories }: AddProductFormProps) {
  const [loading, setLoading] = useState(false);
  const [tagInput, setTagInput] = useState({ name: '', slug: '' });
  const [subCats, setSubCats] = useState<Category[] | undefined>([]);
  const [specsInput, setSpecsInput] = useState({
    groupTitle: '',
    keys: '',
    values: '',
  });

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      currency: 'PKR',
      status: 'DRAFT',
      visibility: 'UNLISTED',
      inventory: 0,
      lowStockThreshold: 5,
      optionSets: [],
      variants: [],
      tags: [],
      category: {
        name: '',
        slug: '',
        description: '',
        parentId: '',
      },
    },
  });

  const {
    fields: optionSetFields,
    append: appendOptionSet,
    remove: removeOptionSet,
  } = useFieldArray({
    control,
    name: 'optionSets',
  });

  const {
    fields: variantFields,
    append: appendVariant,
    remove: removeVariant,
  } = useFieldArray({
    control,
    name: 'variants',
  });

  const optionSets = watch('optionSets');
  const tags = watch('tags');
  const title = watch('title');

  useEffect(() => {
    if (!title) return;
    async function setData() {
      setValue('slug', await generateProductSlug(title), {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
    setData();
  }, [title, setValue]);

  const handleCategorySelect = async (categoryId: string) => {
    const category = initialCategories.find((c) => c.id === categoryId);
    if (category) {
      setValue('category', {
        name: category.name,
        slug: category.slug,
        description: category.description || '',
        parentId: category.parentId || '',
      });
      const subCategories = await getSubCategoriesById(category.id);
      setSubCats(subCategories.res);
    }
  };

  const addTag = () => {
    if (tagInput.name && tagInput.slug) {
      const currentTags = watch('tags') || [];
      setValue('tags', [...currentTags, { ...tagInput }]);
      setTagInput({ name: '', slug: '' });
    }
  };

  const removeTag = (index: number) => {
    const currentTags = watch('tags') || [];
    setValue(
      'tags',
      currentTags.filter((_, i) => i !== index)
    );
  };

  const addSpecs = () => {
    if (specsInput.groupTitle && specsInput.keys && specsInput.values) {
      const keysArray = specsInput.keys.split(',').map((k) => k.trim());
      const valuesArray = specsInput.values.split(',').map((v) => v.trim());

      if (keysArray.length === valuesArray.length) {
        setValue('specs', {
          groupTitle: specsInput.groupTitle,
          keys: keysArray,
          values: valuesArray,
        });
        toast.success('Specifications added');
      } else {
        toast.error('Number of keys and values must match');
      }
    }
  };

  const onSubmit = async (data: ProductFormData) => {
    try {
      setLoading(true);

      // Images are already converted to File[] by the Zod transform
      const result = await addProduct({
        ...data,
        images: Array.isArray(data.images) ? data.images : Array.from(data.images),
        // Ensure optional fields are properly formatted
        salePrice: data.salePrice || null,
        description: data.description || null,
        shortDescription: data.shortDescription || null,
        variants: data.variants?.map((variant) => ({
          ...variant,
          productId: '', // Provide a placeholder or generate this ID as required by your implementation
          sku: variant.sku || null,
          salePrice: variant.salePrice || null,
          weightGram: variant.weightGram || null,
        })),
        specs: data.specs || undefined,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Product created successfully!');
        // Reset form or redirect
      }
    } catch (error) {
      toast.error('Failed to create product');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  console.log(errors);
  return (
    <form onSubmit={handleSubmit(onSubmit)} className='py-14 space-y-8 max-w-4xl mx-auto'>
      {/* Basic Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='title'>Title*</Label>
            <Input
              id='title'
              placeholder="Product title — e.g. 'Men's Slim Jeans'"
              aria-describedby='title-help'
              {...register('title')}
            />
            <p id='title-help' className='text-sm text-gray-500'>
              The public name of the product shown in listings and search results.
            </p>
            {errors.title && <p className='text-sm text-red-500'>{errors.title.message}</p>}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='slug'>Slug*</Label>
            <Input
              id='slug'
              placeholder='product-slug — lowercase, hyphens only'
              aria-describedby='slug-help'
              {...register('slug')}
            />
            <p id='slug-help' className='text-sm text-gray-500'>
              URL-friendly identifier (lowercase, hyphens). Example: <code>mens-slim-jeans</code>.
            </p>
            {errors.slug && <p className='text-sm text-red-500'>{errors.slug.message}</p>}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='sku'>SKU*</Label>
            <Input
              id='sku'
              placeholder='SKU-001'
              aria-describedby='sku-help'
              {...register('sku')}
            />
            <p id='sku-help' className='text-sm text-gray-500'>
              Unique stock keeping code used internally to track this product.
            </p>
            {errors.sku && <p className='text-sm text-red-500'>{errors.sku.message}</p>}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='description'>Description</Label>
            <Textarea
              id='description'
              rows={5}
              placeholder='Full product description — features, materials, care instructions'
              aria-describedby='description-help'
              {...register('description')}
            />
            <p id='description-help' className='text-sm text-gray-500'>
              Full detailed content shown on the product page. Include dimensions, materials, and
              benefits.
            </p>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='shortDescription'>Short Description</Label>
            <Textarea
              id='shortDescription'
              rows={3}
              placeholder='Short summary — 1–2 sentence highlight'
              aria-describedby='shortDescription-help'
              {...register('shortDescription')}
            />
            <p id='shortDescription-help' className='text-sm text-gray-500'>
              A brief summary shown in lists and quick views (useful for ads and search snippets).
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Card */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing</CardTitle>
        </CardHeader>
        <CardContent className='grid grid-cols-2 gap-4'>
          <div className='space-y-2'>
            <Label htmlFor='basePrice'>Base Price*</Label>
            <Input
              id='basePrice'
              type='number'
              placeholder='0'
              aria-describedby='basePrice-help'
              {...register('basePrice', { valueAsNumber: true })}
            />
            <p id='basePrice-help' className='text-sm text-gray-500'>
              The regular price customers pay before any discount.
            </p>
            {errors.basePrice && <p className='text-sm text-red-500'>{errors.basePrice.message}</p>}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='salePrice'>Sale Price</Label>
            <Input
              id='salePrice'
              type='number'
              placeholder='0'
              aria-describedby='salePrice-help'
              {...register('salePrice', { valueAsNumber: true })}
            />
            <p id='salePrice-help' className='text-sm text-gray-500'>
              Optional discounted price. Leave empty if not on sale. Should be lower than Base
              Price.
            </p>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='currency'>Currency</Label>
            <Input
              id='currency'
              placeholder='PKR'
              defaultValue='PKR'
              aria-describedby='currency-help'
              {...register('currency')}
            />
            <p id='currency-help' className='text-sm text-gray-500'>
              Currency code used for pricing (ISO code like PKR, USD, EUR).
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Card */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory</CardTitle>
        </CardHeader>
        <CardContent className='grid sm:grid-cols-2 gap-4'>
          <div className='space-y-2'>
            <Label htmlFor='inventory'>Stock Quantity</Label>
            <Input
              id='inventory'
              type='number'
              placeholder='0'
              aria-describedby='inventory-help'
              {...register('inventory', { valueAsNumber: true })}
            />
            <p id='inventory-help' className='text-sm text-gray-500'>
              Number of items currently available for sale. Use 0 if out of stock.
            </p>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='lowStockThreshold'>Low Stock Threshold</Label>
            <Input
              id='lowStockThreshold'
              type='number'
              placeholder='5'
              defaultValue={5}
              aria-describedby='lowStockThreshold-help'
              {...register('lowStockThreshold', { valueAsNumber: true })}
            />
            <p id='lowStockThreshold-help' className='text-sm text-gray-500'>
              When stock falls to this number, the system should flag the item for restocking.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle>Status & Visibility</CardTitle>
        </CardHeader>
        <CardContent className='grid sm:grid-cols-2 gap-4'>
          <div className='space-y-2'>
            <Label>Status</Label>
            <Controller
              name='status'
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  aria-describedby='status-help'
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select status' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='DRAFT'>Draft</SelectItem>
                    <SelectItem value='PUBLISHED'>Published</SelectItem>
                    <SelectItem value='ARCHIVED'>Archived</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            <p id='status-help' className='text-sm text-gray-500'>
              Draft = not visible to customers. Published = visible. Archived = kept for records but
              not listed.
            </p>
          </div>

          <div className='space-y-2'>
            <Label>Visibility</Label>
            <Controller
              name='visibility'
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  aria-describedby='visibility-help'
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select visibility' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='PUBLIC'>Public</SelectItem>
                    <SelectItem value='PRIVATE'>Private</SelectItem>
                    <SelectItem value='UNLISTED'>Unlisted</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            <p id='visibility-help' className='text-sm text-gray-500'>
              Public = visible to everyone. Private = only visible to admins. Unlisted = accessible
              by direct link only.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Images Card */}
      <Card>
        <CardHeader>
          <CardTitle>Product Images*</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            type='file'
            accept='image/*'
            multiple
            aria-describedby='images-help'
            {...register('images')}
          />
          <p id='images-help' className='text-sm text-gray-500 mt-2'>
            Upload clear product photos. Recommended: 800×800px or larger, JPG/PNG. First image will
            be primary.
          </p>
          {errors.images && <p className='text-sm text-red-500 mt-2'>{errors.images.message}</p>}
        </CardContent>
      </Card>

      {/* Category Card */}
      <Card>
        <CardHeader>
          <CardTitle>Category*</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex gap-2 justify-between'>
            <div className='space-y-2 w-full'>
              <Label>Select Existing Category</Label>
              <Select onValueChange={handleCategorySelect} aria-describedby='existingCategory-help'>
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Select category' />
                </SelectTrigger>
                <SelectContent>
                  {initialCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p id='existingCategory-help' className='text-sm text-gray-500'>
                Choose an existing category to group this product with similar items.
              </p>
            </div>
            <div className='space-y-2 w-full'>
              <Label>Select Subcategory (optional)</Label>
              <Select onValueChange={handleCategorySelect} aria-describedby='subCategory-help'>
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Select category' />
                </SelectTrigger>
                <SelectContent>
                  {subCats?.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p id='subCategory-help' className='text-sm text-gray-500'>
                Optional: refine the product into a subcategory for better filtering.
              </p>
            </div>
          </div>

          <Separator />

          <div className='space-y-4'>
            <h4 className='font-medium'>Or Create New Category</h4>
            <div className='space-y-2'>
              <Label htmlFor='category.name'>Category Name*</Label>
              <Input
                id='category.name'
                placeholder='Category Name'
                aria-describedby='categoryName-help'
                {...register('category.name')}
              />
              <p id='categoryName-help' className='text-sm text-gray-500'>
                New category shown in menus and filters.
              </p>
              {errors.category?.name && (
                <p className='text-sm text-red-500'>{errors.category.name.message}</p>
              )}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='category.slug'>Category Slug*</Label>
              <Input
                id='category.slug'
                placeholder='category-slug'
                aria-describedby='categorySlug-help'
                {...register('category.slug')}
              />
              <p id='categorySlug-help' className='text-sm text-gray-500'>
                URL-friendly identifier for the category (lowercase, hyphens).
              </p>
              {errors.category?.slug && (
                <p className='text-sm text-red-500'>{errors.category.slug.message}</p>
              )}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='category.description'>Category Description</Label>
              <Textarea
                id='category.description'
                placeholder='Category Description'
                aria-describedby='categoryDescription-help'
                {...register('category.description')}
              />
              <p id='categoryDescription-help' className='text-sm text-gray-500'>
                Short description used on category pages and SEO.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tags Card */}
      <Card>
        <CardHeader>
          <CardTitle>Tags</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-2 gap-4 mb-4'>
            <div className='space-y-2'>
              <Label>Tag Name</Label>
              <Input
                value={tagInput.name}
                onChange={(e) => setTagInput({ ...tagInput, name: e.target.value })}
                placeholder="Tag Name — e.g. 'organic'"
                aria-describedby='tagName-help'
              />
              <p id='tagName-help' className='text-sm text-gray-500'>
                Short keyword used for quick filtering and search.
              </p>
            </div>
            <div className='space-y-2'>
              <Label>Tag Slug</Label>
              <Input
                value={tagInput.slug}
                onChange={(e) => setTagInput({ ...tagInput, slug: e.target.value })}
                placeholder='tag-slug'
                aria-describedby='tagSlug-help'
              />
              <p id='tagSlug-help' className='text-sm text-gray-500'>
                URL-friendly tag identifier (used in search links).
              </p>
            </div>
          </div>
          <Button type='button' onClick={addTag} variant='outline' size='sm'>
            <Plus className='w-4 h-4 mr-2' /> Add Tag
          </Button>

          {tags && tags.length > 0 && (
            <div className='space-y-2 mt-4'>
              <Label>Added Tags</Label>
              <div className='flex flex-wrap gap-2'>
                {tags.map((tag, index) => (
                  <div
                    key={index}
                    className='flex items-center gap-2 bg-secondary px-3 py-1 rounded-full'
                  >
                    <span>{tag.name}</span>
                    <button
                      type='button'
                      onClick={() => removeTag(index)}
                      className='text-red-500 hover:text-red-700'
                    >
                      <Trash2 className='w-4 h-4' />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Option Sets Card */}
      <Card>
        <CardHeader className='flex flex-row items-center justify-between'>
          <CardTitle>Option Sets</CardTitle>
          <Button
            type='button'
            onClick={() => appendOptionSet({ name: '', type: 'TEXT', options: [] })}
            variant='outline'
            size='sm'
          >
            <Plus className='w-4 h-4 mr-2' /> Add Option Set
          </Button>
        </CardHeader>
        <CardContent className='space-y-6'>
          <p className='text-sm text-gray-500'>
            Option sets define selectable attributes (e.g., Size, Color). They power product
            variants.
          </p>

          {optionSetFields.map((field, index) => (
            <div key={field.id} className='space-y-4 p-4 border rounded-lg'>
              <div className='flex items-center justify-between'>
                <h4 className='font-medium'>Option Set {index + 1}</h4>
                <Button
                  type='button'
                  onClick={() => removeOptionSet(index)}
                  variant='ghost'
                  size='sm'
                  className='text-red-500'
                >
                  <Trash2 className='w-4 h-4' />
                </Button>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label>Name</Label>
                  <Input placeholder='e.g., Size' {...register(`optionSets.${index}.name`)} />
                  <p className='text-sm text-gray-500'>Human-readable name used in the UI.</p>
                </div>
                <div className='space-y-2'>
                  <Label>Type</Label>
                  <Controller
                    name={`optionSets.${index}.type`}
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder='Select type' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='TEXT'>Text</SelectItem>
                          <SelectItem value='COLOR'>Color</SelectItem>
                          <SelectItem value='NUMBER'>Number</SelectItem>
                          <SelectItem value='SIZE'>Size</SelectItem>
                          <SelectItem value='MEASURE'>Measure</SelectItem>
                          <SelectItem value='RANGE'>Range</SelectItem>
                          <SelectItem value='BOOLEAN'>Boolean</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <p className='text-sm text-gray-500'>
                    Type affects how options are displayed (color swatches vs text).
                  </p>
                </div>
              </div>

              <div className='space-y-2'>
                <Label>Options</Label>
                <Button
                  type='button'
                  onClick={() => {
                    const currentOptions = optionSets?.[index]?.options || [];
                    setValue(`optionSets.${index}.options`, [
                      ...currentOptions,
                      { name: '', value: '', position: currentOptions.length },
                    ]);
                  }}
                  variant='outline'
                  size='sm'
                >
                  <Plus className='w-4 h-4 mr-2' /> Add Option
                </Button>

                {optionSets?.[index]?.options?.map((_, optionIndex) => (
                  <div key={optionIndex} className='grid grid-cols-3 gap-4 mt-2'>
                    <Input
                      placeholder='Option name (e.g., Large)'
                      {...register(`optionSets.${index}.options.${optionIndex}.name`)}
                    />
                    <Input
                      placeholder='Option value (e.g., L or #ff0000)'
                      {...register(`optionSets.${index}.options.${optionIndex}.value`)}
                    />
                    <div className='flex items-center gap-2'>
                      <Input
                        type='number'
                        placeholder='Position'
                        {...register(`optionSets.${index}.options.${optionIndex}.position`, {
                          valueAsNumber: true,
                        })}
                      />
                      <Button
                        type='button'
                        onClick={() => {
                          const currentOptions = [...(optionSets?.[index]?.options || [])];
                          currentOptions.splice(optionIndex, 1);
                          setValue(`optionSets.${index}.options`, currentOptions);
                        }}
                        variant='ghost'
                        size='sm'
                        className='text-red-500'
                      >
                        <Trash2 className='w-4 h-4' />
                      </Button>
                    </div>
                  </div>
                ))}
                <p className='text-sm text-gray-500'>
                  Add individual options that customers can select (order controls display order).
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Variants Card */}
      <Card>
        <CardHeader className='flex flex-row items-center justify-between'>
          <CardTitle>Variants</CardTitle>
          <Button
            type='button'
            onClick={() =>
              appendVariant({
                sku: '',
                title: '',
                price: 0,
                salePrice: null,
                stock: 0,
                isDefault: false,
                weightGram: null,
                options: [],
              })
            }
            variant='outline'
            size='sm'
          >
            <Plus className='w-4 h-4 mr-2' /> Add Variant
          </Button>
        </CardHeader>
        <CardContent className='space-y-4'>
          <p className='text-sm text-gray-500'>
            Variants are concrete sellable items (combination of option values). Example: Red /
            Large.
          </p>

          {variantFields.map((field, index) => (
            <div key={field.id} className='space-y-4 p-4 border rounded-lg'>
              <div className='flex items-center justify-between'>
                <h4 className='font-medium'>Variant {index + 1}</h4>
                <Button
                  type='button'
                  onClick={() => removeVariant(index)}
                  variant='ghost'
                  size='sm'
                  className='text-red-500'
                >
                  <Trash2 className='w-4 h-4' />
                </Button>
              </div>

              <div className='grid sm:grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label>SKU</Label>
                  <Input placeholder='Variant SKU' {...register(`variants.${index}.sku`)} />
                </div>
                <div className='space-y-2'>
                  <Label>Title</Label>
                  <Input placeholder='Variant Title' {...register(`variants.${index}.title`)} />
                </div>
                <div className='space-y-2'>
                  <Label>Price*</Label>
                  <Input
                    type='number'
                    placeholder='Price'
                    {...register(`variants.${index}.price`, { valueAsNumber: true })}
                  />
                </div>
                <div className='space-y-2'>
                  <Label>Sale Price</Label>
                  <Input
                    type='number'
                    placeholder='Sale Price'
                    {...register(`variants.${index}.salePrice`, { valueAsNumber: true })}
                  />
                </div>
                <div className='space-y-2'>
                  <Label>Stock</Label>
                  <Input
                    type='number'
                    placeholder='Stock'
                    {...register(`variants.${index}.stock`, { valueAsNumber: true })}
                  />
                </div>
                <div className='space-y-2'>
                  <Label>Weight (grams)</Label>
                  <Input
                    type='number'
                    placeholder='Weight'
                    {...register(`variants.${index}.weightGram`, { valueAsNumber: true })}
                  />
                </div>
                <div className='space-y-2'>
                  <Label>Options (comma separated)</Label>
                  <Input
                    placeholder='option1, option2'
                    onChange={(e) => {
                      const options = e.target.value
                        .split(',')
                        .map((opt) => opt.trim())
                        .filter((opt) => opt);
                      setValue(`variants.${index}.options`, options);
                    }}
                  />
                  <p className='text-sm text-gray-500'>
                    Enter option values that define this variant (match Option Sets).
                  </p>
                </div>
                <div className='flex items-center gap-3'>
                  <Label htmlFor={`variants.${index}.isDefault`}>Default Variant</Label>
                  <Controller
                    name={`variants.${index}.isDefault`}
                    control={control}
                    render={({ field }) => (
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    )}
                  />
                  <p className='text-sm text-gray-500'>
                    Set which variant is shown first on the product page.
                  </p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Specifications Card */}
      <Card>
        <CardHeader>
          <CardTitle>Specifications</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='space-y-2'>
            <Label>Group Title</Label>
            <Input
              value={specsInput.groupTitle}
              onChange={(e) => setSpecsInput({ ...specsInput, groupTitle: e.target.value })}
              placeholder='e.g., General'
            />
          </div>
          <div className='space-y-2'>
            <Label>Keys (comma separated)</Label>
            <Input
              value={specsInput.keys}
              onChange={(e) => setSpecsInput({ ...specsInput, keys: e.target.value })}
              placeholder='e.g., Material, Color, Size'
            />
          </div>
          <div className='space-y-2'>
            <Label>Values (comma separated)</Label>
            <Input
              value={specsInput.values}
              onChange={(e) => setSpecsInput({ ...specsInput, values: e.target.value })}
              placeholder='e.g., Cotton, Red, Large'
            />
          </div>
          <p className='text-sm text-gray-500'>
            Add structured specs shown in the product details table. Keys and values should match in
            order.
          </p>
          <Button type='button' onClick={addSpecs} variant='outline'>
            Add Specifications
          </Button>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <Button type='submit' className='w-full' disabled={loading}>
        {loading ? 'Creating Product...' : 'Add Product'}
      </Button>
    </form>
  );
}
