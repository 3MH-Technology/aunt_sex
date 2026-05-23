import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { historyService } from "@/services/HistoryService";
import VideoGrid from "@/components/video/VideoGrid";

export default async function ContinueWatching() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;

  const userId = (session.user as any).id as string;
  const history = await historyService.getUserHistory(userId, 4);
  const videos = history.map((h: any) => h.video).filter(Boolean);

  return videos.length > 0 ? <VideoGrid initialVideos={videos} /> : null;
}
