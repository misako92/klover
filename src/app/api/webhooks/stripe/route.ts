import { headers } from "next/headers";
import { NextResponse } from "next/server";

import type Stripe from "stripe";

import prisma from "@/lib/db";
import { stripe } from "@/lib/stripe/client";
import { planFromPriceId } from "@/lib/stripe/plans";

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: Request) {
  if (!WEBHOOK_SECRET) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const body = await request.text();
  const signature = (await headers()).get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        // Unhandled event type — ignore silently
        break;
    }
  } catch (err) {
    console.error(`Error processing webhook event ${event.type}:`, err);
    return NextResponse.json({ error: "Webhook handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

// ─── Handlers ────────────────────────────────────────────────────────

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const orgId = session.metadata?.orgId;
  const plan = session.metadata?.plan;

  if (!orgId || !plan) {
    console.error("Checkout session missing orgId or plan in metadata");
    return;
  }

  const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;

  await prisma.organization.update({
    where: { id: orgId },
    data: {
      plan,
      stripeSubscriptionId: subscriptionId || undefined,
      subscriptionStatus: "ACTIVE",
      trialEndsAt: null,
    },
  });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const org = await prisma.organization.findUnique({
    where: { stripeSubscriptionId: subscription.id },
    select: { id: true },
  });

  if (!org) {
    console.error(`No org found for subscription ${subscription.id}`);
    return;
  }

  // Resolve new plan from the subscription's price
  const priceId = subscription.items.data[0]?.price?.id;
  const newPlan = priceId ? planFromPriceId(priceId) : null;

  const statusMap: Record<string, string> = {
    active: "ACTIVE",
    past_due: "PAST_DUE",
    canceled: "CANCELED",
    trialing: "TRIALING",
    unpaid: "UNPAID",
  };

  // Unknown statuses (incomplete, paused…) must not grant access: default to PAST_DUE
  await prisma.organization.update({
    where: { id: org.id },
    data: {
      ...(newPlan && { plan: newPlan }),
      subscriptionStatus: (statusMap[subscription.status] || "PAST_DUE") as
        | "ACTIVE"
        | "PAST_DUE"
        | "CANCELED"
        | "TRIALING"
        | "UNPAID",
    },
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const org = await prisma.organization.findUnique({
    where: { stripeSubscriptionId: subscription.id },
    select: { id: true },
  });

  if (!org) return;

  await prisma.organization.update({
    where: { id: org.id },
    data: {
      plan: "free",
      subscriptionStatus: "CANCELED",
      stripeSubscriptionId: null,
    },
  });
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;

  if (!customerId) return;

  const org = await prisma.organization.findUnique({
    where: { stripeCustomerId: customerId },
    select: { id: true },
  });

  if (!org) return;

  await prisma.organization.update({
    where: { id: org.id },
    data: {
      plan: "free",
      subscriptionStatus: "PAST_DUE",
    },
  });
}
