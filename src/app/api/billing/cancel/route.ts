import { NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

function getStripeClient(): Stripe | null {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return null;
  return new Stripe(stripeKey);
}

export async function POST() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const subscription = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
  });

  if (!subscription) {
    return NextResponse.json({ success: false, error: "No subscription found" }, { status: 404 });
  }

  if (subscription.status !== "ACTIVE") {
    return NextResponse.json({ success: false, error: "Subscription is not active" }, { status: 400 });
  }

  const stripe = getStripeClient();

  // If there's a Stripe customer, cancel the subscription in Stripe
  if (stripe && subscription.stripeCustomerId) {
    try {
      const stripeSubscriptions = await stripe.subscriptions.list({
        customer: subscription.stripeCustomerId,
        status: "active",
        limit: 1,
      });

      if (stripeSubscriptions.data.length > 0) {
        await stripe.subscriptions.cancel(stripeSubscriptions.data[0].id);
      }
    } catch (error) {
      console.error("[billing] Stripe cancellation error:", error instanceof Error ? error.message : error);
    }
  }

  const updated = await prisma.subscription.update({
    where: { userId: session.user.id },
    data: {
      status: "CANCELED",
    },
    select: {
      plan: true,
      status: true,
      currentPeriodEnd: true,
    },
  });

  return NextResponse.json({
    success: true,
    data: {
      plan: updated.plan,
      status: updated.status,
      currentPeriodEnd: updated.currentPeriodEnd?.toISOString() ?? null,
    },
  });
}
