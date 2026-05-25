import { NextResponse } from "next/server";
import { withAuth, handleError } from "@/lib/api-handler";
import { liveStreamService } from "@/services/LiveStreamService";
import { withCoinGate } from "@/lib/coingate";
import { COINS } from "@/config/coingate";
import { CoinLedgerReason } from "@prisma/client";
import { randomBytes } from "crypto";


export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const streams = await liveStreamService.getActiveStreams();
    return NextResponse.json(streams);
  } catch (error) {
    return handleError(error);
  }
}

export const POST = withAuth(async (req, { userId }) => {
  const { title } = await req.json();
  if (!title?.trim()) {
    return NextResponse.json({ error: "العنوان مطلوب" }, { status: 400 });
  }

  const { result: stream } = await withCoinGate(
    userId,
    COINS.LIVE_STREAM_START,
    CoinLedgerReason.LIVE_STREAM_START,
    async (tx) => {
      const streamKey = randomBytes(16).toString("hex");
      const stream = await tx.liveStream.create({
        data: { title, userId, streamKey, isLive: true },
      });
      await tx.chatGroup.create({
        data: { name: `بث ${title}`, streamId: stream.id },
      });
      return stream;
    },
    { metadata: { title } }
  );

  return NextResponse.json(stream);
});
