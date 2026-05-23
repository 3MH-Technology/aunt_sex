import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAuth, handleError } from "@/lib/api-handler";
import { ValidationError, NotFoundError } from "@/lib/errors";

export const POST = withAuth(
  async (req, { userId }) => {
    const { videoId, text } = await req.json();

    if (!videoId || !text?.trim()) {
      throw new ValidationError("بيانات ناقصة");
    }

    const video = await db.video.findUnique({
      where: { id: videoId },
      select: { id: true },
    });
    if (!video) throw new NotFoundError("الفيديو غير موجود");

    const comment = await db.comment.create({
      data: { text: text.trim(), videoId, userId },
      select: { id: true, text: true, createdAt: true },
    });

    return NextResponse.json({
      id: comment.id,
      text: comment.text,
      createdAt: comment.createdAt.toISOString(),
    });
  },
  { rateLimit: { max: 10, windowMs: 60000 } }
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const videoId = searchParams.get("videoId");
    const cursor = searchParams.get("cursor");
    const limit = Math.min(
      parseInt(searchParams.get("limit") || "20"),
      50
    );

    if (!videoId) {
      return NextResponse.json(
        { error: "videoId مطلوب" },
        { status: 400 }
      );
    }

    const comments = await db.comment.findMany({
      where: { videoId },
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        text: true,
        createdAt: true,
        user: { select: { name: true, image: true } },
      },
    });

    const hasMore = comments.length > limit;
    const items = hasMore ? comments.slice(0, limit) : comments;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return NextResponse.json({ comments: items, nextCursor });
  } catch (error) {
    return handleError(error);
  }
}
