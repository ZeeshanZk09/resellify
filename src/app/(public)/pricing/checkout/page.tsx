"use client";

import { CreditCard, Loader2, Lock, Shield } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/shared/components/auth-provider";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";

const planDetails: Record<
  string,
  { name: string; price: number; description: string }
> = {
  basic: {
    name: "Basic",
    price: 999,
    description: "Perfect for getting started",
  },
  pro: { name: "Pro", price: 2499, description: "For growing businesses" },
  enterprise: {
    name: "Enterprise",
    price: 4999,
    description: "For large businesses",
  },
};

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [planId, setPlanId] = useState<string | null>(null);
  const [planType, setPlanType] = useState<string | null>(null);

  useEffect(() => {
    const plan = searchParams.get("plan");
    const type = searchParams.get("type");
    if (!plan || !type) {
      router.push("/pricing");
      return;
    }
    setPlanId(plan);
    setPlanType(type);
  }, [searchParams, router]);

  const handleCheckout = async () => {
    if (!planId || !user) {
      toast.error("Please select a plan and sign in");
      return;
    }

    setLoading(true);
    try {
      // For now, we'll use a mock checkout. In production, this would call the API
      // to create a Stripe checkout session
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });

      const data = await response.json();
      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        toast.error(data.error || "Failed to create checkout session");
        setLoading(false);
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("An error occurred during checkout");
      setLoading(false);
    }
  };

  if (!planId || !planType) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const plan = planDetails[planId] || planDetails.basic;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Complete Your Purchase
          </h1>
          <p className="text-gray-600">Secure payment powered by Stripe</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
            <CardDescription>Review your subscription details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-semibold text-lg">{plan.name} Plan</h3>
                <p className="text-sm text-gray-600">{plan.description}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-xl">
                  PKR {plan.price.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">per month</p>
              </div>
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>PKR {plan.price.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax</span>
                <span>PKR 0</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>PKR {plan.price.toLocaleString()}</span>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg space-y-3">
              <div className="flex items-start gap-3">
                <Lock className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm text-blue-900">
                    Secure Payment
                  </p>
                  <p className="text-xs text-blue-700">
                    Your payment information is encrypted and secure
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm text-blue-900">
                    PCI Compliant
                  </p>
                  <p className="text-xs text-blue-700">
                    We never store your card details
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CreditCard className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm text-blue-900">
                    Accepted Cards
                  </p>
                  <p className="text-xs text-blue-700">
                    Visa, Mastercard, American Express, and more
                  </p>
                </div>
              </div>
            </div>

            <Button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Proceed to Payment
                </>
              )}
            </Button>

            <p className="text-xs text-center text-gray-500">
              By continuing, you agree to our Terms of Service and Privacy
              Policy. You can cancel your subscription at any time.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
