import React, { useState, useCallback, memo, useEffect } from "react";
import {
  useFormContext,
  Controller,
  ControllerRenderProps,
  useWatch,
} from "react-hook-form";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Label } from "@/shared/components/ui/label";
import { ChevronDown, ChevronUp, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/shared/lib/utils";

// Define Category interface matching the expected structure
interface Category {
  id: string;
  name: string;
  children?: Category[];
}

// Define the specific form values this component uses
interface CategoryFormValues {
  selectedCategoryIds: string[];
}

// Component props interface
interface CategoryStepProps {
  categories: Category[];
  loading?: boolean;
}

// Memoized CategoryItem component for better performance
const CategoryItem = memo(
  ({
    category,
    level,
    isExpanded,
    onToggle,
    field,
  }: {
    category: Category;
    level: number;
    isExpanded: boolean;
    onToggle: (categoryId: string) => void;
    field: ControllerRenderProps<CategoryFormValues, "selectedCategoryIds">;
  }) => {
    const hasChildren = Boolean(
      category.children && category.children.length > 0
    );
    const isChecked =
      Array.isArray(field.value) && field.value.includes(category.id);

    const handleCheckboxChange = useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const currentValue = Array.isArray(field.value) ? field.value : [];
        const newValue = event.target.checked
          ? [...currentValue, category.id]
          : currentValue.filter((id: string) => id !== category.id);
        field.onChange(newValue);
      },
      [category.id, field]
    );

    return (
      <div className={cn("ml-4", level > 0 && `ml-${level * 4}`)}>
        <div className="flex items-center mb-1">
          {hasChildren ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => onToggle(category.id)}
              className="min-w-[30px] h-8 p-1"
              aria-label={
                isExpanded
                  ? `Collapse ${category.name}`
                  : `Expand ${category.name}`
              }
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          ) : (
            <div className="w-[30px]" /> // Spacer for alignment
          )}

          <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded transition-colors">
            <input
              type="checkbox"
              checked={isChecked}
              onChange={handleCheckboxChange}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
              aria-checked={isChecked}
              aria-label={`Select ${category.name} category`}
            />
            <span className="select-none text-sm font-medium">
              {category.name}
            </span>
          </label>
        </div>

        {isExpanded && hasChildren && category.children && (
          <CategoryTree
            categories={category.children}
            level={level + 1}
            expandedCategories={{ [category.id]: isExpanded }}
            onToggle={onToggle}
            field={field}
          />
        )}
      </div>
    );
  }
);

CategoryItem.displayName = "CategoryItem";

// Memoized CategoryTree component
const CategoryTree = memo(
  ({
    categories,
    level,
    expandedCategories,
    onToggle,
    field,
  }: {
    categories: Category[];
    level: number;
    expandedCategories: Record<string, boolean>;
    onToggle: (categoryId: string) => void;
    field: ControllerRenderProps<CategoryFormValues, "selectedCategoryIds">;
  }) => {
    return (
      <>
        {categories.map((category) => (
          <CategoryItem
            key={category.id}
            category={category}
            level={level}
            isExpanded={Boolean(expandedCategories[category.id])}
            onToggle={onToggle}
            field={field}
          />
        ))}
      </>
    );
  }
);

CategoryTree.displayName = "CategoryTree";

const CategoryStep: React.FC<CategoryStepProps> = ({
  categories,
  loading = false,
}) => {
  const {
    control,
    formState: { errors },
  } = useFormContext<CategoryFormValues>();
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({});
  const selectedCategoryIds = useWatch({
    control,
    name: "selectedCategoryIds",
  });

  const toggleCategory = useCallback((categoryId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  }, []);

  // Reset expanded categories when categories change
  useEffect(() => {
    setExpandedCategories({});
  }, [categories]);

  const categoryError = errors.selectedCategoryIds?.message as
    | string
    | undefined;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground">Loading categories...</p>
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <div className="p-4 text-center border rounded-lg bg-muted/50">
        <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-muted-foreground">No categories available.</p>
        <p className="text-sm text-muted-foreground mt-1">
          Please contact an administrator to set up product categories.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold mb-2">Select Categories</h2>
        <p className="text-muted-foreground mb-4">
          Choose one or more categories for your product
        </p>

        {selectedCategoryIds && selectedCategoryIds.length > 0 && (
          <div className="mb-4 p-3 bg-primary/5 border border-primary/20 rounded-md">
            <p className="text-sm font-medium text-primary">
              Selected: {selectedCategoryIds.length} category
              {selectedCategoryIds.length !== 1 ? "s" : ""}
            </p>
          </div>
        )}
      </div>

      <Card className="max-h-[400px] overflow-auto border-muted">
        <CardContent className="pt-6">
          <Controller<CategoryFormValues, "selectedCategoryIds">
            name="selectedCategoryIds"
            control={control}
            rules={{
              required: "Please select at least one category",
              validate: (value: string[]) => {
                if (!Array.isArray(value) || value.length === 0) {
                  return "Please select at least one category";
                }
                return true;
              },
            }}
            render={({ field }) => (
              <div className="space-y-1">
                <Label htmlFor="category-tree" className="sr-only">
                  Category selection
                </Label>
                <div id="category-tree" className="mt-2 space-y-2">
                  <CategoryTree
                    categories={categories}
                    level={0}
                    expandedCategories={expandedCategories}
                    onToggle={toggleCategory}
                    field={field}
                  />
                </div>

                {categoryError && (
                  <p className="text-sm text-destructive mt-2 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {categoryError}
                  </p>
                )}
              </div>
            )}
          />
        </CardContent>
      </Card>

      <div className="text-sm text-muted-foreground pt-2">
        <p>Tips:</p>
        <ul className="list-disc pl-5 mt-1 space-y-1">
          <li>
            Select relevant categories to help customers find your product
          </li>
          <li>
            You can select multiple categories if your product fits in more than
            one
          </li>
          <li>Use the arrow buttons to expand/collapse subcategories</li>
        </ul>
      </div>
    </div>
  );
};

// Add display name for debugging
CategoryStep.displayName = "CategoryStep";

export default memo(CategoryStep);
