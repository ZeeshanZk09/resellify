"use client";

import { CheckCircle, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    if (sessionId) {
      // Verify the session with your backend if needed
      toast.success("Payment successful! Your subscription is now active.");
    }
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-3xl">Payment Successful!</CardTitle>
            <CardDescription>
              Your subscription has been activated
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-800">
                Thank you for your purchase! Your subscription is now active and
                you can start using all the features of your plan.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">What's next?</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                <li>Access your subscription details in Account Settings</li>
                <li>Start using all the features included in your plan</li>
                <li>You'll receive a confirmation email shortly</li>
              </ul>
            </div>

            <div className="flex gap-4">
              <Button
                onClick={() => router.push("/dashboard")}
                className="flex-1"
              >
                Go to Dashboard
              </Button>
              <Button
                onClick={() => router.push("/pricing")}
                variant="outline"
                className="flex-1"
              >
                View Plans
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
