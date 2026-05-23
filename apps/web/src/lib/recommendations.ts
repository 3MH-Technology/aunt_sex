import { recommendationService } from "@/services/RecommendationService";

export async function getRecommendedVideos(
  userId: string | null,
  currentVideoId: string
) {
  return recommendationService.getRelatedVideos(currentVideoId);
}
