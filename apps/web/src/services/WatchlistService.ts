import { BaseService } from "./BaseService";
import { NotFoundError } from "@/lib/errors";

export class WatchlistService extends BaseService {
  async getUserWatchlist(userId: string) {
    return this.db.watchlistItem.findMany({
      where: { userId },
      include: {
        video: {
          include: {
            channel: { select: { id: true, name: true, avatar: true } },
          },
        },
      },
      orderBy: { id: "desc" },
    });
  }

  async toggleWatchlist(userId: string, videoId: string) {
    if (!videoId) throw new NotFoundError("videoId مطلوب");

    const existing = await this.db.watchlistItem.findUnique({
      where: { userId_videoId: { userId, videoId } },
    });

    if (existing) {
      await this.db.watchlistItem.delete({ where: { id: existing.id } });
      return { action: "removed" };
    }

    await this.db.watchlistItem.create({ data: { userId, videoId } });
    return { action: "added" };
  }
}

export const watchlistService = new WatchlistService();
