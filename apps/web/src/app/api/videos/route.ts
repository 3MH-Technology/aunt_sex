import { NextRequest, NextResponse } from "next/server";
import { videoService } from "@/services/VideoService";
import { handleError } from "@/lib/api-handler";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const channelId = searchParams.get("channelId") || undefined;

    const videos = await videoService.findMany({ page, limit, channelId });
    return NextResponse.json(videos);
  } catch (error) {
    return handleError(error);
  }
}
