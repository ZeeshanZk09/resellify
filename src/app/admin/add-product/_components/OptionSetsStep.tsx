import React, { useState } from "react";
import { useFormContext, Controller } from "react-hook-form";
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
import { Option } from "@/shared/lib/generated/prisma/browser";

// --- Local types (adapt to your real types if you have them) ---

export interface OptionSet {
  id: string;
  name: string;
  type: OptionType;
  options?: Option[];
  categories?: { id: string }[];
}

interface FormValues {
  selectedOptionSets?: OptionSet[];
}

export default function OptionSetsStep({
  optionSets,
  selectedCategoryIds,
}: {
  optionSets: GetCategoryOptionSets;
  selectedCategoryIds: string[];
}) {
  // properly type form context
  const { control, watch, setValue, getValues } = useFormContext<FormValues>();

  // typed local state for creating new sets and holding typed input values
  const [newOptionSet, setNewOptionSet] = useState<
    Pick<OptionSet, "name" | "type">
  >({
    name: "",
    type: "TEXT",
  });
  const [optionValues, setOptionValues] = useState<Record<string, string>>({});

  // watch selected option sets (defaults to empty array)
  const selectedSets = watch("selectedOptionSets") ?? [];

  // cast incoming prop to our local OptionSet[] type so we can get auto-complete
  const optionSetsTyped = (optionSets ?? []) as OptionSet[];

  // Filter option sets by selected categories
  const filteredOptionSets = optionSetsTyped.filter((set) => {
    console.log("set: ", set);
    const filterData = Boolean(
      set.categories?.some((cat) => selectedCategoryIds.includes(cat.id))
    );
    console.log("filterData: ", filterData);
    debugger;
    return filterData;
  });

  const handleAddOptionSet = () => {
    if (!newOptionSet.name?.trim()) return;

    const newSet: OptionSet = {
      id: `temp_${Date.now()}`,
      name: newOptionSet.name.trim(),
      type: newOptionSet.type as OptionType,
      options: [],
    };

    setValue("selectedOptionSets", [...(selectedSets || []), newSet]);
    setNewOptionSet({ name: "", type: "TEXT" });
  };

  const handleAddOptionValue = (setId: string, value: string) => {
    const val = value?.trim();
    if (!val) return;

    const current: OptionSet[] = getValues("selectedOptionSets") ?? [];

    const updatedSets = current.map((set) => {
      if (set.id === setId) {
        const newOption: Option = {
          id: `opt_${Date.now()}`,
          name: val,
          value: set.type === "COLOR" ? val : val.toLowerCase(),
          optionSetId: set.id,
          position: set.options?.length ?? 0,
        };
        return { ...set, options: [...(set.options ?? []), newOption] };
      }
      return set;
    });

    setValue("selectedOptionSets", updatedSets);
    setOptionValues((prev) => ({ ...prev, [setId]: "" }));
  };

  const handleRemoveOption = (setId: string, optionId: string) => {
    const current: OptionSet[] = getValues("selectedOptionSets") ?? [];
    const updated = current.map((s) =>
      s.id === setId
        ? { ...s, options: s.options?.filter((o) => o.id !== optionId) }
        : s
    );
    setValue("selectedOptionSets", updated);
  };

  const renderOptionInput = (set: OptionSet) => {
    console.log("set2: ", set);
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
              onChange={(e) =>
                setOptionValues((prev) => ({
                  ...prev,
                  [set.id]: e.target.value,
                }))
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
            onChange={(e) =>
              setOptionValues((prev) => ({ ...prev, [set.id]: e.target.value }))
            }
          />
        );
      default:
        return (
          <Input
            className="w-full max-w-[200px] h-9"
            placeholder="Enter option value"
            value={value}
            onChange={(e) =>
              setOptionValues((prev) => ({ ...prev, [set.id]: e.target.value }))
            }
          />
        );
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Manage Option Sets</h2>

      {/* Add New Option Set */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add New Option Set</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2 w-full">
              <Label>Option Set Name</Label>
              <Input
                placeholder="Option Set Name"
                value={newOptionSet.name}
                onChange={(e) =>
                  setNewOptionSet((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>
            <div className="w-full sm:w-[150px] space-y-2">
              <Label>Type</Label>
              <Select
                value={newOptionSet.type}
                onValueChange={(value) =>
                  setNewOptionSet((prev) => ({
                    ...prev,
                    type: value as OptionType,
                  }))
                }
              >
                <SelectTrigger>
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
              className="w-full sm:w-auto"
              onClick={handleAddOptionSet}
              disabled={!newOptionSet.name.trim()}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Set
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Available Option Sets */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">
          Available Option Sets for Selected Categories
        </h3>

        <div className="rounded-md border">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b">
              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
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
              {filteredOptionSets.map((set) => (
                <tr
                  key={set.id}
                  className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                >
                  <td className="p-4 align-middle">
                    <Controller
                      name="selectedOptionSets"
                      control={control}
                      render={({ field }) => {
                        const arr = Array.isArray(field.value)
                          ? field.value
                          : [];
                        const checked = arr.some((s) => s.id === set.id);

                        return (
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            checked={checked}
                            onChange={(e) => {
                              const next = e.target.checked
                                ? [...arr, set]
                                : arr.filter((s) => s.id !== set.id);
                              field.onChange(next);
                            }}
                          />
                        );
                      }}
                    />
                  </td>

                  <td className="p-4 align-middle font-medium">{set.name}</td>

                  <td className="p-4 align-middle">
                    <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                      {set.type}
                    </div>
                  </td>

                  <td className="p-4 align-middle">
                    <div className="flex flex-wrap gap-1.5">
                      {(
                        selectedSets.find((s) => s.id === set.id)?.options ??
                        set.options ??
                        []
                      ).map((opt: Option) => (
                        <div
                          key={opt.id}
                          className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 gap-1"
                          style={{
                            backgroundColor:
                              set.type === "COLOR"
                                ? opt.value! && opt.value
                                : undefined,
                            color: set.type === "COLOR" ? "#fff" : undefined,
                            borderColor:
                              set.type === "COLOR" ? "transparent" : undefined,
                          }}
                        >
                          <span
                            className={
                              set.type === "COLOR" ? "mix-blend-difference" : ""
                            }
                          >
                            {opt.name}
                          </span>
                          <button
                            onClick={() => handleRemoveOption(set.id, opt.id)}
                            className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span className="sr-only">Remove</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </td>

                  <td className="p-4 align-middle">
                    <div className="flex gap-2 items-center">
                      {renderOptionInput(set)}
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          handleAddOptionValue(
                            set.id,
                            optionValues[set.id] ?? ""
                          )
                        }
                        disabled={!optionValues[set.id]}
                      >
                        Add
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
