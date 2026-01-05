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

// ProductCreationWizard.jsx
import React, { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import axios from 'axios';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import CategoryStep from './_components/CategoryStep';
import OptionSetsStep from './_components/OptionSetsStep';
import BasicInfoStep from './_components/BasicInformationForm';
import SpecificationsStep from './_components/SpecificationsStep';
import VariantsStep from './_components/VariantsStep';
import ReviewStep from './_components/ReviewStep';

const steps = [
  'Category Selection',
  'Option Sets',
  'Basic Information',
  'Specifications',
  'Variants',
  'Review & Create'
];

export default function ProductCreationWizard() {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [preloadedData, setPreloadedData] = useState({
    categories: [],
    optionSets: [],
    specGroups: []
  });

  const methods = useForm({
    defaultValues: {
      // Step 1: Category
      selectedCategoryIds: [],
      
      // Step 2: Option Sets
      selectedOptionSets: [],
      
      // Step 3: Basic Info
      title: '',
      slug: '',
      sku: '',
      basePrice: '',
      salePrice: '',
      shortDescription: '',
      longDescription: '',
      status: 'DRAFT',
      visibility: 'UNLISTED',
      images: [],
      inventory: 0,
      lowStockThreshold: 5,
      
      // Step 4: Specifications
      specifications: [],
      
      // Step 5: Variants
      variants: [],
      variantGenerationMethod: 'matrix', // 'matrix' or 'manual'
      
      // SEO
      metaTitle: '',
      metaDescription: '',
      canonicalUrl: ''
    }
  });

  // Load pre-requisite data
  useEffect(() => {
    fetchPreloadedData();
  }, []);

  const fetchPreloadedData = async () => {
    try {
      setLoading(true);
      const [categoriesRes, optionSetsRes, specGroupsRes] = await Promise.all([
        axios.get('/api/categories/tree'),
        axios.get('/api/option-sets'),
        axios.get('/api/spec-groups')
      ]);
      
      setPreloadedData({
        categories: categoriesRes.data,
        optionSets: optionSetsRes.data,
        specGroups: specGroupsRes.data
      });
    } catch (err) {
      setError('Failed to load required data');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    // Validate current step
    const isValid = await methods.trigger();
    if (isValid) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleSubmit = async (data: any) => {
    try {
      setLoading(true);
      setError('');
      
      // Step 1: Create basic product
      const productRes = await axios.post('/api/products', {
        title: data.title,
        categoryIds: data.selectedCategoryIds,
        basePrice: parseFloat(data.basePrice),
        salePrice: data.salePrice ? parseFloat(data.salePrice) : null,
        slug: data.slug,
        sku: data.sku,
        shortDescription: data.shortDescription,
        description: data.longDescription,
        status: data.status,
        visibility: data.visibility,
        inventory: parseInt(data.inventory),
        lowStockThreshold: parseInt(data.lowStockThreshold),
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
        canonicalUrl: data.canonicalUrl
      });

      const productId = productRes.data.id;

      // Step 2: Upload images
      if (data.images.length > 0) {
        await Promise.all(
          data.images.map(async (image: { file: File }) => {
            const formData = new FormData();
            formData.append('file', image.file);
            formData.append('productId', productId);
            return axios.post('/api/uploads', formData);
          })
        );
      }

      // Step 3: Add specifications
      if (data.specifications.length > 0) {
        await axios.post(`/api/products/${productId}/specs`, data.specifications);
      }

      // Step 4: Create variants
      if (data.variants.length > 0) {
        await axios.post(`/api/products/${productId}/variants`, data.variants);
      }

      setSuccess('Product created successfully!');
      methods.reset();
      setActiveStep(0);
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = (step: number) => {
    switch (step) {
      case 0:
        return <CategoryStep 
          categories={preloadedData.categories} 
          loading={loading}
        />;
      case 1:
        return <OptionSetsStep 
          optionSets={preloadedData.optionSets}
          selectedCategoryIds={methods.watch('selectedCategoryIds')}
        />;
      case 2:
        return <BasicInfoStep />;
      case 3:
        return <SpecificationsStep 
          specGroups={preloadedData.specGroups}
        />;
      case 4:
        return <VariantsStep 
          selectedOptionSets={methods.watch('selectedOptionSets')}
        />;
      case 5:
        return <ReviewStep />;
      default:
        return null;
    }
  };

  return (
    <FormProvider {...methods}>
      <Box sx={{ maxWidth: 1200, margin: 'auto', p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Create New Product
        </Typography>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <form onSubmit={methods.handleSubmit(handleSubmit)}>
            {renderStep(activeStep)}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                variant="outlined"
              >
                Back
              </Button>

              {activeStep === steps.length - 1 ? (
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading}
                  startIcon={loading && <CircularProgress size={20} />}
                >
                  {loading ? 'Creating...' : 'Create Product'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={loading}
                >
                  Next
                </Button>
              )}
            </Box>
          </form>
        </Paper>

        <Snackbar 
          open={!!error} 
          autoHideDuration={6000}
          onClose={() => setError('')}
        >
          <Alert severity="error" onClose={() => setError('')}>
            {error}
          </Alert>
        </Snackbar>

        <Snackbar 
          open={!!success} 
          autoHideDuration={6000}
          onClose={() => setSuccess('')}
        >
          <Alert severity="success" onClose={() => setSuccess('')}>
            {success}
          </Alert>
        </Snackbar>
      </Box>
    </FormProvider>
  );
}