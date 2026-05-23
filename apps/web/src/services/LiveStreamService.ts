import { BaseService } from "./BaseService";
import { NotFoundError, ForbiddenError } from "@/lib/errors";
import { randomBytes } from "crypto";

export class LiveStreamService extends BaseService {
  async createStream(userId: string, title: string) {
    const streamKey = randomBytes(16).toString("hex");

    const stream = await this.db.liveStream.create({
      data: {
        title,
        userId,
        streamKey,
        isLive: true,
      },
    });

    await this.db.chatGroup.create({
      data: {
        name: `بث ${title}`,
        streamId: stream.id,
      },
    });

    return stream;
  }

  async getStream(streamId: string) {
    const stream = await this.db.liveStream.findUnique({
      where: { id: streamId },
      include: {
        user: { select: { id: true, name: true, image: true } },
        chatGroup: {
          include: {
            messages: {
              take: 50,
              orderBy: { createdAt: "desc" },
              include: {
                user: { select: { id: true, name: true, image: true } },
              },
            },
          },
        },
      },
    });
    if (!stream) throw new NotFoundError("البث غير موجود");
    return stream;
  }

  async endStream(userId: string, streamId: string) {
    const stream = await this.db.liveStream.findUnique({
      where: { id: streamId },
    });
    if (!stream) throw new NotFoundError("البث غير موجود");
    if (stream.userId !== userId) throw new ForbiddenError();

    return this.db.liveStream.update({
      where: { id: streamId },
      data: { isLive: false },
    });
  }

  async getActiveStreams(limit = 20) {
    return this.db.liveStream.findMany({
      where: { isLive: true },
      take: limit,
      orderBy: { viewerCount: "desc" },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    });
  }
}

export const liveStreamService = new LiveStreamService();
