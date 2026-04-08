import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { checkoutSchema } from "@/lib/billing-validation";
import { getAppUrl, getPlanPriceEnv } from "@/lib/billing";

function getStripeClient() {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return null;
  return new Stripe(stripeKey);
}

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const payload = await req.json();
  const parsed = checkoutSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Validation failed", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { plan } = parsed.data;
  const appUrl = getAppUrl();

  const existing = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
    select: {
      stripeCustomerId: true,
    },
  });

  const stripe = getStripeClient();

  if (!stripe) {
    return NextResponse.json(
      { success: false, error: "Payment processing is not configured. Contact support." },
      { status: 503 }
    );
  }

  const priceId = getPlanPriceEnv(plan);
  if (!priceId) {
    return NextResponse.json(
      {
        success: false,
        error: `Missing Stripe price configuration for ${plan}`,
      },
      { status: 500 }
    );
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/billing?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/billing`,
    customer: existing?.stripeCustomerId ?? undefined,
    customer_email: !existing?.stripeCustomerId ? (session.user.email ?? undefined) : undefined,
    metadata: {
      userId: session.user.id,
      plan,
    },
    subscription_data: {
      metadata: {
        userId: session.user.id,
        plan,
      },
    },
  });

  await prisma.subscription.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      plan,
      status: "PENDING",
      stripeCustomerId:
        typeof checkoutSession.customer === "string" ? checkoutSession.customer : existing?.stripeCustomerId,
      stripeCheckoutSessionId: checkoutSession.id,
    },
    update: {
      plan,
      status: "PENDING",
      stripeCustomerId:
        typeof checkoutSession.customer === "string" ? checkoutSession.customer : existing?.stripeCustomerId,
      stripeCheckoutSessionId: checkoutSession.id,
    },
  });

  return NextResponse.json({
    success: true,
    data: {
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id,
      simulated: false,
    },
  });
}
