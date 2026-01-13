import { AlertCircle, CheckCircle } from "lucide-react";

interface StockIndicatorProps {
  visible: boolean;
}

export default function StockIndicator({ visible }: StockIndicatorProps) {
  if (!visible) {
    return (
      <div
        className="flex items-center gap-2 text-red-600"
        role="alert"
        aria-live="polite"
      >
        <AlertCircle size={18} />
        <span className="font-medium">Out of Stock</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-green-600" aria-live="polite">
      <CheckCircle size={18} />
      <span className="font-medium">In Stock</span>
    </div>
  );
}
