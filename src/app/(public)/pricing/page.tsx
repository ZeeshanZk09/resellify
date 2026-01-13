"use client";

import { Check, Crown, Rocket, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
import { useAuth } from "@/shared/components/auth-provider";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";

const pricingPlans = [
  {
    id: "basic",
    name: "Basic",
    type: "BASIC" as const,
    price: 999,
    description: "Perfect for getting started with your online store",
    icon: Zap,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    features: [
      "Up to 50 products",
      "5GB storage space",
      "Basic analytics",
      "Email support",
      "Mobile app access",
      "Standard templates",
    ],
    popular: false,
  },
  {
    id: "pro",
    name: "Pro",
    type: "PRO" as const,
    price: 2499,
    description: "For growing businesses that need more power",
    icon: Rocket,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-300",
    features: [
      "Up to 500 products",
      "50GB storage space",
      "Advanced analytics",
      "Priority email support",
      "Mobile app access",
      "Custom templates",
      "API access",
      "Inventory management",
    ],
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    type: "ENTERPRISE" as const,
    price: 4999,
    description: "For large businesses with advanced needs",
    icon: Crown,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-300",
    features: [
      "Unlimited products",
      "Unlimited storage",
      "Advanced analytics & reports",
      "24/7 priority support",
      "Mobile app access",
      "Fully custom templates",
      "Full API access",
      "Advanced inventory management",
      "Multi-user accounts",
      "Custom integrations",
      "Dedicated account manager",
    ],
    popular: false,
  },
];

export default function PricingPage() {
  const router = useRouter();
  const { user } = useAuth();

  const handleSelectPlan = async (planId: string, planType: string) => {
    if (!user) {
      router.push("/auth/sign-in?redirect=/pricing");
      return;
    }

    // Navigate to checkout with plan selection
    router.push(`/pricing/checkout?plan=${planId}&type=${planType}`);
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-gray-50 to-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Start selling online today. All plans include a 14-day free trial.
            No credit card required.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {pricingPlans.map((plan) => {
            const Icon = plan.icon;
            return (
              <Card
                key={plan.id}
                className={`relative flex flex-col h-full transition-all duration-300 hover:shadow-xl ${
                  plan.popular
                    ? `${plan.borderColor} border-2 scale-105 shadow-lg`
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                {plan.popular && (
                  <div
                    className={`absolute -top-4 left-1/2 transform -translate-x-1/2 ${plan.bgColor} px-4 py-1 rounded-full`}
                  >
                    <Badge
                      className={`${plan.color} bg-transparent font-semibold`}
                    >
                      Most Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className={`${plan.bgColor} rounded-t-lg pb-8`}>
                  <div className="flex items-center justify-between mb-4">
                    <Icon className={`h-8 w-8 ${plan.color}`} />
                    {plan.popular && (
                      <Badge variant="secondary" className="ml-auto">
                        Best Value
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-2xl font-bold text-gray-900">
                    {plan.name}
                  </CardTitle>
                  <CardDescription className="text-gray-600 mt-2">
                    {plan.description}
                  </CardDescription>
                  <div className="mt-6">
                    <span className="text-4xl font-bold text-gray-900">
                      PKR {plan.price.toLocaleString()}
                    </span>
                    <span className="text-gray-600 ml-2">/month</span>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 pt-8">
                  <ul className="space-y-4">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-3 shrink-0 mt-0.5" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter className="pt-6">
                  <Button
                    onClick={() => handleSelectPlan(plan.id, plan.type)}
                    className={`w-full ${
                      plan.popular
                        ? "bg-linear-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                        : "bg-gray-900 hover:bg-gray-800"
                    } text-white`}
                    size="lg"
                  >
                    {user ? "Subscribe Now" : "Start Free Trial"}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto mt-16">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-lg mb-2 text-gray-900">
                Can I change my plan later?
              </h3>
              <p className="text-gray-600">
                Yes! You can upgrade or downgrade your plan at any time. Changes
                will be prorated and reflected in your next billing cycle.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-lg mb-2 text-gray-900">
                What payment methods do you accept?
              </h3>
              <p className="text-gray-600">
                We accept all major credit and debit cards through our secure
                Stripe payment gateway. All transactions are encrypted and PCI
                compliant.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-lg mb-2 text-gray-900">
                Is there a free trial?
              </h3>
              <p className="text-gray-600">
                Yes! All plans include a 14-day free trial. No credit card
                required to start. Cancel anytime during the trial with no
                charges.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-lg mb-2 text-gray-900">
                What happens if I exceed my plan limits?
              </h3>
              <p className="text-gray-600">
                We'll notify you when you're approaching your limits. You can
                upgrade your plan at any time to continue growing your store.
              </p>
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-16 text-center">
          <p className="text-sm text-gray-500 mb-4">
            Trusted by thousands of businesses
          </p>
          <div className="flex items-center justify-center gap-8 opacity-60">
            <div className="text-sm font-semibold text-gray-400">
              🔒 Secure Payments
            </div>
            <div className="text-sm font-semibold text-gray-400">
              ✓ 99.9% Uptime
            </div>
            <div className="text-sm font-semibold text-gray-400">
              🛡️ PCI Compliant
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
