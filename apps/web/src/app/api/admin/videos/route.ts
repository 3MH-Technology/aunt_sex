import { NextRequest, NextResponse } from "next/server";
import { withAuth, handleError } from "@/lib/api-handler";
import { videoService } from "@/services/VideoService";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export const GET = withAuth(
  async (req) => {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (status) where.status = status.toUpperCase();

    const [videos, total] = await Promise.all([
      db.video.findMany({
        skip: (page - 1) * limit,
        take: limit,
        where,
        orderBy: { createdAt: "desc" },
        include: {
          channel: { select: { id: true, name: true } },
          _count: { select: { comments: true, likes: true } },
        },
      }),
      db.video.count({ where }),
    ]);

    return NextResponse.json({ videos, total, page, limit });
  },
  { requireAdmin: true }
);

export const PATCH = withAuth(
  async (req, { userId }) => {
    const { id, action } = await req.json();
    if (!id || !action) {
      return NextResponse.json({ error: "id و action مطلوبان" }, { status: 400 });
    }
    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "action يجب أن يكون approve أو reject" }, { status: 400 });
    }

    const video = action === "approve"
      ? await videoService.approve(id, userId)
      : await videoService.reject(id, userId);

    return NextResponse.json({ success: true, video });
  },
  { requireAdmin: true }
);

export const DELETE = withAuth(
  async (req) => {
    const { id } = await req.json();
    await db.video.delete({ where: { id } });
    return NextResponse.json({ success: true });
  },
  { requireAdmin: true }
);
