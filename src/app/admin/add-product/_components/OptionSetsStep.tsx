import React, { useState, useCallback, useMemo } from "react";
import { useFormContext, Controller, useWatch } from "react-hook-form";
import { Plus, Trash2, Palette } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Label } from "@/shared/components/ui/label";
import { GetCategoryOptionSets } from "@/actions/category/categoryOptions";
import { OptionType } from "@/shared/lib/generated/prisma/enums";
import {
  Option,
  OptionSet as PrismaOptionSet,
} from "@/shared/lib/generated/prisma/browser";
import { cn } from "@/shared/lib/utils";

// --- Local types ---
interface OptionSetCategory {
  categoryId: string;
}

interface LocalOptionSet
  extends Omit<PrismaOptionSet, "options" | "categories"> {
  id: string;
  name: string;
  type: OptionType;
  options?: Option[];
  categories?: OptionSetCategory[];
}

interface FormValues {
  selectedOptionSets?: LocalOptionSet[];
}

interface OptionSetsStepProps {
  optionSets: GetCategoryOptionSets;
  selectedCategoryIds: string[];
}

interface NewOptionSetState {
  name: string;
  type: OptionType;
}

// Helper function to safely check and trim strings
const safeTrim = (value: unknown): string => {
  if (typeof value === "string") {
    return value.trim();
  }
  return "";
};

