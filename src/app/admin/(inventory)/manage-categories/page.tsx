"use client";
/* ================= CLIENT COMPONENT ================= */
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { createCategoryWithOptionSets } from "@/actions/category/categoryOptions";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";
import type { Category } from "@/shared/lib/generated/prisma/browser";
import { OptionType } from "@/shared/lib/generated/prisma/enums";
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
          prev.map((s) => (s.id === id ? { ...s, slug } : s)),
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
        clearTimeout(timeout),
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
    patch: Partial<{ name: string; description: string }>,
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
      }),
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
    patch: Partial<{ name: string; type: OptionType }>,
  ) =>
    setOptionSets((prev) =>
      prev.map((os) => (os.id === id ? { ...os, ...patch } : os)),
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
      }),
    );
  };

  const updateOption = (
    optionSetId: string,
    optionId: string,
    patch: Partial<{ name: string; value: string }>,
  ) => {
    setOptionSets((prev) =>
      prev.map((os) => {
        if (os.id !== optionSetId) return os;
        return {
          ...os,
          options: os.options.map((o) =>
            o.id === optionId ? { ...o, ...patch } : o,
          ),
        };
      }),
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
      }),
    );
  };

  // small stable id generator for client-only keys
  function cryptoRandomId() {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto)
      return (crypto as any).randomUUID();
    return Math.random().toString(36).slice(2, 9);
  }

  const [allCategories, setAllCategories] = useState<
    Array<Category & { parentId: string | null }>
  >([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      const res = await fetch("/api/admin/categories", { cache: "no-store" });
      if (!res.ok) {
        toast.error("Failed to load categories");
        setLoadingCategories(false);
        return;
      }
      const data = (await res.json()) as {
        categories: Array<Category & { parentId: string | null }>;
      };
      setAllCategories(data.categories || []);
    } catch {
      toast.error("Failed to load categories");
    } finally {
      setLoadingCategories(false);
    }
  };

  useEffect(() => {
    void loadCategories();
  }, []);

  const [editMap, setEditMap] = useState<
    Record<
      string,
      { name: string; description: string; slug: string; dirty: boolean }
    >
  >({});

  const startEdit = (cat: Category & { parentId: string | null }) => {
    setEditMap((prev) => ({
      ...prev,
      [cat.id]: {
        name: cat.name,
        description: cat.description || "",
        slug: cat.slug,
        dirty: false,
      },
    }));
  };

  const updateEditField = (
    id: string,
    field: "name" | "description" | "slug",
    value: string,
  ) => {
    setEditMap((prev) => {
      const current = prev[id];
      if (!current) return prev;
      const next = { ...current, [field]: value, dirty: true };
      return { ...prev, [id]: next };
    });
  };

  const applyAutoSlug = async (id: string) => {
    const current = editMap[id];
    if (!current) return;
    if (current.name.trim()) {
      const slug = await generateCategorySlug(current.name.trim());
      setEditMap((prev) => ({
        ...prev,
        [id]: { ...prev[id], slug, dirty: true },
      }));
    }
  };

  const saveEdit = async (id: string) => {
    const current = editMap[id];
    if (!current) return;
    try {
      const res = await fetch("/api/admin/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          name: current.name.trim() || undefined,
          description: current.description.trim() || undefined,
          slug: current.slug.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Update failed");
        return;
      }
      const updated = await res.json();
      toast.success("Category updated");
      setEditMap((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setAllCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updated.category } : c)),
      );
    } catch {
      toast.error("Update failed");
    }
  };

  const deleteCat = async (id: string) => {
    try {
      const res = await fetch("/api/admin/categories", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Delete failed");
        return;
      }
      toast.success("Category deleted");
      setAllCategories((prev) => prev.filter((c) => c.id !== id));
      setEditMap((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch {
      toast.error("Delete failed");
    }
  };

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
      <div className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-2xl font-semibold">Manage Categories</h2>
          <Button type="button" onClick={() => void loadCategories()}>
            Refresh
          </Button>
        </div>
        {loadingCategories ? (
          <div className="p-4 text-sm text-muted-foreground">Loading…</div>
        ) : (
          <div className="space-y-4">
            {allCategories
              .filter((c) => c.parentId === null)
              .map((parent) => (
                <Card key={parent.id}>
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-lg font-medium">Parent Category</div>
                      {editMap[parent.id] ? (
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            onClick={() => saveEdit(parent.id)}
                          >
                            Save
                          </Button>
                          <Button
                            variant="destructive"
                            type="button"
                            onClick={() => deleteCat(parent.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            onClick={() => startEdit(parent)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            type="button"
                            onClick={() => deleteCat(parent.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      )}
                    </div>
                    {editMap[parent.id] ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <label className="block">
                          <div className="text-xs mb-1">Name</div>
                          <Input
                            value={editMap[parent.id].name}
                            onChange={(e) =>
                              updateEditField(parent.id, "name", e.target.value)
                            }
                            onBlur={() => void applyAutoSlug(parent.id)}
                          />
                        </label>
                        <label className="block">
                          <div className="text-xs mb-1">Description</div>
                          <Input
                            value={editMap[parent.id].description}
                            onChange={(e) =>
                              updateEditField(
                                parent.id,
                                "description",
                                e.target.value,
                              )
                            }
                          />
                        </label>
                        <label className="block">
                          <div className="text-xs mb-1">Slug</div>
                          <Input
                            value={editMap[parent.id].slug}
                            onChange={(e) =>
                              updateEditField(parent.id, "slug", e.target.value)
                            }
                          />
                        </label>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <div className="text-xs mb-1">Name</div>
                          <div className="text-sm">{parent.name}</div>
                        </div>
                        <div>
                          <div className="text-xs mb-1">Description</div>
                          <div className="text-sm">
                            {parent.description || ""}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs mb-1">Slug</div>
                          <div className="text-sm">{parent.slug}</div>
                        </div>
                      </div>
                    )}
                    <div className="pt-2">
                      <div className="text-sm font-medium mb-2">
                        Subcategories
                      </div>
                      <div className="space-y-2">
                        {allCategories
                          .filter((c) => c.parentId === parent.id)
                          .map((child) => (
                            <div
                              key={child.id}
                              className="p-2 border rounded-md"
                            >
                              <div className="flex items-center justify-between">
                                <div className="text-sm font-medium">
                                  Subcategory
                                </div>
                                {editMap[child.id] ? (
                                  <div className="flex gap-2">
                                    <Button
                                      type="button"
                                      onClick={() => saveEdit(child.id)}
                                    >
                                      Save
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      type="button"
                                      onClick={() => deleteCat(child.id)}
                                    >
                                      Delete
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="flex gap-2">
                                    <Button
                                      type="button"
                                      onClick={() => startEdit(child)}
                                    >
                                      Edit
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      type="button"
                                      onClick={() => deleteCat(child.id)}
                                    >
                                      Delete
                                    </Button>
                                  </div>
                                )}
                              </div>
                              {editMap[child.id] ? (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                                  <label className="block">
                                    <div className="text-xs mb-1">Name</div>
                                    <Input
                                      value={editMap[child.id].name}
                                      onChange={(e) =>
                                        updateEditField(
                                          child.id,
                                          "name",
                                          e.target.value,
                                        )
                                      }
                                      onBlur={() =>
                                        void applyAutoSlug(child.id)
                                      }
                                    />
                                  </label>
                                  <label className="block">
                                    <div className="text-xs mb-1">
                                      Description
                                    </div>
                                    <Input
                                      value={editMap[child.id].description}
                                      onChange={(e) =>
                                        updateEditField(
                                          child.id,
                                          "description",
                                          e.target.value,
                                        )
                                      }
                                    />
                                  </label>
                                  <label className="block">
                                    <div className="text-xs mb-1">Slug</div>
                                    <Input
                                      value={editMap[child.id].slug}
                                      onChange={(e) =>
                                        updateEditField(
                                          child.id,
                                          "slug",
                                          e.target.value,
                                        )
                                      }
                                    />
                                  </label>
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                                  <div>
                                    <div className="text-xs mb-1">Name</div>
                                    <div className="text-sm">{child.name}</div>
                                  </div>
                                  <div>
                                    <div className="text-xs mb-1">
                                      Description
                                    </div>
                                    <div className="text-sm">
                                      {child.description || ""}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-xs mb-1">Slug</div>
                                    <div className="text-sm">{child.slug}</div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
