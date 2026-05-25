import { BaseService } from "./BaseService";
import { NotFoundError } from "@/lib/errors";
import { deductCoins, creditCoins } from "@/lib/coingate";
import { CoinLedgerReason } from "@prisma/client";

export class GiftService extends BaseService {
  async getGiftTypes() {
    return this.db.giftType.findMany({
      orderBy: { price: "asc" },
    });
  }

  async sendGift(senderId: string, data: {
    receiverId: string;
    giftTypeId: string;
    streamId?: string;
  }) {
    const giftType = await this.db.giftType.findUnique({
      where: { id: data.giftTypeId },
    });
    if (!giftType) throw new NotFoundError("نوع الهدية غير موجود");

    return this.db.$transaction(async (tx) => {
      await deductCoins(
        tx, senderId, giftType.price, CoinLedgerReason.GIFT_SEND,
        undefined, { receiverId: data.receiverId, giftTypeId: data.giftTypeId, streamId: data.streamId }
      );

      await creditCoins(
        tx, data.receiverId, Math.floor(giftType.price * 0.9), CoinLedgerReason.GIFT_RECEIVE,
        undefined, { senderId, giftTypeId: data.giftTypeId, streamId: data.streamId }
      );

      return tx.giftTransaction.create({
        data: {
          senderId,
          receiverId: data.receiverId,
          giftTypeId: data.giftTypeId,
          streamId: data.streamId,
        },
      });
    }, { isolationLevel: "ReadCommitted" });
  }
}

export const giftService = new GiftService();
