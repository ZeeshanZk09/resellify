import { ImagePlus, Trash2 } from "lucide-react";
import React, {
  type ChangeEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useFormContext } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";
import { generateProductSlug } from "@/shared/lib/utils/category";

type ImageFile = {
  file: File;
  preview: string;
  name: string;
};

export default function BasicInfoStep() {
  const { control, watch, setValue, getValues, trigger } = useFormContext();
  const [images, setImages] = useState<ImageFile[]>([]);

  // Watch title and slug
  const title = watch<string>("title");
  const slug = watch<string>("slug");

  // Debug: log current values
  console.log("[DEBUG] Current title:", title);
  console.log("[DEBUG] Current slug:", slug);
  console.log("[DEBUG] Form values:", getValues());

  // Ref to hold debounce timer for slug generation
  const slugDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Memoized function to generate slug
  const generateSlug = useCallback(
    async (titleText: string) => {
      try {
        console.log("[Slug Generation] Generating slug for:", titleText);
        const newSlug = (await generateProductSlug(titleText)) as string;
        console.log("[Slug Generation] Generated slug:", newSlug);

        // Set the slug value
        setValue("slug", newSlug, {
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true,
        });
        // dlnsak
        // Trigger validation to clear any errors
        trigger("slug");
      } catch (error) {
        console.error("[Slug Generation] Failed to generate slug", error);
        toast.error("Failed to generate slug");
      }
    },
    [setValue, trigger],
  );

  // Debounced slug generation
  useEffect(() => {
    console.log("[Effect] Title changed:", title);

    // Clear previous timeout
    if (slugDebounceRef.current) {
      clearTimeout(slugDebounceRef.current);
      slugDebounceRef.current = null;
    }

    // If title is empty, clear slug
    if (!title || title.trim() === "") {
      console.log("[Effect] Title is empty, clearing slug");
      setValue("slug", "", {
        shouldValidate: true,
        shouldDirty: true,
      });
      return;
    }

    // Don't generate slug if user manually edited it
    const currentSlug = getValues("slug");
    const isSlugManuallyEdited =
      currentSlug &&
      currentSlug !== "" &&
      !currentSlug.includes(title.toLowerCase().replace(/\s+/g, "-"));

    if (isSlugManuallyEdited) {
      console.log(
        "[Effect] Slug was manually edited, skipping auto-generation",
      );
      return;
    }

    // Set debounce timeout
    slugDebounceRef.current = setTimeout(() => {
      generateSlug(title);
    }, 1000);

    // Cleanup
    return () => {
      if (slugDebounceRef.current) {
        clearTimeout(slugDebounceRef.current);
      }
    };
  }, [title, setValue, getValues, generateSlug]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (slugDebounceRef.current) {
        clearTimeout(slugDebounceRef.current);
      }
    };
  }, []);

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (images.length >= 4) {
      toast.error("You can upload maximum 4 images");
      return;
    }
    const files = Array.from(e.target.files || []);
    const newImages: ImageFile[] = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
    }));
    // Store File objects in the form, not ImageFile objects
    const currentImages = (getValues("images") as File[]) || [];
    const newFiles = newImages.map((img) => img.file);
    setValue("images", [...currentImages, ...newFiles]);
    setImages((prev) => [...prev, ...newImages]);
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    // Remove the corresponding File from form values
    const currentImages = (getValues("images") as File[]) || [];
    const updatedImages = currentImages.filter((_, i) => i !== index);
    setValue("images", updatedImages);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Basic Product Information</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column - Basic Info */}
        <div className="space-y-6 h-full">
          <Card className="h-full">
            <CardContent className="pt-6 space-y-4">
              <FormField
                control={control}
                name="title"
                rules={{ required: "Product title is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Product Title <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Product Title"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          // Debounce slug generation
                          if (slugDebounceRef.current) {
                            clearTimeout(slugDebounceRef.current);
                          }
                          const value = e.target.value;
                          slugDebounceRef.current = setTimeout(() => {
                            generateSlug(value);
                          }, 1000);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="slug"
                rules={{ required: "Slug is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Slug <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Slug"
                        {...field}
                        value={field.value ?? ""}
                        disabled
                      />
                    </FormControl>
                    <FormDescription>URL-friendly identifier</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={control}
                  name="sku"
                  rules={{ required: "SKU is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        SKU <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="SKU" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="basePrice"
                  rules={{
                    required: "Price is required",
                    min: { value: 0, message: "Price must be positive" },
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Base Price <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">
                            PKR
                          </span>
                          <Input
                            type="number"
                            placeholder="0"
                            className="pl-12"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={control}
                  name="salePrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sale Price (Optional)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">
                            PKR
                          </span>
                          <Input
                            type="number"
                            placeholder="0"
                            className="pl-12"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="inventory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Initial Stock</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Initial Stock"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* <FormField
                  control={control}
                  name='status'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select status' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='DRAFT'>Draft</SelectItem>
                          <SelectItem value='PUBLISHED'>Published</SelectItem>
                          <SelectItem value='ARCHIVED'>Archived</SelectItem>
                          <SelectItem value='SCHEDULED'>Scheduled</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                /> */}

                {/* <FormField
                  control={control}
                  name="visibility"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Visibility</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select visibility" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="PUBLIC">Public</SelectItem>
                          <SelectItem value="PRIVATE">Private</SelectItem>
                          <SelectItem value="UNLISTED">Unlisted</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                /> */}
              </div>

              <FormField
                control={control}
                name="shortDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Short Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Brief description for product listings"
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Brief description for product listings
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Images & SEO */}
        <div className="space-y-6">
          {/* Image Upload */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-2">Product Images</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Upload up to 4 images for your product (minimum 2 images
                required)
              </p>
              <input
                accept="image/*"
                className="hidden"
                id="product-images"
                type="file"
                disabled={images.length >= 4}
                multiple
                onChange={handleImageUpload}
              />

              <label htmlFor="product-images" className="block mb-4">
                <Button
                  variant="outline"
                  className={
                    images.length >= 4
                      ? "w-full cursor-not-allowed opacity-70"
                      : "w-full cursor-pointer"
                  }
                  disabled={images.length >= 4}
                  asChild
                >
                  <span>
                    <ImagePlus className="mr-2 h-4 w-4" />
                    Upload Images
                  </span>
                </Button>
              </label>

              <div className="grid grid-cols-3 gap-2">
                {images && images.length > 0 ? (
                  images.map((img, index) => (
                    <div key={index} className="relative aspect-square">
                      <img
                        src={img.preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover rounded-md border"
                      />
                      <Button
                        size="icon"
                        variant="destructive"
                        className="absolute top-1 right-1 h-6 w-6"
                        onClick={() => handleRemoveImage(index)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="aspect-square rounded-md border-2 border-dashed flex items-center justify-center bg-muted/50">
                    <ImagePlus className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* SEO Fields */}
          <Card>
            <CardContent className=" pt-6 space-y-4">
              <h3 className="text-lg font-medium">SEO Settings</h3>

              <FormField
                control={control}
                name="metaKeywords"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meta Keywords</FormLabel>
                    <FormControl>
                      <Input placeholder="Meta Keywords" {...field} />
                    </FormControl>
                    <FormDescription>
                      Separate keywords with commas (e.g., electronics, gadgets,
                      smartphone)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* <FormField
                control={control}
                name="metaDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meta Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Meta Description"
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Optimal length: 150-160 characters
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="canonicalUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Canonical URL</FormLabel>
                    <FormControl>
                      <Input placeholder="Canonical URL" {...field} />
                    </FormControl>
                    <FormDescription>
                      Leave empty for default product URL
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              /> */}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
