import React from "react";
import { useFormContext, Controller, type FieldValues } from "react-hook-form";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Label } from "@/shared/components/ui/label";
import { ChevronDown, ChevronUp } from "lucide-react";

interface Category {
  id: string;
  name: string;
  children?: Category[];
}

interface CategoryStepProps {
  categories: Category[];
  loading?: boolean;
}

export default function CategoryStep({
  categories,
  loading,
}: CategoryStepProps) {
  const { control } = useFormContext<FieldValues>();
  const [expandedCategories, setExpandedCategories] = React.useState<
    Record<string, boolean>
  >({});

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const renderCategoryTree = (categoryList: Category[], level = 0) => {
    return categoryList.map((category) => (
      <div key={category.id} className={`ml-${level * 3}`}>
        <div className="flex items-center mb-1">
          {category.children && category.children.length > 0 && (
            <Button
              size="sm"
              onClick={() => toggleCategory(category.id)}
              className="min-w-[30px]"
            >
              {expandedCategories[category.id] ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          )}

          <Controller
            name="selectedCategoryIds"
            control={control}
            rules={{ required: "Please select at least one category" }}
            render={({ field }) => (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  checked={
                    Array.isArray(field.value) &&
                    field.value.includes(category.id)
                  }
                  onChange={(e) => {
                    const currentValue = Array.isArray(field.value)
                      ? field.value
                      : [];
                    const newValue = e.target.checked
                      ? [...currentValue, category.id]
                      : currentValue.filter((id: string) => id !== category.id);
                    field.onChange(newValue);
                  }}
                />
                <span>{category.name}</span>
              </label>
            )}
          />
        </div>

        {expandedCategories[category.id] &&
          category.children &&
          renderCategoryTree(category.children, level + 1)}
      </div>
    ));
  };

  if (loading) {
    return (
      <div className="flex justify-center p-4">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Select Categories</h2>

      <Card className="max-h-[400px] overflow-auto">
        <CardContent className="pt-6">
          <Label>Choose one or more categories for your product</Label>
          <div className="mt-2 space-y-2">{renderCategoryTree(categories)}</div>
        </CardContent>
      </Card>
    </div>
  );
}
