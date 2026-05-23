import { BaseService } from "./BaseService";
import { NotFoundError, ValidationError } from "@/lib/errors";

const MIN_CONVERSION_POINTS = 100;
const COMMISSION_RATE = 0.1;

export class PointService extends BaseService {
  async getBalance(userId: string) {
    const user = await this.db.user.findUnique({
      where: { id: userId },
      select: { points: true },
    });
    if (!user) throw new NotFoundError("المستخدم غير موجود");
    return { points: user.points };
  }

  async getHistory(userId: string, limit = 50) {
    return this.db.pointTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  async addPoints(userId: string, amount: number, reason: string, referenceId?: string) {
    if (amount <= 0) throw new ValidationError("كمية النقاط يجب أن تكون موجبة");

    await this.db.$transaction([
      this.db.pointTransaction.create({
        data: { userId, amount, reason, referenceId },
      }),
      this.db.user.update({
        where: { id: userId },
        data: { points: { increment: amount } },
      }),
    ]);
  }

  async requestConversion(userId: string, points: number, walletAddress: string, walletNetwork: string) {
    if (points < MIN_CONVERSION_POINTS) {
      throw new ValidationError(`الحد الأدنى للتحويل هو ${MIN_CONVERSION_POINTS} نقطة`);
    }

    const user = await this.db.user.findUnique({
      where: { id: userId },
      select: { points: true },
    });
    if (!user) throw new NotFoundError("المستخدم غير موجود");
    if (user.points < points) {
      throw new ValidationError("رصيد النقاط غير كافٍ");
    }

    const fee = Math.floor(points * COMMISSION_RATE);
    const netAmount = (points - fee) / 100;

    const conversion = await this.db.pointConversion.create({
      data: {
        userId,
        points,
        amount: netAmount,
        fee,
        status: "pending",
        walletAddress,
        walletNetwork,
      },
    });

    await this.db.user.update({
      where: { id: userId },
      data: { points: { decrement: points } },
    });

    return conversion;
  }
}

export const pointService = new PointService();
