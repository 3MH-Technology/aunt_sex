import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import { withAuth, handleError } from "@/lib/api-handler";
import { ValidationError } from "@/lib/errors";
import { db } from "@/lib/db";
import { userService } from "@/services/UserService";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

export const POST = withAuth(async (req, { userId }) => {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) throw new ValidationError("الملف مطلوب");
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new ValidationError("نوع الملف غير مدعوم. الأنواع المسموحة: JPG, PNG, WebP");
  }
  if (file.size > MAX_IMAGE_SIZE) {
    throw new ValidationError("حجم الملف يتجاوز 5MB");
  }

  const ext = file.name.split(".").pop() || "jpg";
  const fileName = `avatar-${randomUUID()}.${ext}`;
  const uploadDir = join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });

  const bytes = await file.arrayBuffer();
  await writeFile(join(uploadDir, fileName), Buffer.from(bytes));
  const avatarUrl = `/uploads/${fileName}`;

  await userService.updateAvatar(userId, avatarUrl);

  const channel = await db.channel.findUnique({ where: { userId } });
  if (channel) {
    await db.channel.update({
      where: { id: channel.id },
      data: { avatar: avatarUrl },
    });
  }

  return NextResponse.json({ success: true, url: avatarUrl });
});
