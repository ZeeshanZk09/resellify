import React, { useState, useEffect } from "react";
import { useFormContext, Controller } from "react-hook-form";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Sparkles, Plus, Trash2 } from "lucide-react";

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

type Variant = {
  title: string;
  sku: string;
  price: string | number;
  salePrice?: string | number;
  stock: string | number;
  isDefault?: boolean;
  options?: { optionSetId: string; optionId: string }[];
  weightGram?: number | null;
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

  const variants = (watch("variants") as Variant[]) || [];

  // Initialize selected options from option sets
  useEffect(() => {
    const initialOptions: Record<string, string[]> = {};
    selectedOptionSets.forEach((set) => {
      initialOptions[set.id] = set.options?.map((opt) => opt.id) || [];
    });
    setSelectedOptions(initialOptions);
  }, [selectedOptionSets]);

  const generateVariants = () => {
    // Get selected option values
    const selectedOptionArrays = Object.values(selectedOptions);

    // Generate all combinations (cartesian product)
    const generateCombinations = (
      arrays: string[][],
      index = 0,
      current: string[] = []
    ): string[][] => {
      if (index === arrays.length) {
        return [current];
      }

      const result: string[][] = [];
      for (const optionId of arrays[index]) {
        result.push(
          ...generateCombinations(arrays, index + 1, [...current, optionId])
        );
      }
      return result;
    };

    const combinations = generateCombinations(selectedOptionArrays);

    // Convert combinations to variants
    const generatedVariants: Variant[] = combinations.map((combo, index) => {
      // Find option objects
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
          ): obj is { optionSetId: string; optionId: string; option: Option } =>
            obj !== null
        );

      // Generate variant title
      const variantTitle = optionObjects
        .map((opt) => opt.option.name)
        .join(" / ");

      // Generate SKU
      const skuParts = optionObjects.map((opt) =>
        opt.option.name
          .replace(/[^a-zA-Z0-9]/g, "")
          .toUpperCase()
          .substring(0, 3)
      );
      const baseSku = (watch("sku") as string) || "PROD";
      const variantSku = `${baseSku}-${skuParts.join("-")}`;

      return {
        title: variantTitle,
        sku: variantSku,
        price: (watch("basePrice") as string) || "",
        salePrice: (watch("salePrice") as string) || "",
        stock: 0,
        isDefault: index === 0,
        options: optionObjects.map((obj) => ({
          optionSetId: obj.optionSetId,
          optionId: obj.optionId,
        })),
        weightGram: null,
      };
    });

    setValue("variants", generatedVariants);
  };

  const addManualVariant = () => {
    if (!manualVariant.title || !manualVariant.sku) {
      alert("Please fill required fields");
      return;
    }

    const newVariant: Variant = {
      ...manualVariant,
      price: parseFloat(manualVariant.price) || (watch("basePrice") as number),
      stock: parseInt(manualVariant.stock, 10) || 0,
      options: manualVariant.options.map((opt) => ({
        optionSetId: opt.optionSetId,
        optionId: opt.optionId,
      })),
    };

    setValue("variants", [...variants, newVariant]);
    setManualVariant({
      title: "",
      sku: "",
      price: "",
      stock: "",
      options: [],
    });
  };

  const updateVariantField = (
    index: number,
    field: keyof Variant,
    value: string | number | boolean
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
    <div>
      <h2 className="text-xl font-semibold mb-2">Manage Product Variants</h2>

      <div className="mb-4">
        <p className="text-sm font-medium mb-2">Variant Generation Method</p>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="variantMethod"
              value="matrix"
              checked={variantMethod === "matrix"}
              onChange={(e) =>
                setVariantMethod(e.target.value as "matrix" | "manual")
              }
            />
            <span>Auto-Generate from Options</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="variantMethod"
              value="manual"
              checked={variantMethod === "manual"}
              onChange={(e) =>
                setVariantMethod(e.target.value as "matrix" | "manual")
              }
            />
            <span>Create Variants Manually</span>
          </label>
        </div>
      </div>

      {variantMethod === "matrix" ? (
        <Card className="mb-3">
          <CardContent className="pt-6 space-y-4">
            <h3 className="text-lg font-medium">
              Select Options to Generate Variants
            </h3>

            {selectedOptionSets.length === 0 ? (
              <p className="text-muted-foreground">
                No option sets selected. Please go back to Step 2 to add option
                sets.
              </p>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-3">
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
                              style={{
                                backgroundColor:
                                  set.type === "COLOR"
                                    ? option.value
                                    : undefined,
                                color:
                                  set.type === "COLOR" ? "#fff" : undefined,
                                borderColor:
                                  set.type === "COLOR"
                                    ? "transparent"
                                    : undefined,
                              }}
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
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Variants
                </Button>

                <p className="text-xs text-muted-foreground mt-1">
                  {(() => {
                    const optionCounts = Object.values(selectedOptions).map(
                      (arr) => arr.length
                    );
                    const totalCombinations = optionCounts.reduce(
                      (a, b) => a * b,
                      1
                    );
                    return `Will generate ${totalCombinations} variants`;
                  })()}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-3">
          <CardContent className="pt-6 space-y-4">
            <h3 className="text-lg font-medium">Add Variant Manually</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
              <div className="space-y-1">
                <Input
                  placeholder="Variant Title"
                  value={manualVariant.title}
                  onChange={(e) =>
                    setManualVariant((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Input
                  placeholder="SKU"
                  value={manualVariant.sku}
                  onChange={(e) =>
                    setManualVariant((prev) => ({
                      ...prev,
                      sku: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Input
                  type="number"
                  placeholder="Price"
                  value={manualVariant.price}
                  onChange={(e) =>
                    setManualVariant((prev) => ({
                      ...prev,
                      price: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Input
                  type="number"
                  placeholder="Stock"
                  value={manualVariant.stock}
                  onChange={(e) =>
                    setManualVariant((prev) => ({
                      ...prev,
                      stock: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <Button onClick={addManualVariant}>
              <Plus className="h-4 w-4 mr-2" />
              Add Variant
            </Button>
          </CardContent>
        </Card>
      )}

      {variants.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium">
              Product Variants ({variants.length})
            </h3>

            <div className="rounded-md border mt-3">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b transition-colors hover:bg-muted/50">
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[60px]">
                      Default
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Variant
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      SKU
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Price
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Stock
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[100px]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {variants.map((variant, index) => (
                    <tr
                      key={index}
                      className="border-b transition-colors hover:bg-muted/50"
                    >
                      <td className="p-4 align-middle">
                        <Controller
                          name={`variants[${index}].isDefault`}
                          control={control}
                          render={({ field }) => (
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                              checked={!!field.value}
                              onChange={(e) => {
                                field.onChange(e.target.checked);
                                if (e.target.checked) {
                                  variants.forEach((_, i) => {
                                    if (i !== index) {
                                      updateVariantField(i, "isDefault", false);
                                    }
                                  });
                                }
                              }}
                            />
                          )}
                        />
                      </td>
                      <td className="p-4 align-middle">
                        <Input
                          value={variant.title}
                          onChange={(e) =>
                            updateVariantField(index, "title", e.target.value)
                          }
                        />
                      </td>
                      <td className="p-4 align-middle">
                        <Input
                          value={variant.sku}
                          onChange={(e) =>
                            updateVariantField(index, "sku", e.target.value)
                          }
                        />
                      </td>
                      <td className="p-4 align-middle">
                        <Input
                          type="number"
                          value={variant.price}
                          onChange={(e) =>
                            updateVariantField(index, "price", e.target.value)
                          }
                          className="w-[100px]"
                        />
                      </td>
                      <td className="p-4 align-middle">
                        <Input
                          type="number"
                          value={variant.stock}
                          onChange={(e) =>
                            updateVariantField(index, "stock", e.target.value)
                          }
                          className="w-[80px]"
                        />
                      </td>
                      <td className="p-4 align-middle">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => removeVariant(index)}
                        >
                          <Trash2 className="h-3 w-3" />
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
