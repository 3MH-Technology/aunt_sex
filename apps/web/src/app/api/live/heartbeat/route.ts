import { NextRequest, NextResponse } from "next/server";
import { withAuth, handleError } from "@/lib/api-handler";
import { db } from "@/lib/db";
import { CoinLedgerReason } from "@prisma/client";
import { deductCoins, creditCoins } from "@/lib/coingate";


export const dynamic = "force-dynamic";

const WATCH_COST_PER_MIN = 5;
const CREATOR_REWARD_PER_10_VIEWERS = 2;

export const POST = withAuth(async (req, { userId }) => {
  const { streamId } = await req.json();
  if (!streamId) {
    return NextResponse.json({ error: "streamId مطلوب" }, { status: 400 });
  }

  const stream = await db.liveStream.findUnique({
    where: { id: streamId },
    select: { userId: true, viewerCount: true },
  });
  if (!stream) {
    return NextResponse.json({ error: "البث غير موجود" }, { status: 404 });
  }

  await db.$transaction(async (tx) => {
    await deductCoins(tx, userId, WATCH_COST_PER_MIN, CoinLedgerReason.WATCH_TIME, streamId, { viewerCount: stream.viewerCount });

    if (stream.viewerCount >= 10) {
      const reward = Math.floor(stream.viewerCount / 10) * CREATOR_REWARD_PER_10_VIEWERS;
      await creditCoins(tx, stream.userId, reward, CoinLedgerReason.CREATOR_REWARD, streamId, { viewerCount: stream.viewerCount });
    }
  }, { isolationLevel: "ReadCommitted" });

  return NextResponse.json({ success: true });
});
