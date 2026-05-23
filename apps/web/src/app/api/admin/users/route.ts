import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAuth, handleError } from "@/lib/api-handler";

export const GET = withAuth(
  async (req, { params }) => {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);

    const [users, total] = await Promise.all([
      db.user.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          role: true,
          coins: true,
          points: true,
          createdAt: true,
          _count: { select: { comments: true, likes: true } },
        },
      }),
      db.user.count(),
    ]);

    return NextResponse.json({ users, total, page, limit });
  },
  { requireAdmin: true }
);

export const PATCH = withAuth(
  async (req, { params }) => {
    const { id, role, coins, points } = await req.json();
    const data: Record<string, unknown> = {};
    if (role) data.role = role;
    if (coins !== undefined) data.coins = coins;
    if (points !== undefined) data.points = points;

    await db.user.update({ where: { id }, data });
    return NextResponse.json({ success: true });
  },
  { requireAdmin: true }
);
