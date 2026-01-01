"use client";
import { useState } from "react";

interface ProductVariantSelectorProps {
  variants: any[];
  productId: string;
}

export default function ProductVariantSelector({
  variants,
  productId,
}: ProductVariantSelectorProps) {
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string>
  >({});

  const handleOptionSelect = (variantId: string, optionValue: string) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [variantId]: optionValue,
    }));
  };

  return (
    <div className="space-y-4">
      {variants.map((variant) => (
        <div key={variant.id} className="space-y-2">
          <label className="block font-medium text-gray-700">
            {variant.title}
          </label>
          <div className="flex flex-wrap gap-2">
            {variant.options?.map((option: any) => (
              <button
                key={option.id}
                onClick={() =>
                  handleOptionSelect(variant.id, option.option.value)
                }
                className={`px-4 text-sm py-2 border rounded-lg transition-all ${
                  selectedOptions[variant.id] === option.option.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-gray-300 hover:border-primary"
                }`}
                aria-label={`Select ${option.option.value} ${variant.title}`}
                aria-pressed={
                  selectedOptions[variant.id] === option.option.value
                }
              >
                {option.option.value}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
