import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAuth, handleError } from "@/lib/api-handler";

export const dynamic = "force-dynamic";

export const GET = withAuth(
  async (req, { params }) => {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "signals";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);

    if (type === "holds") {
      const [holds, total] = await Promise.all([
        db.fraudHold.findMany({
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: { user: { select: { id: true, name: true, username: true, email: true } } },
        }),
        db.fraudHold.count(),
      ]);
      return NextResponse.json({ items: holds, total, page, limit });
    }

    const [signals, total] = await Promise.all([
      db.fraudSignal.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { id: true, name: true, username: true, email: true } } },
      }),
      db.fraudSignal.count(),
    ]);
    return NextResponse.json({ items: signals, total, page, limit });
  },
  { requireAdmin: true }
);

export const PATCH = withAuth(
  async (req) => {
    const { action, signalId, holdId, userId, reason } = await req.json();

    if (action === "review-signal" && signalId) {
      await db.fraudSignal.update({ where: { id: signalId }, data: { reviewed: true } });
      return NextResponse.json({ success: true });
    }

    if (action === "release-hold" && holdId) {
      await db.fraudHold.update({ where: { id: holdId }, data: { releasedAt: new Date(), releaseReason: reason || "admin_release" } });
      return NextResponse.json({ success: true });
    }

    if (action === "ban-user" && userId) {
      await db.user.update({ where: { id: userId }, data: { role: "banned" } });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  },
  { requireAdmin: true }
);
