import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { createHmac, timingSafeEqual } from "crypto";
import { SubscriptionPlan, Prisma, CoinLedgerReason } from "@prisma/client";
import { creditCoins } from "@/lib/coingate";


export const dynamic = "force-dynamic";

const WEBHOOK_SECRET = process.env.MAXELPAY_WEBHOOK_SECRET;

function verifySignature(body: string, signature: string): boolean {
  if (!WEBHOOK_SECRET || !signature) return false;
  try {
    const expected = createHmac("sha256", WEBHOOK_SECRET)
      .update(body)
      .digest("hex");
    return timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected)
    );
  } catch {
    return false;
  }
}

function parseOrderId(orderId: string): {
  type: "subscription" | "coins";
  userId: string;
  packageId?: string;
  planKey?: string;
} | null {
  if (!orderId.startsWith("order_")) return null;
  const parts = orderId.split("_");
  if (parts.length < 3) return null;

  if (parts[1] === "coin" && parts.length >= 5) {
    return {
      type: "coins",
      userId: parts[2],
      packageId: parts[3],
    };
  }

  if (parts.length >= 4) {
    return {
      type: "subscription",
      userId: parts[1],
      planKey: parts[2],
    };
  }

  return null;
}

const PLAN_FROM_KEY: Record<string, { plan: SubscriptionPlan; days: number }> = {
  monthly: { plan: "vip_monthly", days: 30 },
  yearly: { plan: "vip_yearly", days: 365 },
};

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("x-maxelpay-signature") || "";
  const eventId = req.headers.get("x-maxelpay-event-id") || "";

  if (!verifySignature(body, signature)) {
    logger.warn("Invalid webhook signature", {
      ip: req.headers.get("x-forwarded-for") || "unknown",
    });
    return NextResponse.json({ error: "توقيع غير صالح" }, { status: 401 });
  }

  let payload: { event: string; data?: Record<string, unknown> };
  try {
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
  }

  const { event, data } = payload;

  if (event === "payment.completed" && data?.orderId) {
    const orderId = data.orderId as string;
    const parsed = parseOrderId(orderId);

    if (!parsed) {
      logger.warn("Unknown orderId format", { orderId });
      return NextResponse.json({ received: true });
    }

    try {
      await db.$transaction(async (tx) => {
        if (eventId) {
          await tx.processedWebhook.create({
            data: { eventId, orderId, processedAt: new Date() },
          });
        }

        if (parsed.type === "subscription") {
          const planInfo = PLAN_FROM_KEY[parsed.planKey || ""] || PLAN_FROM_KEY.monthly;
          const expiresAt = new Date(Date.now() + planInfo.days * 24 * 60 * 60 * 1000);

          await tx.subscription.upsert({
            where: { userId: parsed.userId },
            update: { plan: planInfo.plan, expiresAt },
            create: { userId: parsed.userId, plan: planInfo.plan, expiresAt },
          });

          logger.info("Subscription activated via webhook", {
            userId: parsed.userId,
            orderId,
            plan: planInfo.plan,
          });
        }

        if (parsed.type === "coins" && parsed.packageId) {
          const pkg = await tx.coinPackage.findUnique({
            where: { id: parsed.packageId },
          });

          if (pkg) {
            await tx.coinPurchase.create({
              data: {
                userId: parsed.userId,
                packageId: parsed.packageId,
                coins: pkg.coins,
                amount: pkg.price,
              },
            });

            await creditCoins(
              tx,
              parsed.userId,
              pkg.coins,
              CoinLedgerReason.COIN_PURCHASE,
              orderId,
              { packageId: parsed.packageId, packageName: pkg.name }
            );

            logger.info("Coins credited via webhook", {
              userId: parsed.userId,
              coins: pkg.coins,
              orderId,
            });
          } else {
            logger.warn("Coin package not found", {
              packageId: parsed.packageId,
              orderId,
            });
          }
        }
      }, { isolationLevel: "ReadCommitted" });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        logger.info("Duplicate webhook event, skipped", { eventId, orderId });
        return NextResponse.json({ received: true, deduplicated: true });
      }
      throw error;
    }
  }

  return NextResponse.json({ received: true });
}
