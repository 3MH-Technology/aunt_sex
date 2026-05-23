import { NextRequest, NextResponse } from "next/server";
import { withAuth, handleError } from "@/lib/api-handler";
import { db } from "@/lib/db";

export const POST = withAuth(
  async (req, { userId }) => {
    const { videoId, type } = await req.json();

    if (!videoId || !["like", "dislike"].includes(type)) {
      return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
    }

    const existing = await db.like.findUnique({
      where: { userId_videoId: { userId, videoId } },
    });

    if (existing) {
      if (existing.type === type) {
        await db.like.delete({ where: { id: existing.id } });
        return NextResponse.json({ action: "removed", type });
      }
      await db.like.update({ where: { id: existing.id }, data: { type } });
      return NextResponse.json({ action: "updated", type });
    }

    await db.like.create({ data: { userId, videoId, type } });
    return NextResponse.json({ action: "added", type });
  },
  { rateLimit: { max: 30, windowMs: 60000 } }
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const videoId = searchParams.get("videoId");
    if (!videoId) {
      return NextResponse.json({ error: "videoId مطلوب" }, { status: 400 });
    }

    const [likes, dislikes] = await Promise.all([
      db.like.count({ where: { videoId, type: "like" } }),
      db.like.count({ where: { videoId, type: "dislike" } }),
    ]);

    return NextResponse.json({ likeCount: likes, dislikeCount: dislikes });
  } catch (error) {
    return handleError(error);
  }
}
