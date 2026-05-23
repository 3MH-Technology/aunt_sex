import { BaseService } from "./BaseService";
import { NotFoundError, ValidationError } from "@/lib/errors";

export class UserService extends BaseService {
  async getUser(id: string) {
    const user = await this.db.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        image: true,
        bio: true,
        role: true,
        createdAt: true,
        channel: {
          select: { id: true, name: true, avatar: true },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });
    if (!user) throw new NotFoundError("المستخدم غير موجود");
    return user;
  }

  async updateProfile(userId: string, data: {
    name?: string;
    bio?: string;
    phone?: string;
    dateOfBirth?: string;
    gender?: string;
    image?: string;
  }) {
    if (data.name && data.name.length < 2) {
      throw new ValidationError("الاسم يجب أن يكون حرفين على الأقل");
    }

    const allowedFields: Record<string, unknown> = {};
    const whitelist = ["name", "bio", "phone", "dateOfBirth", "gender", "image"];
    for (const key of whitelist) {
      if (data[key as keyof typeof data] !== undefined) {
        allowedFields[key] = data[key as keyof typeof data];
      }
    }

    return this.db.user.update({
      where: { id: userId },
      data: allowedFields,
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        image: true,
        bio: true,
        phone: true,
        gender: true,
      },
    });
  }

  async updateAvatar(userId: string, imageUrl: string) {
    return this.db.user.update({
      where: { id: userId },
      data: { image: imageUrl },
      select: { id: true, image: true },
    });
  }

  async updateLabels(userId: string, labels: string[]) {
    return this.db.user.update({
      where: { id: userId },
      data: { labels: JSON.stringify(labels) },
      select: { id: true, labels: true },
    });
  }
}

export const userService = new UserService();