const OptionSetsStep: React.FC<OptionSetsStepProps> = ({
  optionSets,
  selectedCategoryIds,
}) => {
  const { control, setValue } = useFormContext<FormValues>();

  // Local state with proper typing
  const [newOptionSet, setNewOptionSet] = useState<NewOptionSetState>({
    name: "",
    type: "TEXT",
  });

  const [optionValues, setOptionValues] = useState<Record<string, string>>({});

  // Watch selected option sets with proper typing
  const selectedSets = useWatch({ control, name: "selectedOptionSets" }) || [];

  // Safely cast optionSets to LocalOptionSet[]
  const optionSetsTyped = useMemo((): LocalOptionSet[] => {
    if (!Array.isArray(optionSets)) {
      console.warn("[WARNING] optionSets is not an array:", optionSets);
      return [];
    }
    return optionSets as LocalOptionSet[];
  }, [optionSets]);

  // Filter option sets by selected categories
  const filteredOptionSets = useMemo(() => {
    if (
      !Array.isArray(selectedCategoryIds) ||
      selectedCategoryIds.length === 0
    ) {
      return [];
    }

    const trimmedCategoryIds = selectedCategoryIds.map((id) => safeTrim(id));

    return optionSetsTyped.filter((set): boolean => {
      // Check if set has categories array
      if (!Array.isArray(set.categories) || set.categories.length === 0) {
        return false;
      }

      return set.categories.some((category: OptionSetCategory): boolean => {
        const categoryId = category?.categoryId;
        if (typeof categoryId !== "string") {
          return false;
        }
        return trimmedCategoryIds.includes(safeTrim(categoryId));
      });
    });
  }, [optionSetsTyped, selectedCategoryIds]);

  const handleAddOptionSet = useCallback((): void => {
    const trimmedName = newOptionSet.name.trim();
    if (!trimmedName) {
      return;
    }

    const newSet: LocalOptionSet = {
      id: `temp_${Date.now()}`,
      name: trimmedName,
      type: newOptionSet.type,
      options: [],
      categories: [],
    };

    setValue("selectedOptionSets", [...selectedSets, newSet]);
    setNewOptionSet({ name: "", type: "TEXT" });
  }, [newOptionSet, selectedSets, setValue]);

  const handleAddOptionValue = useCallback(
    (setId: string, value: string): void => {
      const trimmedValue = value.trim();
      if (!trimmedValue) {
        return;
      }

      const currentSets: LocalOptionSet[] = selectedSets;
      const updatedSets = currentSets.map(
        (set: LocalOptionSet): LocalOptionSet => {
          if (set.id !== setId) {
            return set;
          }

          const newOption: Option = {
            id: `opt_${Date.now()}`,
            name: trimmedValue,
            value:
              set.type === "COLOR" ? trimmedValue : trimmedValue.toLowerCase(),
            optionSetId: set.id,
            position: set.options?.length ?? 0,
          };

          return {
            ...set,
            options: [...(set.options || []), newOption],
          };
        }
      );

      setValue("selectedOptionSets", updatedSets);
      setOptionValues((prev: Record<string, string>) => ({
        ...prev,
        [setId]: "",
      }));
    },
    [selectedSets, setValue]
  );

  const handleRemoveOption = useCallback(
    (setId: string, optionId: string): void => {
      const currentSets: LocalOptionSet[] = selectedSets;
      const updatedSets = currentSets.map(
        (set: LocalOptionSet): LocalOptionSet => {
          if (set.id !== setId) {
            return set;
          }
          return {
            ...set,
            options: (set.options || []).filter(
              (opt: Option) => opt.id !== optionId
            ),
          };
        }
      );

      setValue("selectedOptionSets", updatedSets);
    },
    [selectedSets, setValue]
  );

  const handleOptionValueChange = useCallback(
    (setId: string, value: string): void => {
      setOptionValues((prev: Record<string, string>) => ({
        ...prev,
        [setId]: value,
      }));
    },
    []
  );

  const handleNewOptionSetChange = useCallback(
    (field: keyof NewOptionSetState, value: string): void => {
      setNewOptionSet((prev: NewOptionSetState) => ({
        ...prev,
        [field]: value,
      }));
    },
    []
  );

  const handleSetSelection = useCallback(
    (set: LocalOptionSet, checked: boolean): void => {
      const updatedSets = checked
        ? [...selectedSets, set]
        : selectedSets.filter((s: LocalOptionSet) => s.id !== set.id);

      setValue("selectedOptionSets", updatedSets);
    },
    [selectedSets, setValue]
  );

  const renderOptionInput = (set: LocalOptionSet): React.ReactNode => {
    const value = optionValues[set.id] ?? "";

    switch (set.type) {
      case "COLOR":
        return (
          <div className="relative w-full max-w-[200px]">
            <div className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground">
              <Palette className="h-4 w-4" />
            </div>
            <Input
              className="pl-9 h-9"
              placeholder="#000000 or Color Name"
              value={value}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleOptionValueChange(set.id, e.target.value)
              }
            />
          </div>
        );
      case "NUMBER":
      case "MEASURE":
        return (
          <Input
            className="w-full max-w-[200px] h-9"
            type="number"
            placeholder="Enter value"
            value={value}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleOptionValueChange(set.id, e.target.value)
            }
          />
        );
      default:
        return (
          <Input
            className="w-full max-w-[200px] h-9"
            placeholder="Enter option value"
            value={value}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleOptionValueChange(set.id, e.target.value)
            }
          />
        );
    }
  };

  if (!Array.isArray(selectedCategoryIds) || selectedCategoryIds.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Manage Option Sets</h2>
        <div className="p-6 text-center border rounded-lg bg-muted/50">
          <p className="text-muted-foreground">
            Please select categories in the previous step to see available
            option sets.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Manage Option Sets</h2>
        <p className="text-muted-foreground text-sm">
          Add option sets or select from available ones for the selected
          categories.
        </p>
      </div>

      {/* Add New Option Set */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add New Option Set</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2 w-full">
              <Label htmlFor="option-set-name">Option Set Name</Label>
              <Input
                id="option-set-name"
                placeholder="e.g., Color, Size, Material"
                value={newOptionSet.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleNewOptionSetChange("name", e.target.value)
                }
              />
            </div>
            <div className="w-full sm:w-[150px] space-y-2">
              <Label htmlFor="option-set-type">Type</Label>
              <Select
                value={newOptionSet.type}
                onValueChange={(value: string) =>
                  handleNewOptionSetChange("type", value as OptionType)
                }
              >
                <SelectTrigger className="m-0" id="option-set-type">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TEXT">Text</SelectItem>
                  <SelectItem value="COLOR">Color</SelectItem>
                  <SelectItem value="SIZE">Size</SelectItem>
                  <SelectItem value="NUMBER">Number</SelectItem>
                  <SelectItem value="MEASURE">Measure</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full sm:w-auto m-0"
              onClick={handleAddOptionSet}
              disabled={!newOptionSet.name.trim()}
              type="button"
            >
              <Plus className="h-4 w-4 " />
              Add Set
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Available Option Sets */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Available Option Sets</h3>
        <p className="text-sm text-muted-foreground">
          Option sets available for the selected categories (
          {filteredOptionSets.length} found)
        </p>

        <div className="rounded-md border overflow-hidden">
          {filteredOptionSets.length > 0 ? (
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[60px]">
                    Use
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Option Set
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Type
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Options
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[300px]">
                    Add Option
                  </th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {filteredOptionSets.map((set: LocalOptionSet) => {
                  const isSelected = selectedSets.some(
                    (s: LocalOptionSet) => s.id === set.id
                  );
                  const currentSet = isSelected
                    ? selectedSets.find((s: LocalOptionSet) => s.id === set.id)
                    : set;

                  const currentOptions = currentSet?.options || [];

                  return (
                    <tr
                      key={set.id}
                      className="border-b transition-colors hover:bg-muted/50"
                    >
                      <td className="p-4 align-middle">
                        <Controller<FormValues, "selectedOptionSets">
                          name="selectedOptionSets"
                          control={control}
                          render={({ field }) => {
                            const currentValue: LocalOptionSet[] =
                              Array.isArray(field.value) ? field.value : [];

                            return (
                              <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                checked={currentValue.some(
                                  (s: LocalOptionSet) => s.id === set.id
                                )}
                                onChange={(
                                  e: React.ChangeEvent<HTMLInputElement>
                                ) => {
                                  handleSetSelection(set, e.target.checked);
                                }}
                                aria-label={`Select ${set.name} option set`}
                              />
                            );
                          }}
                        />
                      </td>

                      <td className="p-4 align-middle font-medium">
                        <span
                          className={cn(
                            isSelected && "font-semibold text-primary"
                          )}
                        >
                          {set.name}
                        </span>
                      </td>

                      <td className="p-4 align-middle">
                        <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors bg-secondary text-secondary-foreground">
                          {set.type}
                        </div>
                      </td>

                      <td className="p-4 align-middle">
                        <div className="flex flex-wrap gap-1.5">
                          {currentOptions.map((opt: Option) => {
                            return (
                              <div
                                key={opt.id}
                                className={cn(
                                  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors gap-1",
                                  set.type === "COLOR" && "text-white"
                                )}
                                style={{
                                  backgroundColor:
                                    set.type === "COLOR"
                                      ? opt.name?.toLowerCase() || "transparent"
                                      : undefined,
                                  borderColor:
                                    set.type === "COLOR"
                                      ? "transparent"
                                      : undefined,
                                }}
                              >
                                <span>{opt.name || opt.value}</span>
                                {/* <button
                                  type="button"
                                  onClick={() =>
                                    handleRemoveOption(set.id, opt.id)
                                  }
                                  className="ml-1 rounded-full outline-none focus:ring-2 focus:ring-ring"
                                  aria-label={`Remove ${
                                    opt.name || opt.value
                                  } option`}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button> */}
                              </div>
                            );
                          })}
                          {currentOptions.length === 0 && (
                            <span className="text-xs text-muted-foreground italic">
                              No options added
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-4 align-middle">
                        <div className="flex gap-2 items-center">
                          {renderOptionInput(set)}
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() =>
                              handleAddOptionValue(
                                set.id,
                                optionValues[set.id] || ""
                              )
                            }
                            disabled={!optionValues[set.id]?.trim()}
                          >
                            Add
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-6 text-center text-muted-foreground">
              No option sets found for the selected categories.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

OptionSetsStep.displayName = "OptionSetsStep";

export default OptionSetsStep;
