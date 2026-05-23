import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAuth, handleError } from "@/lib/api-handler";

export const GET = withAuth(
  async (req, { params }) => {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (status === "flagged") where.flagged = true;
    if (status === "pending") where.qualities = "{}";

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

export const DELETE = withAuth(
  async (req, { params }) => {
    const { id } = await req.json();
    await db.video.delete({ where: { id } });
    return NextResponse.json({ success: true });
  },
  { requireAdmin: true }
);
