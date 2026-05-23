import { BaseService } from "./BaseService";
import { ValidationError } from "@/lib/errors";

export class ChatService extends BaseService {
  async getMessages(groupId: string, limit = 50) {
    return this.db.chatMessage.findMany({
      where: { groupId },
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    });
  }

  async sendMessage(userId: string, groupId: string, text: string) {
    if (!text?.trim()) throw new ValidationError("نص الرسالة مطلوب");
    if (text.length > 500) throw new ValidationError("الرسالة طويلة جداً (حد 500 حرف)");

    return this.db.chatMessage.create({
      data: { userId, groupId, text: text.trim() },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    });
  }

  async getGroups() {
    return this.db.chatGroup.findMany({
      include: {
        _count: { select: { messages: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async createGroup(name: string, description = "") {
    if (!name?.trim()) throw new ValidationError("اسم المجموعة مطلوب");
    return this.db.chatGroup.create({
      data: { name: name.trim(), description },
    });
  }

  async findGroup(id: string) {
    return this.db.chatGroup.findUnique({ where: { id } });
  }

  async createGroupWithId(id: string, name: string, streamId?: string) {
    return this.db.chatGroup.create({
      data: { id, name, streamId: streamId || null },
    });
  }
}

export const chatService = new ChatService();
