"use server";

import { auth } from "@/auth";
import {
  SubscriptionPlanType,
  SubscriptionStatus,
} from "@/shared/lib/generated/prisma/enums";
import prisma from "@/shared/lib/prisma";

export async function getSubscriptionPlans() {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { price: "asc" },
    });
    return { success: true, data: plans };
  } catch (error) {
    console.error("Error fetching subscription plans:", error);
    return { success: false, error: "Failed to fetch subscription plans" };
  }
}

export async function getUserSubscription() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: session.user.id,
        status: { in: ["ACTIVE", "TRIALING"] },
      },
      include: {
        plan: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: subscription };
  } catch (error) {
    console.error("Error fetching user subscription:", error);
    return { success: false, error: "Failed to fetch subscription" };
  }
}

export async function getUserBillingHistory() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const transactions = await prisma.paymentTransaction.findMany({
      where: { userId: session.user.id },
      include: {
        subscription: {
          include: {
            plan: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return { success: true, data: transactions };
  } catch (error) {
    console.error("Error fetching billing history:", error);
    return { success: false, error: "Failed to fetch billing history" };
  }
}

export async function cancelSubscription() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: session.user.id,
        status: { in: ["ACTIVE", "TRIALING"] },
      },
    });

    if (!subscription) {
      return { success: false, error: "No active subscription found" };
    }

    // Update subscription to cancel at period end
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        cancelAtPeriodEnd: true,
      },
    });

    return {
      success: true,
      message:
        "Subscription will be cancelled at the end of the billing period",
    };
  } catch (error) {
    console.error("Error cancelling subscription:", error);
    return { success: false, error: "Failed to cancel subscription" };
  }
}
