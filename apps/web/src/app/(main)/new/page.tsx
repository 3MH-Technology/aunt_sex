import { db } from "@/lib/db";
import VideoGrid from "@/components/video/VideoGrid";
import { Clock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function NewPage() {
  const videos = await db.video.findMany({
    where: { status: "APPROVED" },
    orderBy: { createdAt: "desc" },
    take: 24,
    include: { channel: true },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2 flex items-center gap-2"><Clock className="w-6 h-6 text-blue-400" /> سكس جديد</h1>
      <p className="text-gray-500 text-sm mb-6">أجدد نيك وشرموطات نازلة النهارده</p>
      {videos.length > 0 ? (
        <VideoGrid initialVideos={videos} />
      ) : (
        <p className="text-gray-400 text-center py-20">لا توجد فيديوهات بعد — كن أول من يرفع!</p>
      )}
    </div>
  );
}
