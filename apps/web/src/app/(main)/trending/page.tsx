import VideoGrid from "@/components/video/VideoGrid";
import { db } from "@/lib/db";
import { Flame } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TrendingPage() {
  const videos = await db.video.findMany({
    where: { status: "APPROVED" },
    orderBy: { views: "desc" },
    take: 24,
    include: { channel: true },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2 flex items-center gap-2"><Flame className="w-6 h-6 text-brand-accent" /> الأكثر مشاهدة</h1>
      <p className="text-gray-500 text-sm mb-6">السكس اللي الكل بيفرك عليه دلوقتي</p>
      <VideoGrid initialVideos={videos} />
    </div>
  );
}
