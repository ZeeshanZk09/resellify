import { Plus, Sparkles, Trash2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import type { ProductVariant } from "@/shared/lib/generated/prisma/browser";

type Option = {
  id: string;
  name: string;
  value?: string;
};

type OptionSet = {
  id: string;
  name: string;
  type?: string;
  options?: Option[];
};

// Define a type for the variant in the form state
type FormVariant = Omit<
  ProductVariant,
  "id" | "productId" | "createdAt" | "updatedAt" | "options"
> & {
  id?: string;
  options: { optionSetId: string; optionId: string }[];
};

type ManualVariantState = {
  title: string;
  sku: string;
  price: string;
  stock: string;
  options: { optionSetId: string; optionId: string }[];
};

interface VariantsStepProps {
  selectedOptionSets: OptionSet[];
}

export default function VariantsStep({
  selectedOptionSets,
}: VariantsStepProps) {
  const { control, watch, setValue } = useFormContext();
  const [variantMethod, setVariantMethod] = useState<"matrix" | "manual">(
    "matrix"
  );
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string[]>
  >({});
  const [manualVariant, setManualVariant] = useState<ManualVariantState>({
    title: "",
    sku: "",
    price: "",
    stock: "",
    options: [],
  });

  const variants = (watch("variants") as FormVariant[]) || [];

  // Initialize selected options from option sets
  useEffect(() => {
    const initialOptions: Record<string, string[]> = {};
    selectedOptionSets.forEach((set) => {
      initialOptions[set.id] = set.options?.map((opt) => opt.id) || [];
    });
    setSelectedOptions(initialOptions);
  }, [selectedOptionSets]);

  const generateVariants = () => {
    const selectedOptionArrays = Object.values(selectedOptions).filter(
      (arr) => arr.length > 0
    );
    if (selectedOptionArrays.length === 0) return;

    const generateCombinations = (
      arrays: string[][],
      index = 0,
      current: string[] = []
    ): string[][] => {
      if (index === arrays.length) return [current];
      const result: string[][] = [];
      for (const optionId of arrays[index]) {
        result.push(
          ...generateCombinations(arrays, index + 1, [...current, optionId])
        );
      }
      return result;
    };

    const combinations = generateCombinations(selectedOptionArrays);
    const basePrice = Number(watch("basePrice")) || 0;
    const salePrice = watch("salePrice") ? Number(watch("salePrice")) : null;

    const generatedVariants: FormVariant[] = combinations.map(
      (combo, index) => {
        const optionObjects = combo
          .map((optionId) => {
            for (const set of selectedOptionSets) {
              const option = set.options?.find((opt) => opt.id === optionId);
              if (option) return { optionSetId: set.id, optionId, option };
            }
            return null;
          })
          .filter(
            (
              obj
            ): obj is {
              optionSetId: string;
              optionId: string;
              option: Option;
            } => obj !== null
          );

        const variantTitle = optionObjects
          .map((opt) => opt.option.name)
          .join(" / ");
        const skuParts = optionObjects.map((opt) =>
          opt.option.name
            .replace(/[^a-zA-Z0-9]/g, "")
            .toUpperCase()
            .substring(0, 3)
        );
        const baseSku = (watch("sku") as string) || "PROD";

        return {
          title: variantTitle,
          sku: `${baseSku}-${skuParts.join("-")}`,
          price: basePrice,
          salePrice: salePrice,
          stock: 0,
          isDefault: index === 0,
          options: optionObjects.map((obj) => ({
            optionSetId: obj.optionSetId,
            optionId: obj.optionId,
          })),
          weightGram: null,
          images: [],
        };
      }
    );

    setValue("variants", generatedVariants);
  };

  const addManualVariant = () => {
    if (!manualVariant.title || !manualVariant.sku) {
      alert("Please fill required fields");
      return;
    }

    const newVariant: FormVariant = {
      title: manualVariant.title,
      sku: manualVariant.sku,
      price: parseFloat(manualVariant.price) || Number(watch("basePrice")) || 0,
      salePrice: watch("salePrice") ? Number(watch("salePrice")) : null,
      stock: parseInt(manualVariant.stock, 10) || 0,
      isDefault: variants.length === 0,
      options: manualVariant.options,
      weightGram: null,
      images: [],
    };

    setValue("variants", [...variants, newVariant]);
    setManualVariant({ title: "", sku: "", price: "", stock: "", options: [] });
  };

  const updateVariantField = (
    index: number,
    field: keyof FormVariant,
    value: any
  ) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: value };
    setValue("variants", updated);
  };

  const removeVariant = (index: number) => {
    const updated = variants.filter((_, i) => i !== index);
    setValue("variants", updated);
  };

  const toggleOption = (setId: string, optionId: string) => {
    setSelectedOptions((prev) => {
      const currentOptions = prev[setId] || [];
      const isSelected = currentOptions.includes(optionId);
      return {
        ...prev,
        [setId]: isSelected
          ? currentOptions.filter((id) => id !== optionId)
          : [...currentOptions, optionId],
      };
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Manage Product Variants</h2>
      <div className="mb-4">
        <p className="text-sm font-medium mb-2">Variant Generation Method</p>
        <div className="flex items-center gap-4">
          {(["matrix", "manual"] as const).map((method) => (
            <label
              key={method}
              className="flex items-center gap-2 cursor-pointer capitalize"
            >
              <input
                type="radio"
                name="variantMethod"
                value={method}
                checked={variantMethod === method}
                onChange={(e) =>
                  setVariantMethod(e.target.value as "matrix" | "manual")
                }
              />
              <span>
                {method === "matrix"
                  ? "Auto-Generate from Options"
                  : "Create Variants Manually"}
              </span>
            </label>
          ))}
        </div>
      </div>

      {variantMethod === "matrix" ? (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h3 className="text-lg font-medium">
              Select Options to Generate Variants
            </h3>
            {selectedOptionSets.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No option sets selected. Please go back to Step 2.
              </p>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {selectedOptionSets.map((set) => (
                    <div key={set.id} className="border rounded-md p-3">
                      <p className="text-sm font-medium mb-2">{set.name}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {set.options?.map((option) => {
                          const active = selectedOptions[set.id]?.includes(
                            option.id
                          );
                          return (
                            <button
                              type="button"
                              key={option.id}
                              onClick={() => toggleOption(set.id, option.id)}
                              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors ${
                                active
                                  ? "bg-primary text-primary-foreground border-transparent"
                                  : "bg-secondary text-secondary-foreground"
                              }`}
                              style={
                                set.type === "COLOR"
                                  ? {
                                      backgroundColor: option.value,
                                      color: "#fff",
                                    }
                                  : {}
                              }
                            >
                              {option.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                <Button
                  onClick={generateVariants}
                  disabled={Object.values(selectedOptions).every(
                    (arr) => arr.length === 0
                  )}
                >
                  <Sparkles className="h-4 w-4 mr-2" /> Generate Variants
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h3 className="text-lg font-medium">Add Variant Manually</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                placeholder="Variant Title"
                value={manualVariant.title}
                onChange={(e) =>
                  setManualVariant((p) => ({ ...p, title: e.target.value }))
                }
              />
              <Input
                placeholder="SKU"
                value={manualVariant.sku}
                onChange={(e) =>
                  setManualVariant((p) => ({ ...p, sku: e.target.value }))
                }
              />
              <Input
                type="number"
                placeholder="Price"
                value={manualVariant.price}
                onChange={(e) =>
                  setManualVariant((p) => ({ ...p, price: e.target.value }))
                }
              />
              <Input
                type="number"
                placeholder="Stock"
                value={manualVariant.stock}
                onChange={(e) =>
                  setManualVariant((p) => ({ ...p, stock: e.target.value }))
                }
              />
            </div>
            <Button onClick={addManualVariant}>
              <Plus className="h-4 w-4 mr-2" /> Add Variant
            </Button>
          </CardContent>
        </Card>
      )}

      {variants.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-4">
              Product Variants ({variants.length})
            </h3>
            <div className="rounded-md border overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="p-3 text-left w-[60px]">Default</th>
                    <th className="p-3 text-left">Variant</th>
                    <th className="p-3 text-left">SKU</th>
                    <th className="p-3 text-left">Price</th>
                    <th className="p-3 text-left">Stock</th>
                    <th className="p-3 text-left w-[80px]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {variants.map((variant, index) => (
                    <tr
                      key={index}
                      className="border-b last:border-0 hover:bg-muted/50"
                    >
                      <td className="p-3">
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          checked={!!variant.isDefault}
                          onChange={(e) => {
                            const isChecked = e.target.checked;
                            const updated = variants.map((v, i) => ({
                              ...v,
                              isDefault:
                                i === index
                                  ? isChecked
                                  : isChecked
                                  ? false
                                  : v.isDefault,
                            }));
                            setValue("variants", updated);
                          }}
                        />
                      </td>
                      <td className="p-3">{variant.title}</td>
                      <td className="p-3">{variant.sku}</td>
                      <td className="p-3">{variant.price}</td>
                      <td className="p-3">{variant.stock}</td>
                      <td className="p-3">
                        <Button
                          variant="ghost"
                          onClick={() => removeVariant(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
