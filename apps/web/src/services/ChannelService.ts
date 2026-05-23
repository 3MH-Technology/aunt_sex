import { BaseService } from "./BaseService";
import { NotFoundError, ForbiddenError, ValidationError } from "@/lib/errors";

export class ChannelService extends BaseService {
  async getChannel(channelId: string) {
    const channel = await this.db.channel.findUnique({
      where: { id: channelId },
      include: {
        user: {
          select: { id: true, name: true, username: true, image: true, bio: true },
        },
        _count: { select: { videos: true } },
      },
    });
    if (!channel) throw new NotFoundError("القناة غير موجودة");
    return channel;
  }

  async updateChannel(userId: string, data: { name?: string; avatar?: string }) {
    const channel = await this.db.channel.findUnique({ where: { userId } });
    if (!channel) throw new NotFoundError("ليس لديك قناة");

    if (data.name && data.name.length < 2) {
      throw new ValidationError("اسم القناة يجب أن يكون حرفين على الأقل");
    }

    return this.db.channel.update({
      where: { userId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.avatar && { avatar: data.avatar }),
      },
    });
  }

  async getChannelVideos(channelId: string, page = 1, limit = 12) {
    const skip = (page - 1) * Math.min(limit, 50);
    return this.db.video.findMany({
      where: { channelId },
      orderBy: { createdAt: "desc" },
      skip,
      take: Math.min(limit, 50),
      include: {
        channel: { select: { id: true, name: true, avatar: true } },
      },
    });
  }
}

export const channelService = new ChannelService();
