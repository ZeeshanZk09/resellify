"use client";
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
import React, { useState, useEffect, useCallback } from "react";
import { useForm, FormProvider } from "react-hook-form";

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
  Snackbar,
} from "@mui/material";
import CategoryStep from "./_components/CategoryStep";
import OptionSetsStep from "./_components/OptionSetsStep";
import BasicInfoStep from "./_components/BasicInformationForm";
import SpecificationsStep from "./_components/SpecificationsStep";
import VariantsStep from "./_components/VariantsStep";
import ReviewStep from "./_components/ReviewStep";
import { GetCategoryTree, getCategoryTree } from "@/actions/category/category";
import {
  GetCategoryOptionSets,
  getCategoryOptionSets,
} from "@/actions/category/categoryOptions";
import {
  GetSpecGroups,
  getSpecGroups,
} from "@/actions/category/specifications";
import {
  addProduct,
  AddProductInput,
  addProductSpecs,
  addProductVariants,
} from "@/actions/product/product";
import { uploadImage } from "@/actions/product/product-image";
import { OptionSet } from "@/shared/lib/generated/prisma/browser";
import { Check, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";

const steps = [
  "Category Selection",
  "Option Sets",
  "Basic Information",
  "Specifications",
  "Variants",
  "Review & Create",
];

export default function ProductCreationWizard() {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
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
    console.log("[INIT] Product form mounted");
  }, []);

  const methods = useForm<
    AddProductInput & {
      images: { file: File }[];
      selectedCategoryIds: string[];
      selectedOptionSets: OptionSet[];
      specifications: { groupId: string; value: string }[];
      variants: { optionSetId: string; price: number; stock: number }[];
    }
  >({
    defaultValues: {
      // Step 1: Category
      selectedCategoryIds: [],

      // Step 2: Option Sets
      selectedOptionSets: [],

      // Step 3: Basic Info
      title: "",
      slug: "",
      sku: "",
      basePrice: 0,
      salePrice: 0,
      shortDescription: "",
      description: "",
      status: "DRAFT",
      visibility: "UNLISTED",
      images: [],
      inventory: 0,
      lowStockThreshold: 5,

      // Step 4: Specifications
      specifications: [],

      // Step 5: Variants
      variants: [],

      // SEO
      metaTitle: "",
      metaDescription: "",
      canonicalUrl: "",
    },
  });

  console.log("[FORM] Default values loaded", methods.getValues());

  // Load pre-requisite data
  useEffect(() => {
    console.log("[FETCH] Loading prerequisite data...");
    fetchPreloadedData();
  }, []);

  const fetchPreloadedData = useCallback(async () => {
    try {
      setLoading(true);

      console.time("[FETCH] Preloaded Data");
      const [categoriesRes, optionSetsRes, specGroupsRes] = await Promise.all([
        getCategoryTree(),
        getCategoryOptionSets(),
        getSpecGroups(),
      ]);
      console.timeEnd("[FETCH] Preloaded Data");

      setPreloadedData({
        categories: categoriesRes.res,
        optionSets: optionSetsRes.res,
        specGroups: specGroupsRes.res,
      });

      console.log("[FETCH] Categories:", categoriesRes.res);
      console.log("[FETCH] Option Sets:", optionSetsRes.res);
      console.log("[FETCH] Spec Groups:", specGroupsRes.res);
    } catch (err) {
      console.error("[ERROR] Failed loading preloaded data", err);
      setError("Failed to load required data");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleNext = async () => {
    console.log(`[STEP] Trying to move forward from step ${activeStep}`);

    const isValid = await methods.trigger();

    console.log(`[STEP] Validation result:`, isValid);

    if (isValid) {
      setActiveStep((prev) => {
        console.log(`[STEP] Moving to step ${prev + 1}`);
        return prev + 1;
      });
    } else {
      console.warn("[STEP] Validation failed", methods.formState.errors);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => {
      console.log(`[STEP] Moving back to step ${prev - 1}`);
      return prev - 1;
    });
  };

  const handleSubmit = async (
    data: AddProductInput & {
      images: { file: File }[];
      selectedCategoryIds: string[];
      selectedOptionSets: OptionSet[];
      specifications: { groupId: string; value: string }[];
      variants: { optionSetId: string; price: number; stock: number }[];
    }
  ) => {
    try {
      setLoading(true);
      setError("");

      // Step 1: Create basic product
      const productRes = await addProduct({
        title: data.title,

        basePrice: Number(data.basePrice),

        salePrice: data.salePrice ? Number(data.salePrice) : null,
        slug: data.slug,
        sku: data.sku,
        shortDescription: data.shortDescription,
        description: data.description,
        status: data.status,
        visibility: data.visibility,
        inventory: data.inventory,
        lowStockThreshold: data.lowStockThreshold,
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
        canonicalUrl: data.canonicalUrl,
      });

      const productId = productRes.data?.id;

      // Step 2: Upload images
      if (data.images.length > 0) {
        await Promise.all(
          data.images.map(async (image: { file: File }) => {
            const formData = new FormData();
            formData.append("file", image.file);
            formData.append("productId", productId!);
            await uploadImage(
              {
                productId: productId!,
                type: "PRODUCT",
              },
              formData.get("file") as File
            );
          })
        );
      }

      // Step 3: Add specifications
      if (data.specifications.length > 0) {
        await addProductSpecs(
          productId!,
          data.specifications.map((spec) => ({
            groupTitle: spec.groupId,
            keys: [spec.groupId],
            values: [spec.value],
          }))
        );
      }

      // Step 4: Create variants
      if (data.variants.length > 0) {
        await addProductVariants(
          productId!,
          data.variants.map((variant) => ({
            optionSetId: variant.optionSetId,
            price: variant.price,
            stock: variant.stock,
          }))
        );
      }

      setSuccess("Product created successfully!");
      methods.reset();
      setActiveStep(0);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create product");
    } finally {
      setLoading(false);
    }
  };

  const renderStep = (step: number) => {
    switch (step) {
      case 0:
        return (
          <CategoryStep
            categories={preloadedData.categories!}
            loading={loading}
          />
        );
      case 1:
        return (
          <OptionSetsStep
            optionSets={preloadedData.optionSets!}
            selectedCategoryIds={methods.watch("selectedCategoryIds")}
          />
        );
      case 2:
        return <BasicInfoStep />;
      case 3:
        return <SpecificationsStep specGroups={preloadedData.specGroups!} />;
      case 4:
        return (
          <VariantsStep
            selectedOptionSets={methods.watch("selectedOptionSets")}
          />
        );
      case 5:
        return <ReviewStep />;
      default:
        return null;
    }
  };

  return (
    <FormProvider {...methods}>
      <div className="max-w-6xl mx-auto p-6">
        {/* Title */}
        <h1 className="text-2xl font-semibold mb-6">Create New Product</h1>

        {/* Stepper */}
        <div className="flex items-center gap-4 mb-8">
          {steps.map((label, index) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className={`h-8 w-8 flex items-center justify-center rounded-full text-sm font-medium
              ${
                index <= activeStep
                  ? "bg-primary text-primary-foreground"
                  : "border border-muted-foreground text-muted-foreground"
              }
            `}
              >
                {index < activeStep ? <Check className="h-4 w-4" /> : index + 1}
              </div>
              <span
                className={`text-sm ${
                  index === activeStep ? "font-medium" : "text-muted-foreground"
                }`}
              >
                {label}
              </span>
              {index !== steps.length - 1 && (
                <div className="w-6 h-px bg-muted-foreground/30" />
              )}
            </div>
          ))}
        </div>

        {/* Form Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{steps[activeStep]}</CardTitle>
          </CardHeader>

          <CardContent>
            <form
              onSubmit={methods.handleSubmit((data) =>
                handleSubmit({
                  ...data,
                  images: data.images.map((image) => ({ file: image.file })),
                  basePrice: Number(data.basePrice),
                  salePrice: data.salePrice ? Number(data.salePrice) : null,
                  status: data.status!,
                  visibility: data.visibility!,
                  inventory: data.inventory,
                  lowStockThreshold: data.lowStockThreshold,
                  metaTitle: data.metaTitle,
                  metaDescription: data.metaDescription,
                  canonicalUrl: data.canonicalUrl,
                })
              )}
              className="space-y-6"
            >
              {renderStep(activeStep)}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6">
                <Button
                  type="button"
                  variant={"outlined"}
                  disabled={activeStep === 0}
                  onClick={handleBack}
                >
                  Back
                </Button>

                {activeStep === steps.length - 1 ? (
                  <Button type="submit" disabled={loading}>
                    {loading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {loading ? "Creating..." : "Create Product"}
                  </Button>
                ) : (
                  <Button type="button" onClick={handleNext} disabled={loading}>
                    Next
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert variant={"standard"} className="mb-4">
            <p>{error}</p>
          </Alert>
        )}

        {/* Success Alert */}
        {success && (
          <Alert className="border-green-500 text-green-600">
            <p>{success}</p>
          </Alert>
        )}
      </div>
    </FormProvider>
  );
}
