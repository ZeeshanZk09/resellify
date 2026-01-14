'use client';

// import { getCategories } from "@/actions/category/category";
// import { Category } from "@/shared/lib/generated/prisma/browser";
// import AddProductForm from "./components/add-product-client";

// export default async function StoreAddProductPage() {
//   // Fetch categories on the server
//   const categoriesResult = await getCategories();
//   const categories = categoriesResult.res || [];

//   return <AddProductForm initialCategories={categories} />;
// }

// "use client";

// import ProductForm from "@/domains/admin/components/product/productForm";
// import React from "react";

// export default function Page() {
//   return (
//     <div>
//       <ProductForm
//         formValues={{
//           name: "",
//           // description: "",
//           price: "0",
//           // categoryId: "",
//           images: [],
//           brandID: "",
//           isAvailable: true,
//           specialFeatures: [],
//           categoryID: "",
//           specifications: [],
//         }}
//         onChange={(values) => console.log(values)}
//       />
//     </div>
//   );
// }

import { Check, Loader2 } from 'lucide-react';
// ProductCreationWizard.jsx
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { FieldValues, FormProvider, type SubmitHandler, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { type GetCategoryTree, getCategoryTree } from '@/actions/category/category';
import {
  type GetCategoryOptionSets,
  getCategoryOptionSets,
} from '@/actions/category/categoryOptions';
import { type GetSpecGroups, getSpecGroups } from '@/actions/category/specifications';
import {
  type AddProductInput,
  addProduct,
  addProductSpecs,
  addProductVariants,
} from '@/actions/product/product';
import { uploadImage } from '@/actions/product/product-image';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import type { OptionSet } from '@/shared/lib/generated/prisma/browser';
import BasicInfoStep from './_components/BasicInformationForm';
import CategoryStep from './_components/CategoryStep';
import OptionSetsStep from './_components/OptionSetsStep';
import ReviewStep from './_components/ReviewStep';
import SpecificationsStep from './_components/SpecificationsStep';
import VariantsStep from './_components/VariantsStep';

const steps = [
  'Category Selection',
  'Option Sets',
  'Basic Information',
  'Specifications',
  'Variants',
  'Review & Create',
] as const;

// Define complete form data type
type ProductFormData = AddProductInput & {
  images: File[] | File;
  selectedCategoryIds: string[];
  selectedOptionSets: OptionSet[];
  specifications: Array<{
    specGroupId: string;
    specGroupTitle?: string;
    specGroupKeys?: string[];
    values: string[];
  }>;
  variants: Array<{
    title?: string | null;
    sku?: string | null;
    price?: number;
    salePrice?: number | null;
    stock?: number;
    isDefault?: boolean;
    weightGram?: number | null;
    options?: Array<{
      optionSetId: string;
      optionId: string;
    }>;
  }>;
};

// Type for the API error response
interface ApiError {
  message: string;
  statusCode?: number;
  errors?: Record<string, string[]>;
}

// Type guard for ApiError
function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as ApiError).message === 'string'
  );
}

// Type guard for Error
function isError(error: unknown): error is Error {
  return error instanceof Error;
}

