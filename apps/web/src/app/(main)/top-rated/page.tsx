import { db } from "@/lib/db";
import VideoGrid from "@/components/video/VideoGrid";
import { Star } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TopRatedPage() {
  const videos = await db.video.findMany({
    orderBy: { likes: { _count: "desc" } },
    take: 24,
    include: { channel: true },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2 flex items-center gap-2"><Star className="w-6 h-6 text-yellow-400" /> الأعلى تقييماً</h1>
      <p className="text-gray-500 text-sm mb-6">المحتوى الأكثر إعجاباً من المشاهدين</p>
      {videos.length > 0 ? (
        <VideoGrid initialVideos={videos} />
      ) : (
        <p className="text-gray-400 text-center py-20">لا توجد تقييمات بعد</p>
      )}
    </div>
  );
}
