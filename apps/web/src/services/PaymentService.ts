import { BaseService } from "./BaseService";
import { stripe } from "@/lib/stripe";
import { createPaymentSession as maxelpayCreateSession } from "@/lib/maxelpay";
import { NotFoundError, ValidationError } from "@/lib/errors";

const PLANS = {
  "VIP شهري": { amount: 9.99, label: "VIP شهري", days: 30 },
  "VIP سنوي": { amount: 99.99, label: "VIP سنوي", days: 365 },
} as const;

type PlanKey = keyof typeof PLANS;

export class PaymentService extends BaseService {
  async createStripeCheckout(userId: string, plan: string) {
    const planConfig = PLANS[plan as PlanKey];
    if (!planConfig) throw new ValidationError("الخطة غير صالحة");

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: planConfig.label },
            unit_amount: Math.round(planConfig.amount * 100),
            recurring: { interval: plan === "VIP سنوي" ? "year" : "month" },
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.SITE_URL}/profile?upgrade=success`,
      cancel_url: `${process.env.SITE_URL}/pricing`,
      metadata: { userId, plan },
    });

    return { url: session.url };
  }

  async createMaxelPaySession(userId: string, plan: string) {
    const planConfig = PLANS[plan as PlanKey];
    if (!planConfig) throw new ValidationError("الخطة غير صالحة");

    const orderId = `order_${userId}_${Date.now()}`;
    const siteUrl = process.env.SITE_URL || "http://localhost:3000";

    const result = await maxelpayCreateSession({
      orderId,
      amount: planConfig.amount,
      currency: "USD",
      description: `${planConfig.label} - Aunt sex`,
      successUrl: `${siteUrl}/profile?upgrade=success`,
      cancelUrl: `${siteUrl}/pricing`,
      callbackUrl: `${siteUrl}/api/webhooks/maxelpay`,
    });

    return {
      url: result.url || result.checkoutUrl || "",
    };
  }

  async activateSubscription(userId: string, plan: string) {
    const planConfig = PLANS[plan as PlanKey];
    if (!planConfig) throw new ValidationError("الخطة غير صالحة");

    const expiresAt = new Date(Date.now() + planConfig.days * 86400000);

    await this.db.subscription.upsert({
      where: { userId },
      update: { plan: plan as any, expiresAt },
      create: { userId, plan: plan as any, expiresAt },
    });
  }

  async getUserSubscription(userId: string) {
    return this.db.subscription.findUnique({
      where: { userId },
    });
  }
}

export const paymentService = new PaymentService();
