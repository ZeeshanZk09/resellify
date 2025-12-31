"use client";

import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Switch } from "@/shared/components/ui/switch";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Separator } from "@/shared/components/ui/separator";
import { toast } from "sonner";
import { Textarea } from "@/shared/components/ui/textarea";
import { Category } from "@/shared/lib/generated/prisma/browser";
import { addProduct, AddProductInput } from "@/actions/product/product";
import { Trash2, Plus } from "lucide-react";
import { getSubCategoriesById } from "@/actions/category/category";
import { generateProductSlug } from "@/shared/lib/utils/category";

interface AddProductFormProps {
  initialCategories: Category[];
}

type OptionSet = {
  name: string;
  type: "TEXT" | "COLOR" | "NUMBER" | "SIZE" | "MEASURE" | "RANGE" | "BOOLEAN";
  options: {
    name: string;
    value?: string | null;
    position?: number;
  }[];
};

type Variant = {
  sku?: string | null;
  title?: string | null;
  price?: number;
  salePrice?: number | null;
  stock?: number;
  isDefault?: boolean;
  weightGram?: number | null;
  options?: string[];
};

type Spec = {
  groupTitle: string;
  keys: string[];
  values: string[];
};

type Tag = {
  name: string;
  slug: string;
};

type FormData = {
  title: string;
  slug: string;
  sku: string;
  basePrice: number;
  salePrice?: number | null;
  description?: string | null;
  shortDescription?: string | null;
  currency: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  visibility: "PUBLIC" | "PRIVATE" | "UNLISTED";
  inventory: number;
  lowStockThreshold: number;
  images: File[] | File;
  optionSets: OptionSet[];
  variants: Variant[];
  specs: Spec[];
  tags: Tag[];
  category: {
    name: string;
    slug: string;
    description?: string | null;
    parentId?: string | null;
  };
};

