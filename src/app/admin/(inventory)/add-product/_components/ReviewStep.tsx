import { CheckCircle } from 'lucide-react';
import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';

type Option = {
  id: string;
  name: string;
};

type OptionSet = {
  name: string;
  type: string;
  options?: Option[];
};

type Variant = {
  title: string;
  sku: string;
  price: number;
  stock: number;
  isDefault?: boolean;
};

type Specification = {
  specGroupId: string;
  specGroupTitle?: string;
  specGroupKeys?: string[];
  values: string[];
};

type FormData = {
  title?: string;
  sku?: string;
  basePrice?: number;
  salePrice?: number;
  status?: string;
  specifications?: Specification[];
  selectedCategoryIds?: string[];
  selectedOptionSets?: OptionSet[];
  variants?: Variant[];
};

export default function ReviewStep() {
  const { watch } = useFormContext<FormData>();

  const formData = watch();

  return (
    <div>
      <h2 className='text-xl font-semibold mb-2'>Review Product Details</h2>

      <div className='mb-3 rounded-md border border-blue-200 bg-blue-50 text-blue-700 p-3'>
        Please review all information before creating the product
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <div>
          <Card>
            <CardContent className='pt-6 space-y-2'>
              <div className='flex items-center text-sm font-medium'>
                <CheckCircle className='h-4 w-4 text-green-600 mr-2' />
                Basic Information
              </div>

              <div className='space-y-1 text-sm'>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>Title</span>
                  <span className='font-medium'>{formData.title}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>SKU</span>
                  <span className='font-medium'>{formData.sku}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>Base Price</span>
                  <span className='font-medium'>{`PKR ${formData.basePrice}`}</span>
                </div>
                {formData.salePrice && (
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>Sale Price</span>
                    <span className='font-medium'>{`PKR ${formData.salePrice}`}</span>
                  </div>
                )}
                <div className='flex justify-between items-center'>
                  <span className='text-muted-foreground'>Status</span>
                  <span className='inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors bg-secondary text-secondary-foreground'>
                    {formData.status}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='mt-3'>
            <CardContent className='pt-6'>
              <h3 className='text-lg font-medium mb-2'>Specifications</h3>

              {formData.specifications?.length ? (
                <ul className='space-y-2 text-sm'>
                  {formData.specifications.map((spec, index) => {
                    const groupTitle = spec.specGroupTitle || spec.specGroupId;
                    const groupKeys = spec.specGroupKeys || [];
                    return (
                      <li key={index} className='space-y-1'>
                        <div className='flex justify-between items-center'>
                          <span className='font-medium text-muted-foreground'>{groupTitle}</span>
                          {spec.specGroupTitle && (
                            <span className='text-xs text-muted-foreground'>(New)</span>
                          )}
                        </div>
                        <div className='flex flex-wrap gap-1 ml-2'>
                          {spec.values.map((value, i) => (
                            <span key={i} className='bg-muted px-2 py-0.5 rounded text-xs'>
                              <strong>{groupKeys[i] || `Key ${i + 1}`}:</strong> {value}
                            </span>
                          ))}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className='text-center text-muted-foreground py-2'>No specifications added</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardContent className='pt-6'>
              <h3 className='text-lg font-medium mb-2'>Categories</h3>

              {formData.selectedCategoryIds && formData.selectedCategoryIds.length > 0 ? (
                <div className='flex gap-1 flex-wrap'>
                  {formData.selectedCategoryIds.map((categoryId, index) => (
                    <span
                      key={index}
                      className='inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors bg-secondary text-secondary-foreground'
                    >
                      {categoryId}
                    </span>
                  ))}
                </div>
              ) : (
                <p className='text-center text-muted-foreground py-2'>No categories selected</p>
              )}
            </CardContent>
          </Card>

          <Card className='mt-3'>
            <CardContent className='pt-6'>
              <h3 className='text-lg font-medium mb-2'>
                Option Sets ({formData.selectedOptionSets?.length || 0})
              </h3>

              {formData.selectedOptionSets?.map((set, index) => (
                <div key={index} className='mb-2'>
                  <p className='text-sm font-medium'>
                    {set.name} ({set.type})
                  </p>
                  <div className='flex gap-1 flex-wrap mt-1'>
                    {set.options?.map((opt) => (
                      <span
                        key={opt.id}
                        className='inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors'
                      >
                        {opt.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className='mt-3'>
            <CardContent className='pt-6'>
              <h3 className='text-lg font-medium mb-2'>
                Variants ({formData.variants?.length || 0})
              </h3>

              {formData.variants?.length ? (
                <ul className='space-y-1 text-sm'>
                  {formData.variants.slice(0, 3).map((variant, index) => (
                    <li key={index} className='flex justify-between items-center'>
                      <span className='font-medium'>{variant.title}</span>
                      <span className='text-muted-foreground'>{`SKU: ${variant.sku} | Price: PKR ${variant.price} | Stock: ${variant.stock}`}</span>
                      {variant.isDefault && (
                        <span className='inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors bg-primary text-primary-foreground'>
                          Default
                        </span>
                      )}
                    </li>
                  ))}
                  {formData.variants.length > 3 && (
                    <li className='text-muted-foreground'>
                      {`... and ${formData.variants.length - 3} more variants`}
                    </li>
                  )}
                </ul>
              ) : (
                <p className='text-center text-muted-foreground py-2'>No variants created</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
