import { BaseService } from "./BaseService";
import { NotFoundError } from "@/lib/errors";
import { createPaymentSession } from "@/lib/maxelpay";

export class CoinService extends BaseService {
  async getPackages() {
    return this.db.coinPackage.findMany({
      orderBy: { price: "asc" },
    });
  }

  async getBalance(userId: string) {
    const user = await this.db.user.findUnique({
      where: { id: userId },
      select: { coins: true },
    });
    if (!user) throw new NotFoundError("المستخدم غير موجود");
    return { coins: user.coins };
  }

  async createMaxelPaySession(userId: string, packageId: string) {
    const pkg = await this.db.coinPackage.findUnique({
      where: { id: packageId },
    });
    if (!pkg) throw new NotFoundError("الباقة غير موجودة");

    const orderId = `order_coin_${userId}_${packageId}_${Date.now()}`;
    const siteUrl = process.env.SITE_URL || "http://localhost:3000";

    const result = await createPaymentSession({
      orderId,
      amount: pkg.price,
      currency: "USD",
      description: `${pkg.name} - ${pkg.coins.toLocaleString()} عملات - Aunt sex`,
      successUrl: `${siteUrl}/profile?coins=success`,
      cancelUrl: `${siteUrl}/pricing`,
      callbackUrl: `${siteUrl}/api/webhooks/maxelpay`,
    });

    return {
      url: result.url || result.checkoutUrl || "",
    };
  }

  async purchaseCoins(userId: string, packageId: string, _paymentMethod: string) {
    const pkg = await this.db.coinPackage.findUnique({
      where: { id: packageId },
    });
    if (!pkg) throw new NotFoundError("الباقة غير موجودة");

    await this.db.coinPurchase.create({
      data: {
        userId,
        packageId,
        coins: pkg.coins,
        amount: pkg.price,
      },
    });

    await this.db.user.update({
      where: { id: userId },
      data: { coins: { increment: pkg.coins } },
    });

    return { coins: pkg.coins, balance: { increment: pkg.coins } };
  }
}

export const coinService = new CoinService();