export default function AddProductForm({
  initialCategories,
}: AddProductFormProps) {
  const [loading, setLoading] = useState(false);
  const [subCats, setSubCats] = useState<Category[]>([]);
  const [tagInput, setTagInput] = useState({ name: "", slug: "" });
  const [specsInput, setSpecsInput] = useState({
    groupTitle: "",
    keys: "",
    values: "",
  });
  const [optionSets, setOptionSets] = useState<OptionSet[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [specs, setSpecs] = useState<Spec[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  const [formData, setFormData] = useState<FormData>({
    title: "",
    slug: "",
    sku: "",
    basePrice: 0,
    salePrice: null,
    description: "",
    shortDescription: "",
    currency: "PKR",
    status: "DRAFT",
    visibility: "UNLISTED",
    inventory: 0,
    lowStockThreshold: 5,
    images: [],
    optionSets: [],
    variants: [],
    specs: [],
    tags: [],
    category: {
      name: "",
      slug: "",
      description: "",
      parentId: "",
    },
  });

  // Generate slug when title changes
  useEffect(() => {
    if (!formData.title) return;
    async function generateSlug() {
      const slug = await generateProductSlug(formData.title);
      setFormData((prev) => ({ ...prev, slug }));
    }
    generateSlug();
  }, [formData.title]);

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNestedChange = (
    parent: keyof FormData,
    field: string,
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      [parent]: {
        ...(prev[parent] as any),
        [field]: value,
      },
    }));
  };

  const handleCategorySelect = async (categoryId: string) => {
    const category = initialCategories.find((c) => c.id === categoryId);
    if (category) {
      setFormData((prev) => ({
        ...prev,
        category: {
          name: category.name,
          slug: category.slug,
          description: category.description || "",
          parentId: category.parentId || "",
        },
      }));
      const subCategories = await getSubCategoriesById(category.id);
      setSubCats(subCategories.res || []);
    }
  };

  const addTag = () => {
    if (tagInput.name && tagInput.slug) {
      setTags((prev) => [...prev, { ...tagInput }]);
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, { ...tagInput }],
      }));
      setTagInput({ name: "", slug: "" });
    }
  };

  const removeTag = (index: number) => {
    const newTags = tags.filter((_, i) => i !== index);
    setTags(newTags);
    setFormData((prev) => ({ ...prev, tags: newTags }));
  };

  const addSpecs = () => {
    if (specsInput.groupTitle && specsInput.keys && specsInput.values) {
      const keysArray = specsInput.keys.split(",").map((k) => k.trim());
      const valuesArray = specsInput.values.split(",").map((v) => v.trim());

      if (keysArray.length === valuesArray.length) {
        const newSpec: Spec = {
          groupTitle: specsInput.groupTitle,
          keys: keysArray,
          values: valuesArray,
        };
        const newSpecs = [...specs, newSpec];
        setSpecs(newSpecs);
        setFormData((prev) => ({ ...prev, specs: newSpecs }));
        setSpecsInput({ groupTitle: "", keys: "", values: "" });
        toast.success("Specifications added");
      } else {
        toast.error("Number of keys and values must match");
      }
    }
  };

  const removeSpec = (index: number) => {
    const newSpecs = specs.filter((_, i) => i !== index);
    setSpecs(newSpecs);
    setFormData((prev) => ({ ...prev, specs: newSpecs }));
  };

  const addOptionSet = () => {
    const newOptionSet: OptionSet = { name: "", type: "TEXT", options: [] };
    const newOptionSets = [...optionSets, newOptionSet];
    setOptionSets(newOptionSets);
    setFormData((prev) => ({ ...prev, optionSets: newOptionSets }));
  };

  const updateOptionSet = (
    index: number,
    field: keyof OptionSet,
    value: any
  ) => {
    const newOptionSets = [...optionSets];
    newOptionSets[index] = { ...newOptionSets[index], [field]: value };
    setOptionSets(newOptionSets);
    setFormData((prev) => ({ ...prev, optionSets: newOptionSets }));
  };

  const removeOptionSet = (index: number) => {
    const newOptionSets = optionSets.filter((_, i) => i !== index);
    setOptionSets(newOptionSets);
    setFormData((prev) => ({ ...prev, optionSets: newOptionSets }));
  };

  const addOption = (optionSetIndex: number) => {
    const newOptionSets = [...optionSets];
    const currentOptions = newOptionSets[optionSetIndex]?.options || [];
    newOptionSets[optionSetIndex].options = [
      ...currentOptions,
      { name: "", value: "", position: currentOptions.length },
    ];
    setOptionSets(newOptionSets);
    setFormData((prev) => ({ ...prev, optionSets: newOptionSets }));
  };

  const updateOption = (
    optionSetIndex: number,
    optionIndex: number,
    field: string,
    value: any
  ) => {
    const newOptionSets = [...optionSets];
    newOptionSets[optionSetIndex].options[optionIndex] = {
      ...newOptionSets[optionSetIndex].options[optionIndex],
      [field]: value,
    };
    setOptionSets(newOptionSets);
    setFormData((prev) => ({ ...prev, optionSets: newOptionSets }));
  };

  const removeOption = (optionSetIndex: number, optionIndex: number) => {
    const newOptionSets = [...optionSets];
    newOptionSets[optionSetIndex].options.splice(optionIndex, 1);
    setOptionSets(newOptionSets);
    setFormData((prev) => ({ ...prev, optionSets: newOptionSets }));
  };

  const addVariant = () => {
    const newVariant: Variant = {
      sku: "",
      title: "",
      price: 0,
      salePrice: null,
      stock: 0,
      isDefault: false,
      weightGram: null,
      options: [],
    };
    const newVariants = [...variants, newVariant];
    setVariants(newVariants);
    setFormData((prev) => ({ ...prev, variants: newVariants }));
  };

  const updateVariant = (index: number, field: keyof Variant, value: any) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setVariants(newVariants);
    setFormData((prev) => ({ ...prev, variants: newVariants }));
  };

  const removeVariant = (index: number) => {
    const newVariants = variants.filter((_, i) => i !== index);
    setVariants(newVariants);
    setFormData((prev) => ({ ...prev, variants: newVariants }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileArray = Array.from(files);
      setFormData((prev) => ({ ...prev, images: fileArray }));
    }
  };

  const validateForm = (): string | null => {
    if (!formData.title.trim()) return "Title is required";
    if (!formData.slug.trim()) return "Slug is required";
    if (!formData.sku.trim()) return "SKU is required";
    if (!formData.basePrice || formData.basePrice < 0)
      return "Valid base price is required";
    if (!formData.category.name.trim()) return "Category name is required";
    if (!formData.category.slug.trim()) return "Category slug is required";
    if (
      !formData.images ||
      (Array.isArray(formData.images) && formData.images.length === 0)
    ) {
      return "At least one image is required";
    }
    return null;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      setLoading(true);

      const submitData: AddProductInput = {
        ...formData,
        images: Array.isArray(formData.images)
          ? formData.images
          : [formData.images],
        salePrice: formData.salePrice || null,
        description: formData.description || null,
        shortDescription: formData.shortDescription || null,
        variants: formData.variants?.map((variant) => ({
          ...variant,
          productId: "",
          sku: variant.sku || null,
          salePrice: variant.salePrice || null,
          weightGram: variant.weightGram || null,
        })),
        specs: formData.specs.length > 0 ? formData.specs : undefined,
      };

      const result = await addProduct(submitData);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Product created successfully!");
        // Reset form
        setFormData({
          title: "",
          slug: "",
          sku: "",
          basePrice: 0,
          salePrice: null,
          description: "",
          shortDescription: "",
          currency: "PKR",
          status: "DRAFT",
          visibility: "UNLISTED",
          inventory: 0,
          lowStockThreshold: 5,
          images: [],
          optionSets: [],
          variants: [],
          specs: [],
          tags: [],
          category: {
            name: "",
            slug: "",
            description: "",
            parentId: "",
          },
        });
        setOptionSets([]);
        setVariants([]);
        setSpecs([]);
        setTags([]);
        setSubCats([]);
      }
    } catch (error) {
      toast.error("Failed to create product");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="py-14 space-y-8 max-w-4xl mx-auto">
      {/* Basic Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title*</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="Product title — e.g. 'Men's Slim Jeans'"
            />
            <p className="text-sm text-gray-500">
              The public name of the product shown in listings and search
              results.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug*</Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) => handleInputChange("slug", e.target.value)}
              placeholder="product-slug — lowercase, hyphens only"
            />
            <p className="text-sm text-gray-500">
              URL-friendly identifier (lowercase, hyphens). Example:{" "}
              <code>mens-slim-jeans</code>.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sku">SKU*</Label>
            <Input
              id="sku"
              value={formData.sku}
              onChange={(e) => handleInputChange("sku", e.target.value)}
              placeholder="SKU-001"
            />
            <p className="text-sm text-gray-500">
              Unique stock keeping code used internally to track this product.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={5}
              value={formData.description || ""}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Full product description — features, materials, care instructions"
            />
            <p className="text-sm text-gray-500">
              Full detailed content shown on the product page. Include
              dimensions, materials, and benefits.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shortDescription">Short Description</Label>
            <Textarea
              id="shortDescription"
              rows={3}
              value={formData.shortDescription || ""}
              onChange={(e) =>
                handleInputChange("shortDescription", e.target.value)
              }
              placeholder="Short summary — 1–2 sentence highlight"
            />
            <p className="text-sm text-gray-500">
              A brief summary shown in lists and quick views (useful for ads and
              search snippets).
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Card */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="basePrice">Base Price*</Label>
            <Input
              id="basePrice"
              type="number"
              value={formData.basePrice}
              onChange={(e) =>
                handleInputChange("basePrice", parseFloat(e.target.value))
              }
              placeholder="0"
            />
            <p className="text-sm text-gray-500">
              The regular price customers pay before any discount.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="salePrice">Sale Price</Label>
            <Input
              id="salePrice"
              type="number"
              value={formData.salePrice || ""}
              onChange={(e) =>
                handleInputChange(
                  "salePrice",
                  e.target.value ? parseFloat(e.target.value) : null
                )
              }
              placeholder="0"
            />
            <p className="text-sm text-gray-500">
              Optional discounted price. Leave empty if not on sale. Should be
              lower than Base Price.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Input
              id="currency"
              value={formData.currency}
              onChange={(e) => handleInputChange("currency", e.target.value)}
              placeholder="PKR"
            />
            <p className="text-sm text-gray-500">
              Currency code used for pricing (ISO code like PKR, USD, EUR).
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Card */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory</CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="inventory">Stock Quantity</Label>
            <Input
              id="inventory"
              type="number"
              value={formData.inventory}
              onChange={(e) =>
                handleInputChange("inventory", parseInt(e.target.value))
              }
              placeholder="0"
            />
            <p className="text-sm text-gray-500">
              Number of items currently available for sale. Use 0 if out of
              stock.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
            <Input
              id="lowStockThreshold"
              type="number"
              value={formData.lowStockThreshold}
              onChange={(e) =>
                handleInputChange("lowStockThreshold", parseInt(e.target.value))
              }
              placeholder="5"
            />
            <p className="text-sm text-gray-500">
              When stock falls to this number, the system should flag the item
              for restocking.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle>Status & Visibility</CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: "DRAFT" | "PUBLISHED" | "ARCHIVED") =>
                handleInputChange("status", value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="PUBLISHED">Published</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500">
              Draft = not visible to customers. Published = visible. Archived =
              kept for records but not listed.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Visibility</Label>
            <Select
              value={formData.visibility}
              onValueChange={(value: "PUBLIC" | "PRIVATE" | "UNLISTED") =>
                handleInputChange("visibility", value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PUBLIC">Public</SelectItem>
                <SelectItem value="PRIVATE">Private</SelectItem>
                <SelectItem value="UNLISTED">Unlisted</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500">
              Public = visible to everyone. Private = only visible to admins.
              Unlisted = accessible by direct link only.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Images Card */}
      <Card>
        <CardHeader>
          <CardTitle>Product Images*</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
          />
          <p className="text-sm text-gray-500 mt-2">
            Upload clear product photos. Recommended: 800×800px or larger,
            JPG/PNG. First image will be primary.
          </p>
        </CardContent>
      </Card>

      {/* Category Card */}
      <Card>
        <CardHeader>
          <CardTitle>Category*</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 justify-between">
            <div className="space-y-2 w-full">
              <Label>Select Existing Category</Label>
              <Select onValueChange={handleCategorySelect}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {initialCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500">
                Choose an existing category to group this product with similar
                items.
              </p>
            </div>
            <div className="space-y-2 w-full">
              <Label>Select Subcategory (optional)</Label>
              <Select onValueChange={handleCategorySelect}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select subcategory" />
                </SelectTrigger>
                <SelectContent>
                  {subCats?.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500">
                Optional: refine the product into a subcategory for better
                filtering.
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="font-medium">Or Create New Category</h4>
            <div className="space-y-2">
              <Label htmlFor="category.name">Category Name*</Label>
              <Input
                id="category.name"
                value={formData.category.name}
                onChange={(e) =>
                  handleNestedChange("category", "name", e.target.value)
                }
                placeholder="Category Name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category.slug">Category Slug*</Label>
              <Input
                id="category.slug"
                value={formData.category.slug}
                onChange={(e) =>
                  handleNestedChange("category", "slug", e.target.value)
                }
                placeholder="category-slug"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category.description">Category Description</Label>
              <Textarea
                id="category.description"
                value={formData.category.description || ""}
                onChange={(e) =>
                  handleNestedChange("category", "description", e.target.value)
                }
                placeholder="Category Description"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tags Card */}
      <Card>
        <CardHeader>
          <CardTitle>Tags</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label>Tag Name</Label>
              <Input
                value={tagInput.name}
                onChange={(e) =>
                  setTagInput({ ...tagInput, name: e.target.value })
                }
                placeholder="Tag Name — e.g. 'organic'"
              />
            </div>
            <div className="space-y-2">
              <Label>Tag Slug</Label>
              <Input
                value={tagInput.slug}
                onChange={(e) =>
                  setTagInput({ ...tagInput, slug: e.target.value })
                }
                placeholder="tag-slug"
              />
            </div>
          </div>
          <Button type="button" onClick={addTag} variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" /> Add Tag
          </Button>

          {tags.length > 0 && (
            <div className="space-y-2 mt-4">
              <Label>Added Tags</Label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 bg-secondary px-3 py-1 rounded-full"
                  >
                    <span>{tag.name}</span>
                    <button
                      type="button"
                      onClick={() => removeTag(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Option Sets Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Option Sets</CardTitle>
          <Button
            type="button"
            onClick={addOptionSet}
            variant="outline"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Option Set
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-gray-500">
            Option sets define selectable attributes (e.g., Size, Color). They
            power product variants.
          </p>

          {optionSets.map((optionSet, index) => (
            <div key={index} className="space-y-4 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Option Set {index + 1}</h4>
                <Button
                  type="button"
                  onClick={() => removeOptionSet(index)}
                  variant="ghost"
                  size="sm"
                  className="text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={optionSet.name}
                    onChange={(e) =>
                      updateOptionSet(index, "name", e.target.value)
                    }
                    placeholder="e.g., Size"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={optionSet.type}
                    onValueChange={(value: OptionSet["type"]) =>
                      updateOptionSet(index, "type", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TEXT">Text</SelectItem>
                      <SelectItem value="COLOR">Color</SelectItem>
                      <SelectItem value="NUMBER">Number</SelectItem>
                      <SelectItem value="SIZE">Size</SelectItem>
                      <SelectItem value="MEASURE">Measure</SelectItem>
                      <SelectItem value="RANGE">Range</SelectItem>
                      <SelectItem value="BOOLEAN">Boolean</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Options</Label>
                <Button
                  type="button"
                  onClick={() => addOption(index)}
                  variant="outline"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" /> Add Option
                </Button>

                {optionSet.options.map((option, optionIndex) => (
                  <div
                    key={optionIndex}
                    className="grid grid-cols-3 gap-4 mt-2"
                  >
                    <Input
                      value={option.name}
                      onChange={(e) =>
                        updateOption(index, optionIndex, "name", e.target.value)
                      }
                      placeholder="Option name (e.g., Large)"
                    />
                    <Input
                      value={option.value || ""}
                      onChange={(e) =>
                        updateOption(
                          index,
                          optionIndex,
                          "value",
                          e.target.value
                        )
                      }
                      placeholder="Option value (e.g., L or #ff0000)"
                    />
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={option.position || ""}
                        onChange={(e) =>
                          updateOption(
                            index,
                            optionIndex,
                            "position",
                            parseInt(e.target.value) || 0
                          )
                        }
                        placeholder="Position"
                      />
                      <Button
                        type="button"
                        onClick={() => removeOption(index, optionIndex)}
                        variant="ghost"
                        size="sm"
                        className="text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Variants Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Variants</CardTitle>
          <Button
            type="button"
            onClick={addVariant}
            variant="outline"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Variant
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-500">
            Variants are concrete sellable items (combination of option values).
            Example: Red / Large.
          </p>

          {variants.map((variant, index) => (
            <div key={index} className="space-y-4 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Variant {index + 1}</h4>
                <Button
                  type="button"
                  onClick={() => removeVariant(index)}
                  variant="ghost"
                  size="sm"
                  className="text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>SKU</Label>
                  <Input
                    value={variant.sku || ""}
                    onChange={(e) =>
                      updateVariant(index, "sku", e.target.value)
                    }
                    placeholder="Variant SKU"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={variant.title || ""}
                    onChange={(e) =>
                      updateVariant(index, "title", e.target.value)
                    }
                    placeholder="Variant Title"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Price*</Label>
                  <Input
                    type="number"
                    value={variant.price || ""}
                    onChange={(e) =>
                      updateVariant(index, "price", parseFloat(e.target.value))
                    }
                    placeholder="Price"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sale Price</Label>
                  <Input
                    type="number"
                    value={variant.salePrice || ""}
                    onChange={(e) =>
                      updateVariant(
                        index,
                        "salePrice",
                        e.target.value ? parseFloat(e.target.value) : null
                      )
                    }
                    placeholder="Sale Price"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Stock</Label>
                  <Input
                    type="number"
                    value={variant.stock || ""}
                    onChange={(e) =>
                      updateVariant(index, "stock", parseInt(e.target.value))
                    }
                    placeholder="Stock"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Weight (grams)</Label>
                  <Input
                    type="number"
                    value={variant.weightGram || ""}
                    onChange={(e) =>
                      updateVariant(
                        index,
                        "weightGram",
                        e.target.value ? parseFloat(e.target.value) : null
                      )
                    }
                    placeholder="Weight"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Options (comma separated)</Label>
                  <Input
                    value={variant?.options?.join(", ")}
                    onChange={(e) => {
                      const options = e.target.value
                        .split(",  ")
                        .map((opt) => opt)
                        .filter((opt) => opt);
                      updateVariant(index, "options", options);
                    }}
                    placeholder="option1, option2"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Label htmlFor={`variant-${index}-default`}>
                    Default Variant
                  </Label>
                  <Switch
                    id={`variant-${index}-default`}
                    checked={variant.isDefault || false}
                    onCheckedChange={(checked) =>
                      updateVariant(index, "isDefault", checked)
                    }
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Specifications Card */}
      <Card>
        <CardHeader>
          <CardTitle>Specifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Group Title</Label>
            <Input
              value={specsInput.groupTitle}
              onChange={(e) =>
                setSpecsInput({ ...specsInput, groupTitle: e.target.value })
              }
              placeholder="e.g., General"
            />
          </div>
          <div className="space-y-2">
            <Label>Keys (comma separated)</Label>
            <Input
              value={specsInput.keys}
              onChange={(e) =>
                setSpecsInput({ ...specsInput, keys: e.target.value })
              }
              placeholder="e.g., Material, Color, Size"
            />
          </div>
          <div className="space-y-2">
            <Label>Values (comma separated)</Label>
            <Input
              value={specsInput.values}
              onChange={(e) =>
                setSpecsInput({ ...specsInput, values: e.target.value })
              }
              placeholder="e.g., Cotton, Red, Large"
            />
          </div>
          <Button type="button" onClick={addSpecs} variant="outline">
            Add Specifications
          </Button>

          {specs.length > 0 && (
            <div className="space-y-4 mt-4">
              <h4 className="font-medium">Added Specifications</h4>
              {specs.map((spec, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h5 className="font-medium">{spec.groupTitle}</h5>
                    <Button
                      type="button"
                      onClick={() => removeSpec(index)}
                      variant="ghost"
                      size="sm"
                      className="text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-1">
                    {spec.keys.map((key, i) => (
                      <div key={i} className="flex gap-4">
                        <span className="font-medium w-32">{key}:</span>
                        <span>{spec.values[i]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submit Button */}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Creating Product..." : "Add Product"}
      </Button>
    </form>
  );
}
