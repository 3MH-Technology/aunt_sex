import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import { addVideoToQueue } from "@/lib/ffmpeg";
import { withAuth, handleError } from "@/lib/api-handler";
import { ValidationError } from "@/lib/errors";
import { logger } from "@/lib/logger";

const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/x-msvideo",
  "video/quicktime",
];
const ALLOWED_VIDEO_EXTENSIONS = ["mp4", "webm", "avi", "mov", "mkv"];
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

export const POST = withAuth(async (req, { userId }) => {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const title = formData.get("title") as string | null;
  const description = (formData.get("description") as string) || "";
  const tagsRaw = (formData.get("tags") as string) || "[]";

  if (!file || !title?.trim()) {
    throw new ValidationError("الملف والعنوان مطلوبان");
  }

  if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
    throw new ValidationError("نوع الملف غير مدعوم");
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  if (!ALLOWED_VIDEO_EXTENSIONS.includes(ext)) {
    throw new ValidationError("امتداد الملف غير مدعوم");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new ValidationError("حجم الملف يتجاوز 500MB");
  }

  let tags: string[] = [];
  try {
    tags = JSON.parse(tagsRaw);
    if (!Array.isArray(tags)) tags = [];
  } catch {
    tags = [];
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    include: { channel: true },
  });
  if (!user) throw new ValidationError("المستخدم غير موجود");

  let channel = user.channel;
  if (!channel) {
    channel = await db.channel.create({
      data: {
        name: user.name || "قناة جديدة",
        avatar: "/default-avatar.svg",
        userId: user.id,
      },
    });
  }

  const videoId = randomUUID();
  const fileName = `${videoId}.${ext}`;
  const uploadDir = join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const filePath = join(uploadDir, fileName);
  await writeFile(filePath, buffer);

  await db.video.create({
    data: {
      id: videoId,
      title: title.trim(),
      description,
      thumbnail: "/default-thumbnail.svg",
      duration: 0,
      views: 0,
      hlsUrl: `/uploads/${fileName}`,
      qualities: JSON.stringify({}),
      tags: JSON.stringify(tags),
      channelId: channel.id,
    },
  });

  try {
    await addVideoToQueue(videoId, filePath);
    logger.info("Video queued for processing", { videoId });
  } catch (e) {
    logger.error("Failed to queue video processing", {
      videoId,
      error: e instanceof Error ? e.message : String(e),
    });
  }

  return NextResponse.json({ success: true, videoId });
});
