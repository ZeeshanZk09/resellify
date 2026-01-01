import { Product } from "@/shared/lib/generated/prisma/browser";

export default function ProductStructuredData({
  structuredData,
}: {
  structuredData: Product["structuredData"];
}) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
