import { NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { confirmCheckoutSchema } from "@/lib/billing-validation";
import { normalizeSubscription } from "@/lib/billing";

function getStripeClient() {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return null;
  return new Stripe(stripeKey);
}

function extractCurrentPeriodEnd(
  subscriptionObject: Stripe.Subscription | string | null | undefined
): Date | null {
  if (!subscriptionObject || typeof subscriptionObject === "string") {
    return null;
  }

  const periodEnd = subscriptionObject.items.data[0]?.current_period_end;
  if (!periodEnd) {
    return null;
  }

  return new Date(periodEnd * 1000);
}

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const payload = await req.json();
  const parsed = confirmCheckoutSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Validation failed", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { sessionId } = parsed.data;
  const existing = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
  });

  if (!existing) {
    return NextResponse.json({ success: false, error: "No pending subscription found" }, { status: 404 });
  }

  if (sessionId.startsWith("sim_")) {
    return NextResponse.json(
      { success: false, error: "Simulated sessions are not allowed in production." },
      { status: 400 }
    );
  }

  const stripe = getStripeClient();
  if (!stripe) {
    return NextResponse.json({ success: false, error: "Stripe is not configured" }, { status: 500 });
  }

  const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["subscription"],
  });

  if (checkoutSession.metadata?.userId !== session.user.id) {
    return NextResponse.json({ success: false, error: "Session ownership mismatch" }, { status: 403 });
  }

  if (checkoutSession.payment_status !== "paid") {
    return NextResponse.json({ success: false, error: "Checkout is not paid" }, { status: 400 });
  }

  const planFromMetadata = checkoutSession.metadata?.plan === "PRO" ? "PRO" : "STARTER";

  const updated = await prisma.subscription.update({
    where: { userId: session.user.id },
    data: {
      plan: planFromMetadata,
      status: "ACTIVE",
      stripeCheckoutSessionId: checkoutSession.id,
      stripeCustomerId:
        typeof checkoutSession.customer === "string"
          ? checkoutSession.customer
          : existing.stripeCustomerId,
      currentPeriodEnd: extractCurrentPeriodEnd(checkoutSession.subscription),
    },
    select: {
      plan: true,
      status: true,
      currentPeriodEnd: true,
    },
  });

  return NextResponse.json({
    success: true,
    data: normalizeSubscription(updated),
  });
}
