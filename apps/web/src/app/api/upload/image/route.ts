import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import { withAuth, handleError } from "@/lib/api-handler";
import { ValidationError } from "@/lib/errors";


export const dynamic = "force-dynamic";

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

export const POST = withAuth(async (req) => {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) throw new ValidationError("الملف مطلوب");

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new ValidationError("نوع الملف غير مدعوم. الأنواع المسموحة: JPG, PNG, WebP, GIF");
  }

  if (file.size > MAX_IMAGE_SIZE) {
    throw new ValidationError("حجم الملف يتجاوز 10MB");
  }

  const ext = file.name.split(".").pop() || "jpg";
  const fileName = `${randomUUID()}.${ext}`;
  const uploadDir = join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });

  const bytes = await file.arrayBuffer();
  await writeFile(join(uploadDir, fileName), Buffer.from(bytes));

  return NextResponse.json({ url: `/uploads/${fileName}` });
});
