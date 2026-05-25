import { NextRequest, NextResponse } from "next/server";
import { recommendationService } from "@/services/RecommendationService";
import { handleError } from "@/lib/api-handler";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const videoId = searchParams.get("videoId");
    const type = searchParams.get("type") || "related";
    const limit = Math.min(
      parseInt(searchParams.get("limit") || "12"),
      50
    );

    let videos;

    switch (type) {
      case "trending":
        videos = await recommendationService.getTrending(limit);
        break;
      case "recent":
        videos = await recommendationService.getRecent(limit);
        break;
      case "toprated":
        videos = await recommendationService.getTopRated(limit);
        break;
      case "related":
      default:
        if (!videoId) {
          return NextResponse.json(
            { error: "videoId مطلوب للتوصيات ذات الصلة" },
            { status: 400 }
          );
        }
        videos = await recommendationService.getRelatedVideos(videoId, limit);
        break;
    }

    return NextResponse.json(videos);
  } catch (error) {
    return handleError(error);
  }
}
