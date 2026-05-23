import { BaseService } from "./BaseService";
import { cache } from "@/lib/cache";

export class RecommendationService extends BaseService {
  async getRelatedVideos(
    currentVideoId: string,
    limit = 10
  ) {
    const cacheKey = `recommendations:${currentVideoId}:${limit}`;
    const cached = await cache.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const currentVideo = await this.db.video.findUnique({
      where: { id: currentVideoId },
      select: { tags: true, channelId: true },
    });

    if (!currentVideo) return [];

    const currentTags: string[] = JSON.parse(currentVideo.tags);

    const videos = await this.db.video.findMany({
      where: {
        id: { not: currentVideoId },
        OR: [
          { channelId: currentVideo.channelId },
          ...(currentTags.length > 0
            ? [{ tags: { contains: currentTags[0] } }]
            : []),
        ],
      },
      orderBy: { views: "desc" },
      take: limit,
      include: {
        channel: { select: { id: true, name: true, avatar: true, userId: true } },
      },
    });

    await cache.set(cacheKey, JSON.stringify(videos), 300);
    return videos;
  }

  async getTrending(limit = 12) {
    const cacheKey = `trending:${limit}`;
    const cached = await cache.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const videos = await this.db.video.findMany({
      orderBy: { views: "desc" },
      take: limit,
      where: { createdAt: { gte: new Date(Date.now() - 7 * 86400000) } },
      include: {
        channel: { select: { id: true, name: true, avatar: true, userId: true } },
      },
    });

    await cache.set(cacheKey, JSON.stringify(videos), 120);
    return videos;
  }

  async getRecent(limit = 12) {
    const cacheKey = `recent:${limit}`;
    const cached = await cache.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const videos = await this.db.video.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        channel: { select: { id: true, name: true, avatar: true, userId: true } },
      },
    });

    await cache.set(cacheKey, JSON.stringify(videos), 60);
    return videos;
  }

  async getTopRated(limit = 12) {
    const cacheKey = `toprated:${limit}`;
    const cached = await cache.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const videos = await this.db.video.findMany({
      orderBy: { views: "desc" },
      take: limit,
      include: {
        channel: { select: { id: true, name: true, avatar: true, userId: true } },
      },
    });

    await cache.set(cacheKey, JSON.stringify(videos), 300);
    return videos;
  }
}

export const recommendationService = new RecommendationService();
