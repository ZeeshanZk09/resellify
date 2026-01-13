import { AlertCircle, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import type React from "react";
import { memo, useCallback, useEffect, useState } from "react";
import {
  Controller,
  type ControllerRenderProps,
  useFormContext,
  useWatch,
} from "react-hook-form";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Label } from "@/shared/components/ui/label";
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
      category.children && category.children.length > 0,
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
      [category.id, field],
    );

    return (
      <li
        className={cn("ml-4", level > 0 && `ml-${level * 4}`)}
        aria-level={level + 1}
      >
        <div className="flex items-center mb-1">
          {hasChildren ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => onToggle(category.id)}
              className="min-w-[30px] h-8 p-1"
              aria-expanded={isExpanded}
              aria-controls={`category-${category.id}-children`}
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

          <div className="flex items-center gap-2 px-2 py-1 rounded transition-colors hover:bg-gray-50">
            <input
              id={`category-${category.id}-checkbox`}
              name={field.name}
              type="checkbox"
              value={category.id}
              checked={isChecked}
              onChange={handleCheckboxChange}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
              aria-checked={isChecked}
              aria-describedby="category-error selection-status"
              aria-label={`Select ${category.name} category`}
            />
            <Label
              htmlFor={`category-${category.id}-checkbox`}
              className="select-none text-sm font-medium cursor-pointer"
            >
              {category.name}
            </Label>
          </div>
        </div>

        {isExpanded && hasChildren && category.children && (
          <CategoryTree
            categories={category.children}
            level={level + 1}
            expandedCategories={{ [category.id]: isExpanded }}
            onToggle={onToggle}
            field={field}
            treeId={`category-${category.id}-children`}
          />
        )}
      </li>
    );
  },
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
    treeId,
  }: {
    categories: Category[];
    level: number;
    expandedCategories: Record<string, boolean>;
    onToggle: (categoryId: string) => void;
    field: ControllerRenderProps<CategoryFormValues, "selectedCategoryIds">;
    treeId?: string;
  }) => {
    return (
      <ul
        id={treeId!}
        className="space-y-2 "
        role="tree"
        aria-labelledby={treeId}
        aria-multiselectable="true"
      >
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
      </ul>
    );
  },
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
      <div
        className="flex flex-col items-center justify-center p-8 space-y-4"
        role="status"
        aria-live="polite"
      >
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
    <section className="space-y-4" aria-labelledby="category-heading">
      <header>
        <h2 id="category-heading" className="text-xl font-semibold mb-2">
          Select Categories
        </h2>
        <p className="text-muted-foreground mb-4">
          Choose one or more categories for your product
        </p>

        {selectedCategoryIds && selectedCategoryIds.length > 0 && (
          <div
            className="mb-4 p-3 bg-primary/5 border border-primary/20 rounded-md"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            <p
              id="selection-status"
              className="text-sm font-medium text-primary"
            >
              Selected: {selectedCategoryIds.length}{" "}
              {selectedCategoryIds.length === 1 ? "category" : "categories"}
            </p>
          </div>
        )}
      </header>

      <Card
        className="max-h-[400px] overflow-auto [&::-webkit-scrollbar]:w-1
  [&::-webkit-scrollbar-track]:bg-gray-100
  [&::-webkit-scrollbar-thumb]:bg-gray-300 border-muted"
      >
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
              <fieldset
                className="space-y-1"
                aria-describedby="category-help category-error"
                aria-invalid={Boolean(categoryError)}
              >
                <legend className="sr-only">Category selection</legend>
                <p id="category-help" className="sr-only">
                  You can select multiple categories.
                </p>
                <div className="mt-2 space-y-2 ">
                  <CategoryTree
                    categories={categories}
                    level={0}
                    expandedCategories={expandedCategories}
                    onToggle={toggleCategory}
                    field={field}
                    treeId="category-tree"
                  />
                </div>

                {categoryError && (
                  <p
                    id="category-error"
                    role="alert"
                    className="text-sm text-destructive mt-2 flex items-center gap-1"
                  >
                    <AlertCircle className="h-4 w-4" />
                    {categoryError}
                  </p>
                )}
              </fieldset>
            )}
          />
        </CardContent>
      </Card>

      <footer className="text-sm text-muted-foreground pt-2">
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
      </footer>
    </section>
  );
};

// Add display name for debugging
CategoryStep.displayName = "CategoryStep";

export default memo(CategoryStep);