export default function ProductCreationWizard() {
  const [activeStep, setActiveStep] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [preloadedData, setPreloadedData] = useState<{
    categories: GetCategoryTree;
    optionSets: GetCategoryOptionSets;
    specGroups: GetSpecGroups;
  }>({
    categories: [],
    optionSets: [],
    specGroups: [],
  });

  useEffect(() => {
    console.log('[INIT] Product form mounted');
  }, []);

  const methods = useForm<ProductFormData>({
    defaultValues: {
      // Step 1: Category
      selectedCategoryIds: [],

      // Step 2: Option Sets
      selectedOptionSets: [],

      // Step 3: Basic Info
      title: '',
      slug: '',
      sku: '',
      basePrice: 0,
      salePrice: 0,
      shortDescription: '',
      description: '',
      status: 'DRAFT',
      visibility: 'UNLISTED',
      images: [],
      inventory: 0,
      lowStockThreshold: 5,

      // Step 4: Specifications
      specifications: [],

      // Step 5: Variants
      variants: [],

      // SEO
      metaKeywords: [],
      metadata: {},
    },
  });

  console.log('[FORM] Default values loaded', methods.getValues());

  // Load pre-requisite data
  useEffect(() => {
    console.log('[FETCH] Loading prerequisite data...');
    let timer: NodeJS.Timeout;
    fetchPreloadedData().then(() => {
      timer = setTimeout(() => {
        setLoading(false);
      }, 600);
    });
    return () => clearTimeout(timer);
  }, []);

  const fetchPreloadedData = useCallback(async (): Promise<void> => {
    try {
      // setLoading(true);
      setError('');

      console.time('[FETCH] Preloaded Data');
      const [categoriesRes, optionSetsRes, specGroupsRes] = await Promise.all([
        getCategoryTree().then((res) => {
          console.log('[FETCH] Categories:', res?.res);
          // methods.setValue(
          //   "selectedCategoryIds",
          //   res?.res?.map((cat) => cat.id) || []
          // );
          return res;
        }),
        getCategoryOptionSets(),
        getSpecGroups(),
      ]);
      console.timeEnd('[FETCH] Preloaded Data');

      setPreloadedData({
        categories: categoriesRes.res ?? [],
        optionSets: optionSetsRes.res ?? [],
        specGroups: specGroupsRes.res ?? [],
      });

      console.log('[FETCH] Categories:', categoriesRes.res);
      console.log('[FETCH] Option Sets:', optionSetsRes.res);
      console.log('[FETCH] Spec Groups:', specGroupsRes.res);
    } catch (err: unknown) {
      console.error('[ERROR] Failed loading preloaded data', err);
      const errorMessage = isError(err) ? err.message : 'Failed to load required data';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      // setLoading(false);
    }
  }, [methods]);

  const handleNext = async (e?: FormEvent<HTMLButtonElement>): Promise<void> => {
    // Prevent any form submission
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    console.log(`[STEP] Trying to move forward from step ${activeStep}`);

    // Don't proceed if we're already on the last step
    if (activeStep >= steps.length - 1) {
      console.warn('[STEP] Already on last step, cannot proceed');
      return;
    }

    const isValid = await methods.trigger();

    console.log(`[STEP] Validation result:`, isValid);

    if (isValid) {
      setActiveStep((prev) => {
        const nextStep = prev + 1;
        console.log(`[STEP] Moving to step ${nextStep}`);
        return nextStep;
      });
    } else {
      const errors = methods.formState.errors;
      console.warn('[STEP] Validation failed', errors);

      // Show first validation error
      const firstError = Object.values(errors)[0];
      if (firstError?.message) {
        toast.error(firstError.message as string);
      } else {
        toast.error('Please fill in all required fields');
      }
    }
  };

  const handleBack = (): void => {
    setActiveStep((prev) => {
      const prevStep = prev - 1;
      console.log(`[STEP] Moving back to step ${prevStep}`);
      return prevStep;
    });
  };

  const processProductSubmission = async (
    data: ProductFormData,
    isDraft: boolean = false
  ): Promise<void> => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      console.group('[SUBMIT] Product Data');
      const { images: formImages, ...dataWithoutImages } = data;
      console.log('Raw Form Data (without images):', dataWithoutImages);
      console.log('Is Draft:', isDraft);
      console.log('Images type:', typeof formImages);
      console.log(
        'Images:',
        formImages
          ? Array.isArray(formImages)
            ? `${formImages.length} files`
            : formImages instanceof File
            ? '1 file'
            : typeof formImages
          : 'No images'
      );
      if (formImages) {
        if (Array.isArray(formImages)) {
          console.log(
            'Image files:',
            formImages.map((img, i) => `${i + 1}. ${img instanceof File ? img.name : typeof img}`)
          );
        } else if (formImages instanceof File) {
          console.log('Image file:', formImages.name);
        }
      }
      console.log('Categories:', data.selectedCategoryIds);
      console.log('Option Sets:', data.selectedOptionSets);
      console.log('Specifications:', data.specifications);
      console.log('Variants:', data.variants);
      console.groupEnd();

      // Step 1: Create basic product
      console.time('[API] addProduct');

      // Format specifications for API (preserve specGroupTitle and specGroupKeys for manual creation)
      const formattedSpecs =
        data.specifications?.map((spec) => ({
          specGroupId: spec.specGroupId,
          specGroupTitle: spec.specGroupTitle,
          specGroupKeys: spec.specGroupKeys,
          values: spec.values,
        })) || [];

      // Format variants for API
      const formattedVariants =
        data.variants?.map((variant) => ({
          title: variant.title,
          sku: variant.sku,
          price: variant.price,
          salePrice: variant.salePrice,
          stock: variant.stock,
          isDefault: variant.isDefault,
          weightGram: variant.weightGram,
          options: variant.options || [],
        })) || [];

      const productRes = await addProduct({
        title: data.title,
        basePrice: Number(data.basePrice),
        salePrice: data.salePrice ? Number(data.salePrice) : null,
        slug: data.slug,
        sku: data.sku,
        shortDescription: data.shortDescription,
        description: data.description,
        status: isDraft ? 'DRAFT' : data.status,
        visibility: isDraft ? 'PRIVATE' : data.visibility,
        inventory: Number(data.inventory),
        lowStockThreshold: data.lowStockThreshold,
        metaKeywords: data.metaKeywords,
        metadata: data.metadata,
        images: data.images,
        selectedCategoryIds: data.selectedCategoryIds,
        specifications: formattedSpecs,
        variants: formattedVariants,
      });
      console.timeEnd('[API] addProduct');

      if (productRes.error) {
        const errorMessage =
          typeof productRes.error === 'string' ? productRes.error : 'Failed to create product';
        toast.error(errorMessage);
        return;
      }

      console.log('[SUCCESS] Product created successfully');
      const successMessage = isDraft
        ? 'Product saved as draft successfully!'
        : 'Product created successfully!';
      setSuccess(successMessage);
      toast.success(successMessage);

      methods.reset();
      setActiveStep(0);
    } catch (err: unknown) {
      console.error('[ERROR] Product creation failed', err);

      let errorMessage: string;

      if (isApiError(err)) {
        errorMessage = err.message;
      } else if (isError(err)) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      } else {
        errorMessage = 'Failed to create product';
      }

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const saveAsDraft = async (): Promise<void> => {
    console.log('[STEP] Saving as draft...');
    const data = methods.getValues();
    await processProductSubmission(data, true);
  };

  const handleSubmit: SubmitHandler<ProductFormData> = async (data): Promise<void> => {
    // Only allow submission on the Review step (last step)
    if (activeStep !== steps.length - 1) {
      console.warn('[SUBMIT] Form submission prevented - not on Review step');
      return;
    }

    console.log('[SUBMIT] Product Data', data);

    await processProductSubmission(
      {
        ...data,
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
      },
      false
    );
  };

  const handleFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Only submit if we're on the last step (Review step)
    if (activeStep === steps.length - 1) {
      methods.handleSubmit(handleSubmit)(e);
    } else {
      // If not on last step, just prevent default and do nothing
      // The Next button will handle navigation
      console.log('[FORM] Submission prevented - use Next button to continue');
    }
  };

  const renderStep = (step: number): React.ReactNode => {
    const watchedCategoryIds = methods.watch('selectedCategoryIds');

    switch (step) {
      case 0:
        return <CategoryStep categories={preloadedData.categories!} loading={loading} />;
      case 1: {
        const selectedCategoryIds = watchedCategoryIds?.map((id: string) => id.toString()) ?? [];

        if (selectedCategoryIds.length === 0) {
          toast.warning('No categories selected. Please go back and select at least one category.');
          return (
            <div className='p-4 text-center text-muted-foreground'>
              Please select categories in the previous step first.
            </div>
          );
        }

        return (
          <OptionSetsStep
            optionSets={preloadedData.optionSets}
            selectedCategoryIds={selectedCategoryIds}
          />
        );
      }
      case 2:
        return <BasicInfoStep />;
      case 3:
        return <SpecificationsStep specGroups={preloadedData.specGroups!} />;
      case 4:
        return <VariantsStep selectedOptionSets={methods.watch('selectedOptionSets')} />;
      case 5:
        return <ReviewStep />;
      default:
        return null;
    }
  };

  return (
    <FormProvider {...methods}>
      <div className='max-w-6xl mx-auto p-6 py-14'>
        {/* Title */}
        <h1 className='text-2xl font-semibold mb-6'>Create New Product</h1>

        {/* Stepper */}
        <div className='flex items-center gap-4 mb-8'>
          {steps.map((label, index) => (
            <div key={label} className='flex items-center gap-2'>
              <div
                className={`h-8 w-8 flex items-center justify-center rounded-full text-sm font-medium
              ${
                index <= activeStep
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-muted-foreground text-muted-foreground'
              }
            `}
              >
                {index < activeStep ? <Check className='h-4 w-4' /> : index + 1}
              </div>
              <span
                className={`text-sm ${
                  index === activeStep ? 'font-medium' : 'text-muted-foreground'
                }`}
              >
                {label}
              </span>
              {index !== steps.length - 1 && <div className='w-6 h-px bg-muted-foreground/30' />}
            </div>
          ))}
        </div>

        {/* Form Card */}
        <Card className='mb-6'>
          <CardHeader className='flex justify-between items-start'>
            <CardTitle>{steps[activeStep]}</CardTitle>
            <Button
              type='button'
              variant='destructive'
              onClick={saveAsDraft}
              disabled={loading || activeStep < 3}
            >
              Save as Draft
            </Button>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleFormSubmit} className='space-y-6' noValidate>
              {renderStep(activeStep)}

              {/* Navigation Buttons */}
              <div className='flex justify-between pt-6'>
                <Button
                  type='button'
                  variant={'outline'}
                  disabled={activeStep === 0}
                  onClick={handleBack}
                >
                  Back
                </Button>

                {activeStep === steps.length - 1 ? (
                  <Button type='submit' disabled={loading} className='min-w-[140px]'>
                    {loading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                    {loading ? 'Creating...' : 'Create Product'}
                  </Button>
                ) : (
                  <Button type='button' onClick={handleNext} disabled={loading}>
                    Next
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Error Alert */}
        {error && (
          <div className='p-4 mb-4 text-red-700 bg-red-50 border border-red-200 rounded-md'>
            <p className='font-medium'>Error</p>
            <p className='text-sm'>{error}</p>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className='p-4 mb-4 text-green-700 bg-green-50 border border-green-200 rounded-md'>
            <p className='font-medium'>Success</p>
            <p className='text-sm'>{success}</p>
          </div>
        )}
      </div>
    </FormProvider>
  );
}
