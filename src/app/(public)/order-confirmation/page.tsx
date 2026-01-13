import { ArrowLeft, CheckCircle2, ShoppingBag } from "lucide-react";
import Link from "next/link";
import React from "react";
import { Button } from "@/shared/components/ui/button";

export default function OrderConfirmationScreen() {
  return (
    <div className="max-w-xl mx-auto min-h-[60vh] flex flex-col items-center justify-center py-20 px-6">
      <CheckCircle2
        size={64}
        strokeWidth={1.5}
        className="text-green-500 mb-6"
        aria-hidden="true"
      />
      <h1 className="text-2xl md:text-3xl font-bold text-center mb-2">
        Order Confirmed!
      </h1>
      <div className="text-gray-700 text-base md:text-lg text-center mb-4">
        Thank you for your purchase.
        <br />
        Your order has been successfully placed.
      </div>
      <div className="mb-8 text-center text-gray-500 text-sm">
        <strong>What&apos;s Next?</strong> We&apos;ll notify you when your order
        is shipped.
        <br />
        You can view your order status in your{" "}
        <span className="font-semibold">My Orders</span> page.
      </div>
      <div className="flex flex-col sm:flex-row gap-3 w-full sm:justify-center">
        <Link href="/" passHref>
          <Button variant="outline" className="w-full sm:w-auto">
            <ArrowLeft size={18} className="mr-2" />
            Continue Shopping
          </Button>
        </Link>
        <Link href="/my-orders" passHref>
          <Button variant="default" className="w-full sm:w-auto">
            <ShoppingBag size={18} className="mr-2" />
            View My Orders
          </Button>
        </Link>
      </div>
    </div>
  );
}
