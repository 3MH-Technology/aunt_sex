import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAuth, handleError } from "@/lib/api-handler";


export const dynamic = "force-dynamic";

export const GET = withAuth(
  async () => {
    const [
      totalUsers,
      totalVideos,
      totalComments,
      totalViews,
      activeStreams,
      totalCoinsSpent,
      pendingConversions,
      usersToday,
      videosToday,
    ] = await Promise.all([
      db.user.count(),
      db.video.count(),
      db.comment.count(),
      db.video.aggregate({ _sum: { views: true } }),
      db.liveStream.count({ where: { isLive: true } }),
      db.coinPurchase.aggregate({ _sum: { amount: true } }),
      db.pointConversion.count({ where: { status: "pending" } }),
      db.user.count({
        where: { createdAt: { gte: new Date(Date.now() - 86400000) } },
      }),
      db.video.count({
        where: { createdAt: { gte: new Date(Date.now() - 86400000) } },
      }),
    ]);

    return NextResponse.json({
      users: totalUsers,
      videos: totalVideos,
      comments: totalComments,
      views: totalViews._sum.views || 0,
      activeStreams,
      revenue: totalCoinsSpent._sum.amount || 0,
      pendingConversions,
      usersToday,
      videosToday,
      timestamp: new Date().toISOString(),
    });
  },
  { requireAdmin: true }
);
