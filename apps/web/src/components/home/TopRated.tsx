import VideoGrid from "@/components/video/VideoGrid";
import { db } from "@/lib/db";

export default async function TopRated() {
  const videos = await db.video.findMany({
    orderBy: { likes: { _count: "desc" } },
    take: 12,
    include: {
      channel: { select: { id: true, name: true, avatar: true } },
      _count: { select: { likes: true, comments: true } },
    },
  });

  return <VideoGrid initialVideos={videos as any} />;
}
