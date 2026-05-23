import { BaseService } from "./BaseService";
import { NotFoundError } from "@/lib/errors";

export class HistoryService extends BaseService {
  async getUserHistory(userId: string, limit = 20, cursor?: string) {
    return this.db.watchHistory.findMany({
      where: { userId },
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { watchedAt: "desc" },
      include: {
        video: {
          include: {
            channel: { select: { id: true, name: true, avatar: true } },
          },
        },
      },
    });
  }

  async trackView(userId: string | undefined, videoId: string) {
    if (!videoId) throw new NotFoundError("videoId مطلوب");

    await this.db.video.update({
      where: { id: videoId },
      data: { views: { increment: 1 } },
    }).catch(() => {});

    if (!userId) return;

    const existing = await this.db.watchHistory.findUnique({
      where: { userId_videoId: { userId, videoId } },
    });

    if (existing) {
      await this.db.watchHistory.update({
        where: { id: existing.id },
        data: { watchedAt: new Date() },
      });
    } else {
      await this.db.watchHistory.create({ data: { userId, videoId } });
    }
  }

  async clearHistory(userId: string) {
    await this.db.watchHistory.deleteMany({ where: { userId } });
  }
}

export const historyService = new HistoryService();
