import React from "react";

export default function ProductSpecifications({
  specs,
}: {
  specs: {
    id: string;
    values: string[];
    productId: string;
    specGroupId: string;
  }[];
}) {
  return (
    <div>
      {specs.map((spec) => (
        <div key={spec.id} className="flex items-center gap-2">
          <span className="font-medium">{spec.id}</span>
          <span className="text-sm text-gray-500">
            {spec.values.join(", ")}
          </span>
        </div>
      ))}
    </div>
  );
}
