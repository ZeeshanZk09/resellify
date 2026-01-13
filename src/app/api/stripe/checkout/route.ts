import { type NextRequest, NextResponse } from "next/server";
import { createCheckoutSession } from "@/actions/billing/stripe";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { planId } = await req.json();
    if (!planId) {
      return NextResponse.json(
        { error: "Plan ID is required" },
        { status: 400 },
      );
    }

    const result = await createCheckoutSession(planId);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ url: result.url, sessionId: result.sessionId });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
