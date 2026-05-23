import { BaseService } from "./BaseService";
import { NotFoundError, ValidationError, ForbiddenError } from "@/lib/errors";

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

    const sender = await this.db.user.findUnique({
      where: { id: senderId },
    });
    if (!sender) throw new NotFoundError("المستخدم غير موجود");

    if (sender.coins < giftType.price) {
      throw new ValidationError("رصيد العملات غير كافٍ");
    }

    const [transaction] = await this.db.$transaction([
      this.db.giftTransaction.create({
        data: {
          senderId,
          receiverId: data.receiverId,
          giftTypeId: data.giftTypeId,
          streamId: data.streamId,
        },
      }),
      this.db.user.update({
        where: { id: senderId },
        data: { coins: { decrement: giftType.price } },
      }),
      this.db.user.update({
        where: { id: data.receiverId },
        data: { coins: { increment: Math.floor(giftType.price * 0.9) } },
      }),
    ]);

    return transaction;
  }
}

export const giftService = new GiftService();
