import { NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "@/lib/db";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? "";

function getStripeClient(): Stripe | null {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return null;
  return new Stripe(secretKey);
}

function mapStripeStatus(status: string): "ACTIVE" | "CANCELED" | "PAST_DUE" | "NONE" {
  switch (status) {
    case "active":
    case "trialing":
      return "ACTIVE";
    case "past_due":
    case "unpaid":
      return "PAST_DUE";
    case "canceled":
    case "incomplete_expired":
      return "CANCELED";
    default:
      return "NONE";
  }
}

export async function POST(request: Request) {
  const stripe = getStripeClient();
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!stripe || !signature || !webhookSecret) {
    console.error("[stripe-webhook] Missing Stripe client, signature, or webhook secret");
    return NextResponse.json({ received: true }, { status: 200 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("[stripe-webhook] Signature verification failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  console.log(`[stripe-webhook] Received event: ${event.type} (${event.id})`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan === "PRO" ? "PRO" : "STARTER";

        if (!userId) {
          console.warn("[stripe-webhook] checkout.session.completed missing userId in metadata");
          break;
        }

        const customerId = typeof session.customer === "string" ? session.customer : null;

        await prisma.subscription.upsert({
          where: { userId },
          create: {
            userId,
            plan,
            status: "ACTIVE",
            stripeCustomerId: customerId,
            stripeCheckoutSessionId: session.id,
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
          update: {
            plan,
            status: "ACTIVE",
            stripeCustomerId: customerId ?? undefined,
            stripeCheckoutSessionId: session.id,
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });

        console.log(`[stripe-webhook] Activated ${plan} plan for user ${userId}`);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = typeof subscription.customer === "string" ? subscription.customer : null;

        if (!customerId) break;

        const existing = await prisma.subscription.findFirst({
          where: { stripeCustomerId: customerId },
        });

        if (!existing) {
          console.warn(`[stripe-webhook] No subscription found for customer ${customerId}`);
          break;
        }

        const periodEnd = subscription.items.data[0]?.current_period_end;

        await prisma.subscription.update({
          where: { id: existing.id },
          data: {
            status: mapStripeStatus(subscription.status),
            currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : undefined,
          },
        });

        console.log(`[stripe-webhook] Updated subscription for customer ${customerId} -> ${subscription.status}`);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = typeof subscription.customer === "string" ? subscription.customer : null;

        if (!customerId) break;

        const existing = await prisma.subscription.findFirst({
          where: { stripeCustomerId: customerId },
        });

        if (existing) {
          await prisma.subscription.update({
            where: { id: existing.id },
            data: { status: "CANCELED" },
          });
          console.log(`[stripe-webhook] Canceled subscription for customer ${customerId}`);
        }
        break;
      }

      default:
        console.log(`[stripe-webhook] Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error(`[stripe-webhook] Error handling ${event.type}:`, err);
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
