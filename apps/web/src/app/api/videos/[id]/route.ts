import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { videoService } from "@/services/VideoService";
import { withAuth, handleError } from "@/lib/api-handler";
import { NotFoundError, ForbiddenError } from "@/lib/errors";
import { unlink } from "fs/promises";
import { join } from "path";


export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const video = await videoService.findById(params.id);
    if (!video) throw new NotFoundError("الفيديو غير موجود");
    return NextResponse.json(video);
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });
    }

    const video = await db.video.findUnique({
      where: { id: params.id },
      include: { channel: true },
    });
    if (!video) throw new NotFoundError("الفيديو غير موجود");

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user) throw new NotFoundError("المستخدم غير موجود");

    const isOwner = video.channel.userId === user.id;
    const isAdmin = (session.user as any).role === "admin";
    if (!isOwner && !isAdmin) throw new ForbiddenError();

    const { title, description, tags } = await req.json();
    await db.video.update({
      where: { id: params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(tags !== undefined && { tags: JSON.stringify(tags) }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });
    }

    const video = await db.video.findUnique({
      where: { id: params.id },
      include: { channel: true },
    });
    if (!video) throw new NotFoundError("الفيديو غير موجود");

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user) throw new NotFoundError("المستخدم غير موجود");

    const isOwner = video.channel.userId === user.id;
    const isAdmin = (session.user as any).role === "admin";
    if (!isOwner && !isAdmin) throw new ForbiddenError();

    const uploadDir = join(process.cwd(), "public", "uploads");

    const deleteLocal = async (url: string) => {
      if (url.startsWith("/uploads/")) {
        const relativePath = url.replace("/uploads/", "");
        await unlink(join(uploadDir, relativePath)).catch(() => {});
      }
    };

    await deleteLocal(video.hlsUrl);
    await deleteLocal(video.thumbnail);

    await db.video.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
