import { NextRequest, NextResponse } from "next/server";
import { channelService } from "@/services/ChannelService";
import { handleError } from "@/lib/api-handler";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "12"), 50);

    const videos = await channelService.getChannelVideos(params.id, page, limit);
    return NextResponse.json(videos);
  } catch (error) {
    return handleError(error);
  }
}
