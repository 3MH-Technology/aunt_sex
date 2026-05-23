import { NextResponse } from "next/server";
import { withAuth, handleError } from "@/lib/api-handler";
import { liveStreamService } from "@/services/LiveStreamService";

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
  const stream = await liveStreamService.createStream(userId, title);
  return NextResponse.json(stream);
});
