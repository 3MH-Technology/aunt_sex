import { BaseService } from "./BaseService";
import { Video, Prisma } from "@prisma/client";
import { cache } from "@/lib/cache";
import { ServiceError } from "@/lib/errors";

export class VideoService extends BaseService {
  async findMany(params: {
    page?: number;
    limit?: number;
    channelId?: string;
    orderBy?: Prisma.VideoOrderByWithRelationInput;
  }): Promise<Video[]> {
    const { page = 1, limit = 12, channelId, orderBy = { createdAt: "desc" } } = params;
    const skip = (page - 1) * limit;

    const cacheKey = `videos:list:${JSON.stringify(params)}`;
    const cached = await cache.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const videos = await this.db.video.findMany({
      skip,
      take: Math.min(limit, 50),
      orderBy,
      where: channelId ? { channelId } : undefined,
      include: { channel: { select: { id: true, name: true, avatar: true, userId: true } } },
    });

    await cache.set(cacheKey, JSON.stringify(videos), 60);
    return videos;
  }

  async findById(id: string): Promise<Video | null> {
    const video = await this.db.video.findUnique({
      where: { id },
      include: {
        channel: { select: { id: true, name: true, avatar: true, userId: true } },
      },
    });
    return video;
  }

  async incrementViews(id: string): Promise<void> {
    await this.db.video.update({
      where: { id },
      data: { views: { increment: 1 } },
    }).catch(() => {});
  }

  async search(query: string): Promise<Video[]> {
    return this.db.video.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { tags: { contains: query } },
        ],
      },
      take: 20,
      include: { channel: { select: { id: true, name: true, avatar: true, userId: true } } },
    });
  }

  async delete(id: string, userId: string): Promise<void> {
    const video = await this.db.video.findUnique({
      where: { id },
      include: { channel: true },
    });
    if (!video) throw new ServiceError("NOT_FOUND", "الفيديو غير موجود");
    if (video.channel.userId !== userId) {
      throw new ServiceError("FORBIDDEN", "ليس لديك صلاحية");
    }
    await this.db.video.delete({ where: { id } });
    await cache.delPattern(`videos:*`);
  }
}

export const videoService = new VideoService();
