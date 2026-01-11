import React, { useState } from "react";
import { useFormContext } from "react-hook-form";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { ProductSpec } from "@/shared/lib/generated/prisma/browser";

type SpecGroup = {
  id: string;
  title: string;
  keys: string[];
};

type Specification = {
  specGroupId: string;
  productId: string;
  values: string[];
};

type SpecificationsStepProps = {
  specGroups: SpecGroup[];
};

export default function SpecificationsStep({
  specGroups,
}: SpecificationsStepProps) {
  const { setValue, watch, getValues } = useFormContext();
  const [selectedSpecGroup, setSelectedSpecGroup] = useState<string>("");
  const [specValues, setSpecValues] = useState<Record<string, string>>({});

  const specifications: Specification[] = watch("specifications") || [];

  const handleAddSpecGroup = () => {
    if (!selectedSpecGroup) return;

    const specGroup = specGroups.find((g) => g.id === selectedSpecGroup);
    if (!specGroup) return;

    const values = specGroup.keys.map(
      (key, index) => specValues[`${selectedSpecGroup}_${index}`] || ""
    );

    // Check if all required values are filled
    if (values.some((v) => !v.trim())) {
      alert("Please fill all values for the selected spec group");
      return;
    }

    const newSpec: Specification = {
      specGroupId: selectedSpecGroup,
      productId: getValues("productId"),
      values: values,
    };

    setValue("specifications", [...specifications, newSpec]);
    setSelectedSpecGroup("");
    setSpecValues({});
  };

  const handleRemoveSpec = (index: number) => {
    const updated = specifications.filter((_, i) => i !== index);
    setValue("specifications", updated);
  };

  const selectedGroup = specGroups.find((g) => g.id === selectedSpecGroup);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Product Specifications</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label>Select Spec Group</Label>
              <Select
                value={selectedSpecGroup || undefined}
                onValueChange={(value) => setSelectedSpecGroup(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select spec group" />
                </SelectTrigger>
                <SelectContent>
                  {specGroups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedGroup && (
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  Enter values for: {selectedGroup.title}
                </p>
                {selectedGroup.keys.map((key, index) => (
                  <div key={index} className="space-y-1">
                    <Label>{key}</Label>
                    <Input
                      value={specValues[`${selectedSpecGroup}_${index}`] || ""}
                      onChange={(e) =>
                        setSpecValues((prev) => ({
                          ...prev,
                          [`${selectedSpecGroup}_${index}`]: e.target.value,
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
            )}

            <Button
              onClick={handleAddSpecGroup}
              disabled={!selectedSpecGroup}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Specification Group
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-2">Added Specifications</h3>

            {specifications.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                No specifications added yet
              </p>
            ) : (
              <div className="rounded-md border">
                <table className="w-full caption-bottom text-sm">
                  <thead className="[&_tr]:border-b">
                    <tr className="border-b transition-colors hover:bg-muted/50">
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        Group
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        Values
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[80px]">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="[&_tr:last-child]:border-0">
                    {specifications.map((spec, index) => {
                      const group = specGroups.find(
                        (g) => g.id === spec.specGroupId
                      );
                      return (
                        <tr
                          key={index}
                          className="border-b transition-colors hover:bg-muted/50"
                        >
                          <td className="p-4 align-middle">{group?.title}</td>
                          <td className="p-4 align-middle">
                            <div className="flex flex-wrap gap-1">
                              {spec.values.map((value, i) => (
                                <span
                                  key={i}
                                  className="bg-muted px-2 py-0.5 rounded text-xs"
                                >
                                  <strong>{group?.keys[i]}:</strong> {value}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="p-4 align-middle">
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRemoveSpec(index)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
