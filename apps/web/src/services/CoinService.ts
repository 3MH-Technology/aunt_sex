import { BaseService } from "./BaseService";
import { NotFoundError } from "@/lib/errors";
import { createPaymentSession } from "@/lib/maxelpay";
import { creditCoins, getBalance } from "@/lib/coingate";
import { CoinLedgerReason } from "@prisma/client";
import type { Prisma } from "@prisma/client";

type TxClient = Omit<Prisma.TransactionClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

export class CoinService extends BaseService {
  async getPackages() {
    return this.db.coinPackage.findMany({
      orderBy: { price: "asc" },
    });
  }

  async getBalance(userId: string) {
    const coins = await getBalance(userId);
    return { coins };
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

  async purchaseCoins(userId: string, packageId: string, _paymentMethod: string, tx?: TxClient) {
    const perform = async (client: TxClient) => {
      const pkg = await client.coinPackage.findUnique({ where: { id: packageId } });
      if (!pkg) throw new NotFoundError("الباقة غير موجودة");

      await client.coinPurchase.create({
        data: { userId, packageId, coins: pkg.coins, amount: pkg.price },
      });

      await creditCoins(client, userId, pkg.coins, CoinLedgerReason.COIN_PURCHASE, packageId, { packageName: pkg.name });

      return { coins: pkg.coins, balance: { increment: pkg.coins } };
    };

    if (tx) return perform(tx);
    return this.db.$transaction(perform, { isolationLevel: "ReadCommitted" });
  }
}

export const coinService = new CoinService();
