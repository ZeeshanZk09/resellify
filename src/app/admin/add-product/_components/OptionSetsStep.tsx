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

export default function OptionSetsStep({
  optionSets,
  selectedCategoryIds,
}: {
  optionSets: any[];
  selectedCategoryIds: string[];
}) {
  const { control, watch, setValue } = useFormContext();
  const [newOptionSet, setNewOptionSet] = useState({
    name: "",
    type: "TEXT",
  });
  const [optionValues, setOptionValues] = useState<Record<string, string>>({});

  const selectedSets = watch("selectedOptionSets") || [];

  // Filter option sets by selected categories
  const filteredOptionSets = optionSets.filter((set) =>
    set.categories.some((cat: any) => selectedCategoryIds.includes(cat.id))
  );

  const handleAddOptionSet = () => {
    if (!newOptionSet.name) return;

    const newSet = {
      ...newOptionSet,
      id: `temp_${Date.now()}`,
      options: [],
    };

    setValue("selectedOptionSets", [...selectedSets, newSet]);
    setNewOptionSet({ name: "", type: "TEXT" });
  };

  const handleAddOptionValue = (setId: string, value: string) => {
    if (!value?.trim()) return;

    const updatedSets = selectedSets.map((set: any) => {
      if (set.id === setId) {
        const newOption = {
          id: `opt_${Date.now()}`,
          name: value.trim(),
          value:
            set.type === "COLOR" ? value.trim() : value.trim().toLowerCase(),
        };
        return { ...set, options: [...(set.options || []), newOption] };
      }
      return set;
    });

    setValue("selectedOptionSets", updatedSets);
    setOptionValues((prev) => ({ ...prev, [setId]: "" }));
  };

  const renderOptionInput = (set: any) => {
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
              value={optionValues[set.id] || ""}
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
            value={optionValues[set.id] || ""}
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
            value={optionValues[set.id] || ""}
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
                  setNewOptionSet((prev) => ({ ...prev, type: value }))
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
            <Button className="w-full sm:w-auto" onClick={handleAddOptionSet}>
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
                      render={({ field }) => (
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          checked={field.value?.some(
                            (s: any) => s.id === set.id
                          )}
                          onChange={(e) => {
                            const newValue = e.target.checked
                              ? [...(field.value || []), set]
                              : field.value.filter((s: any) => s.id !== set.id);
                            field.onChange(newValue);
                          }}
                        />
                      )}
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
                      {set.options?.map((opt: any) => (
                        <div
                          key={opt.id}
                          className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 gap-1"
                          style={{
                            backgroundColor:
                              set.type === "COLOR" ? opt.value : undefined,
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
                            onClick={() => {
                              const updatedSets = selectedSets.map((s: any) =>
                                s.id === set.id
                                  ? {
                                      ...s,
                                      options: s.options?.filter(
                                        (o: any) => o.id !== opt.id
                                      ),
                                    }
                                  : s
                              );
                              setValue("selectedOptionSets", updatedSets);
                            }}
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
                          handleAddOptionValue(set.id, optionValues[set.id])
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
