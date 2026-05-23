import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { createHmac, timingSafeEqual } from "crypto";

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

/**
 * Parses orderId and returns the type and IDs.
 *
 * Formats:
 *   Subscription: order_{userId}_{timestamp}
 *   Coin purchase: order_coin_{userId}_{packageId}_{timestamp}
 */
function parseOrderId(orderId: string): {
  type: "subscription" | "coins";
  userId: string;
  packageId?: string;
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

  if (parts.length >= 3) {
    return {
      type: "subscription",
      userId: parts[1],
    };
  }

  return null;
}

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

  if (eventId) {
    const processed = await db.processedWebhook.findUnique({
      where: { eventId },
    });
    if (processed) {
      return NextResponse.json({ received: true, deduplicated: true });
    }
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

    if (eventId) {
      await db.processedWebhook.create({
        data: { eventId, orderId, processedAt: new Date() },
      }).catch(() => {});
    }

    if (parsed.type === "subscription") {
      const plan = (data.plan as string) || "vip_monthly";
      let durationDays = 30;
      if (plan === "vip_yearly") durationDays = 365;
      const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

      await db.subscription.upsert({
        where: { userId: parsed.userId },
        update: { plan, expiresAt },
        create: { userId: parsed.userId, plan, expiresAt },
      });

      logger.info("Subscription activated via webhook", {
        userId: parsed.userId,
        orderId,
        plan,
      });
    }

    if (parsed.type === "coins" && parsed.packageId) {
      const pkg = await db.coinPackage.findUnique({
        where: { id: parsed.packageId },
      });

      if (pkg) {
        await db.coinPurchase.create({
          data: {
            userId: parsed.userId,
            packageId: parsed.packageId,
            coins: pkg.coins,
            amount: pkg.price,
          },
        });

        await db.user.update({
          where: { id: parsed.userId },
          data: { coins: { increment: pkg.coins } },
        });

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
  }

  return NextResponse.json({ received: true });
}
