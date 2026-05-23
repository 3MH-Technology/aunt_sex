import { BaseService } from "./BaseService";
import { NotFoundError, ValidationError, ForbiddenError } from "@/lib/errors";

export class CommunityService extends BaseService {
  async getAll(limit = 20) {
    return this.db.community.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        owner: { select: { id: true, name: true, image: true } },
        _count: { select: { members: true } },
      },
    });
  }

  async getById(id: string) {
    const community = await this.db.community.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, image: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
          orderBy: { points: "desc" },
        },
        _count: { select: { members: true } },
      },
    });
    if (!community) throw new NotFoundError("المجتمع غير موجود");
    return community;
  }

  async create(ownerId: string, data: { name: string; description?: string; image?: string }) {
    if (!data.name?.trim()) throw new ValidationError("اسم المجتمع مطلوب");

    const community = await this.db.community.create({
      data: {
        name: data.name.trim(),
        description: data.description || "",
        image: data.image,
        ownerId,
      },
    });

    await this.db.communityMember.create({
      data: {
        communityId: community.id,
        userId: ownerId,
        role: "admin",
      },
    });

    return community;
  }

  async join(communityId: string, userId: string) {
    const existing = await this.db.communityMember.findUnique({
      where: { communityId_userId: { communityId, userId } },
    });
    if (existing) return existing;

    return this.db.communityMember.create({
      data: { communityId, userId },
    });
  }

  async leave(communityId: string, userId: string) {
    await this.db.communityMember.deleteMany({
      where: { communityId, userId },
    });
  }

  async addPoints(communityId: string, userId: string) {
    const community = await this.db.community.findUnique({
      where: { id: communityId },
    });
    if (!community) throw new NotFoundError("المجتمع غير موجود");

    await this.db.communityMember.updateMany({
      where: { communityId, userId },
      data: { points: { increment: community.pointsPerAction } },
    });

    await this.db.user.update({
      where: { id: userId },
      data: { points: { increment: community.pointsPerAction } },
    });
  }
}

export const communityService = new CommunityService();
