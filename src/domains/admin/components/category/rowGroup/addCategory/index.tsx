"use client";
import type { TAddCategory } from "@/actions/category/category";
import Input from "@/shared/components/ui-v2/input";

type TProps = {
  errorMsg: string | undefined;
  data: TAddCategory;
  onChange: (data: TAddCategory) => void;
};

const AddCategory = ({ data, errorMsg, onChange }: TProps) => {
  return (
    <div className="grid grid-cols-7 gap-y-3 items-center my-3 mx-4">
      <span className="col-span-3">Category Name:</span>
      <Input
        className="col-span-4"
        name="name"
        value={data?.name || ""}
        onChange={(e) => onChange({ ...data, name: e.currentTarget.value })}
        type="text"
        placeholder="Category name (min 3 characters)..."
        required
      />
      <span className="col-span-3">Description:</span>
      <Input
        className="col-span-4"
        name="description"
        onChange={(e) =>
          onChange({ ...data, description: e.currentTarget.value || undefined })
        }
        type="text"
        placeholder="Description (optional)..."
        value={data?.description || ""}
      />

      {errorMsg && (
        <div className="col-span-7">
          <span className="text-bitex-red-500">{errorMsg}</span>
        </div>
      )}
    </div>
  );
};

export default AddCategory;
