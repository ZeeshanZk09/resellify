import { CreditCard, Headphones, ShieldCheck, Truck } from "lucide-react";
import type React from "react";

const features = [
  {
    icon: Truck,
    title: "Free Shipping",
    description: "On all orders over $100",
  },
  {
    icon: ShieldCheck,
    title: "Secure Payment",
    description: "100% secure payment",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description: "Dedicated support",
  },
  {
    icon: CreditCard,
    title: "Money Back",
    description: "30 days guarantee",
  },
];

export const MarketingFeatures = () => {
  return (
    <section className="py-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature, index) => (
          <div
            key={index}
            className="flex flex-col items-center text-center p-6 bg-card rounded-lg shadow-sm border border-border"
          >
            <feature.icon className="w-10 h-10 text-primary mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {feature.title}
            </h3>
            <p className="text-muted-foreground text-sm">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};
