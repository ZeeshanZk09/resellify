"use client";
/* ================= CLIENT COMPONENT ================= */

import React, { useEffect, useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { createCategoryWithOptionSets } from "@/actions/category/categoryOptions";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { Textarea } from "@/shared/components/ui/textarea";
import { generateCategorySlug } from "@/shared/lib/utils/category";

export default function CategoryManagerPage() {
  // Category
  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [categorySlug, setCategorySlug] = useState("");

  // Subcategories
  const [subcategories, setSubcategories] = useState<
    Array<{ name: string; description: string; slug: string; id: string }>
  >([]);

  // OptionSets
  const [optionSets, setOptionSets] = useState<
    Array<{
      id: string;
      name: string;
      type: string;
      options: Array<{
        name: string;
        value?: string | null;
        position: number;
        id: string;
      }>;
    }>
  >([]);

  // Keep a serialized hidden payload in sync with state for server action form submit
  const payload = useMemo(() => {
    return JSON.stringify({
      category: {
        name: categoryName.trim(),
        description: categoryDescription.trim(),
        slug: categorySlug,
      },
      subcategories: subcategories.map((s) => ({
        name: s.name.trim(),
        description: s.description.trim(),
        slug: s.slug,
      })),
      optionSets: optionSets.map((os) => ({
        name: os.name.trim(),
        type: os.type,
        options: os.options.map((o) => ({
          name: o.name.trim(),
          value: o.value ?? null,
          position: o.position,
        })),
      })),
    });
  }, [
    categoryName,
    categoryDescription,
    categorySlug,
    subcategories,
    optionSets,
  ]);

  useEffect(() => {
    // auto-generate slug when categoryName changes
    generateCategorySlug(categoryName || "").then((slug) => {
      setCategorySlug(slug);
    });
  }, [categoryName]);

  // helpers
  const addSubcategory = () => {
    setSubcategories((prev) => [
      ...prev,
      { id: cryptoRandomId(), name: "", description: "", slug: "" },
    ]);
  };

  const updateSubcategory = (
    id: string,
    patch: Partial<{ name: string; description: string }>
  ) => {
    setSubcategories((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const updated = { ...s, ...patch };
        if (patch.name !== undefined)
          generateCategorySlug(updated.name || "").then((slug) => {
            updated.slug = slug;
          });
        return updated;
      })
    );
  };

  const removeSubcategory = (id: string) =>
    setSubcategories((prev) => prev.filter((s) => s.id !== id));

  const addOptionSet = () =>
    setOptionSets((prev) => [
      ...prev,
      { id: cryptoRandomId(), name: "", type: "GENERAL", options: [] },
    ]);

  const updateOptionSet = (
    id: string,
    patch: Partial<{ name: string; type: string }>
  ) =>
    setOptionSets((prev) =>
      prev.map((os) => (os.id === id ? { ...os, ...patch } : os))
    );

  const removeOptionSet = (id: string) =>
    setOptionSets((prev) => prev.filter((os) => os.id !== id));

  const addOptionToSet = (optionSetId: string) => {
    setOptionSets((prev) =>
      prev.map((os) => {
        if (os.id !== optionSetId) return os;
        const pos = os.options.length + 1;
        return {
          ...os,
          options: [
            ...os.options,
            { id: cryptoRandomId(), name: "", value: "", position: pos },
          ],
        };
      })
    );
  };

  const updateOption = (
    optionSetId: string,
    optionId: string,
    patch: Partial<{ name: string; value: string }>
  ) => {
    setOptionSets((prev) =>
      prev.map((os) => {
        if (os.id !== optionSetId) return os;
        return {
          ...os,
          options: os.options.map((o) =>
            o.id === optionId ? { ...o, ...patch } : o
          ),
        };
      })
    );
  };

  const removeOption = (optionSetId: string, optionId: string) => {
    setOptionSets((prev) =>
      prev.map((os) => {
        if (os.id !== optionSetId) return os;
        const newOptions = os.options
          .filter((o) => o.id !== optionId)
          .map((o, idx) => ({ ...o, position: idx + 1 }));
        return { ...os, options: newOptions };
      })
    );
  };

  // small stable id generator for client-only keys
  function cryptoRandomId() {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto)
      return (crypto as any).randomUUID();
    return Math.random().toString(36).slice(2, 9);
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Category & OptionSet Manager</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            action={async (formData) => {
              await createCategoryWithOptionSets(formData);
            }}
          >
            <input type="hidden" name="payload" value={payload} />
            <div className="grid grid-cols-1 gap-4">
              <section>
                <h3 className="text-lg font-medium mb-2">Category</h3>
                <div className="space-y-2">
                  <label className="block">
                    <div className="text-sm mb-1">Name</div>
                    <Input
                      required
                      value={categoryName}
                      onChange={(e) => setCategoryName(e.target.value)}
                      name="categoryName"
                    />
                  </label>

                  <label className="block">
                    <div className="text-sm mb-1">Description</div>
                    <Textarea
                      required
                      value={categoryDescription}
                      onChange={(e) => setCategoryDescription(e.target.value)}
                      name="categoryDescription"
                    />
                  </label>

                  <label className="block">
                    <div className="text-sm mb-1">Slug (auto)</div>
                    <Input readOnly value={categorySlug} name="categorySlug" />
                  </label>

                  <div className="mt-2">
                    <Button
                      type="button"
                      onClick={addSubcategory}
                      className="mr-2"
                    >
                      Add Subcategory
                    </Button>
                  </div>
                </div>
              </section>

              {subcategories.length > 0 && (
                <section>
                  <h3 className="text-lg font-medium mb-2">Subcategories</h3>
                  <div className="space-y-3">
                    {subcategories.map((s) => (
                      <div key={s.id} className="p-3 border rounded-md">
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <div className="text-sm font-medium">Subcategory</div>
                          <Button
                            variant="destructive"
                            type="button"
                            onClick={() => removeSubcategory(s.id)}
                          >
                            Remove
                          </Button>
                        </div>

                        <label className="block mb-2">
                          <div className="text-xs mb-1">Name</div>
                          <Input
                            value={s.name}
                            onChange={(e) =>
                              updateSubcategory(s.id, { name: e.target.value })
                            }
                          />
                        </label>
                        <label className="block">
                          <div className="text-xs mb-1">Description</div>
                          <Textarea
                            value={s.description}
                            onChange={(e) =>
                              updateSubcategory(s.id, {
                                description: e.target.value,
                              })
                            }
                          />
                        </label>
                        <div className="mt-2 text-xs text-muted-foreground">
                          Slug: {s.slug}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Option Sets</h3>
                  <Button type="button" onClick={addOptionSet}>
                    Add OptionSet
                  </Button>
                </div>

                <div className="space-y-4 mt-3">
                  {optionSets.map((os) => (
                    <div key={os.id} className="p-3 border rounded-md">
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-sm font-medium">Option Set</div>
                        <Button
                          variant="destructive"
                          type="button"
                          onClick={() => removeOptionSet(os.id)}
                        >
                          Remove
                        </Button>
                      </div>

                      <label className="block mb-2">
                        <div className="text-xs mb-1">Name</div>
                        <Input
                          value={os.name}
                          onChange={(e) =>
                            updateOptionSet(os.id, { name: e.target.value })
                          }
                        />
                      </label>

                      <label className="block mb-2">
                        <div className="text-xs mb-1">Type</div>
                        <Select
                          value={os.type}
                          onValueChange={(v) =>
                            updateOptionSet(os.id, { type: v })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="GENERAL">GENERAL</SelectItem>
                            <SelectItem value="COLOR">COLOR</SelectItem>
                            <SelectItem value="SIZE">SIZE</SelectItem>
                            <SelectItem value="MATERIAL">MATERIAL</SelectItem>
                          </SelectContent>
                        </Select>
                      </label>

                      <div className="mt-2">
                        <Button
                          type="button"
                          onClick={() => addOptionToSet(os.id)}
                        >
                          Add Option
                        </Button>
                      </div>

                      {os.options.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {os.options.map((opt) => (
                            <div key={opt.id} className="p-2 border rounded-md">
                              <div className="flex justify-between items-center mb-2">
                                <div className="text-sm">
                                  Option #{opt.position}
                                </div>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  type="button"
                                  onClick={() => removeOption(os.id, opt.id)}
                                >
                                  Remove
                                </Button>
                              </div>
                              <label className="block mb-1">
                                <div className="text-xs mb-1">Name</div>
                                <Input
                                  value={opt.name}
                                  onChange={(e) =>
                                    updateOption(os.id, opt.id, {
                                      name: e.target.value,
                                    })
                                  }
                                />
                              </label>
                              <label className="block">
                                <div className="text-xs mb-1">
                                  Value (optional)
                                </div>
                                <Input
                                  value={opt.value ?? ""}
                                  onChange={(e) =>
                                    updateOption(os.id, opt.id, {
                                      value: e.target.value,
                                    })
                                  }
                                />
                              </label>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              {/* Hidden payload that server action will parse */}
              <input type="hidden" name="payload" value={payload} />

              <div className="pt-4">
                <Button type="submit">Create Category + OptionSets</Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
