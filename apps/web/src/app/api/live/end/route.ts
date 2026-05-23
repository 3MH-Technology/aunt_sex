import { NextResponse } from "next/server";
import { withAuth, handleError } from "@/lib/api-handler";
import { liveStreamService } from "@/services/LiveStreamService";

export const POST = withAuth(async (req, { userId }) => {
  const { streamId } = await req.json();
  await liveStreamService.endStream(userId, streamId);
  return NextResponse.json({ success: true });
});
