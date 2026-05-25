import { NextResponse } from "next/server";
import { withAuth, handleError } from "@/lib/api-handler";
import { db } from "@/lib/db";

export const GET = withAuth(async () => {
  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true, name: true, username: true, email: true,
      role: true, coins: true, createdAt: true,
      _count: { select: { liveStreams: true, coinPurchases: true } },
    },
  });
  return NextResponse.json(users);
}, { requireAdmin: true });

export const PATCH = withAuth(async (req) => {
  const { userId, role } = await req.json();
  if (!userId || !role) {
    return NextResponse.json({ error: "userId و role مطلوبان" }, { status: 400 });
  }
  if (!["user", "admin", "moderator", "banned"].includes(role)) {
    return NextResponse.json({ error: "دور غير صالح" }, { status: 400 });
  }
  const user = await db.user.update({
    where: { id: userId },
    data: { role },
    select: { id: true, name: true, username: true, role: true },
  });
  return NextResponse.json(user);
}, { requireAdmin: true });
