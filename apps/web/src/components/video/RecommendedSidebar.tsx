import { VideoWithChannel } from "@/types";
import VideoCard from "./VideoCard";

export default function RecommendedSidebar({
  videos,
}: {
  videos: VideoWithChannel[];
}) {
  return (
    <div className="space-y-3">
      {videos.map((video) => (
        <VideoCard key={video.id} video={video} />
      ))}
    </div>
  );
}
