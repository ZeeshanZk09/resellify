"use client";
/* ================= CLIENT COMPONENT ================= */
import { useEffect, useMemo, useState, useRef } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { createCategoryWithOptionSets } from "@/actions/category/categoryOptions";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { Textarea } from "@/shared/components/ui/textarea";
import { generateCategorySlug } from "@/shared/lib/utils/category";
import { OptionType } from "@/shared/lib/generated/prisma/enums";
import { toast } from "sonner";
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
      type: OptionType;
      options: Array<{
        name: string;
        value?: string | null;
        position: number;
        id: string;
      }>;
    }>
  >([]);
  // Refs for debouncing
  const categoryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const subcategoryTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
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
  // Debounced category name handler
  const handleCategoryNameChange = (value: string) => {
    setCategoryName(value);
    // Clear existing timeout
    if (categoryTimeoutRef.current) {
      clearTimeout(categoryTimeoutRef.current);
    }
    // Set new timeout - wait 500ms after user stops typing
    categoryTimeoutRef.current = setTimeout(async () => {
      if (value.trim()) {
        const slug = await generateCategorySlug(value);
        setCategorySlug(slug);
      }
    }, 500);
  };
  // Debounced subcategory name handler
  const handleSubcategoryNameChange = (id: string, value: string) => {
    // Clear existing timeout for this subcategory
    const existingTimeout = subcategoryTimeoutsRef.current.get(id);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }
    // Set new timeout - wait 500ms after user stops typing
    const newTimeout = setTimeout(async () => {
      if (value.trim()) {
        const slug = await generateCategorySlug(value);
        setSubcategories((prev) =>
          prev.map((s) => (s.id === id ? { ...s, slug } : s))
        );
      }
    }, 500);
    subcategoryTimeoutsRef.current.set(id, newTimeout);
  };
  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (categoryTimeoutRef.current) {
        clearTimeout(categoryTimeoutRef.current);
      }
      subcategoryTimeoutsRef.current.forEach((timeout) =>
        clearTimeout(timeout)
      );
    };
  }, []);
  // helpers
  const addSubcategory = () => {
    const newId = cryptoRandomId();
    setSubcategories((prev) => [
      ...prev,
      { id: newId, name: "", description: "", slug: "" },
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
        // If name is being updated, trigger debounced slug generation
        if (patch.name !== undefined) {
          handleSubcategoryNameChange(id, patch.name);
        }
        return updated;
      })
    );
  };
  const removeSubcategory = (id: string) => {
    // Clean up timeout for removed subcategory
    const timeout = subcategoryTimeoutsRef.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      subcategoryTimeoutsRef.current.delete(id);
    }
    setSubcategories((prev) => prev.filter((s) => s.id !== id));
  };
  const addOptionSet = () =>
    setOptionSets((prev) => [
      ...prev,
      { id: cryptoRandomId(), name: "", type: OptionType.TEXT, options: [] },
    ]);
  const updateOptionSet = (
    id: string,
    patch: Partial<{ name: string; type: OptionType }>
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
      <h1 className="text-4xl text-slate-500 mb-5">
        Create <span className="text-slate-800 font-medium">Categories</span>
      </h1>

      <Card>
        <CardContent>
          <form
            action={async (formData) => {
              try {
                await createCategoryWithOptionSets(formData);
                setCategoryName("");
                setCategoryDescription("");
                setCategorySlug("");
                setSubcategories([]);
                setOptionSets([]);
              } catch (error) {
                console.error("Error creating category:", error);
                toast.error("Failed to create category. Please try again.");
              }
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
                      onChange={(e) => handleCategoryNameChange(e.target.value)}
                      name="categoryName"
                    />
                  </label>

                  <label className="block">
                    <div className="text-sm mb-1">Description</div>
                    <Textarea
                      value={categoryDescription}
                      onChange={(e) => setCategoryDescription(e.target.value)}
                      name="categoryDescription"
                    />
                  </label>

                  <label className="block">
                    <div className="text-sm mb-1">Slug (auto)</div>
                    <Input readOnly value={categorySlug} name="categorySlug" />
                  </label>
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
              <div className="mt-2 justify-end flex">
                <Button type="button" onClick={addSubcategory}>
                  Add Subcategory
                </Button>
              </div>
              <hr />
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
                          onValueChange={(v: OptionType) =>
                            updateOptionSet(os.id, { type: v })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={OptionType.TEXT}>
                              TEXT
                            </SelectItem>
                            <SelectItem value={OptionType.COLOR}>
                              COLOR
                            </SelectItem>
                            <SelectItem value={OptionType.SIZE}>
                              SIZE
                            </SelectItem>
                            <SelectItem value={OptionType.MEASURE}>
                              MEASURE
                            </SelectItem>
                            <SelectItem value={OptionType.BOOLEAN}>
                              BOOLEAN
                            </SelectItem>
                            <SelectItem value={OptionType.NUMBER}>
                              NUMBER
                            </SelectItem>
                            <SelectItem value={OptionType.RANGE}>
                              RANGE
                            </SelectItem>
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

              <div className="pt-4 flex justify-end">
                <Button type="submit" className="px-16 py-4 text-md">
                  Create
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
