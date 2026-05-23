import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import VideoGrid from "@/components/video/VideoGrid";
import { History } from "lucide-react";

export default async function HistoryPage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) redirect("/auth/signin");

  const currentUser = await db.user.findUnique({ where: { email } });
  if (!currentUser) redirect("/auth/signin");

  const history = await db.watchHistory.findMany({
    where: { userId: currentUser.id },
    orderBy: { watchedAt: "desc" },
    include: { video: { include: { channel: true } } },
  });

  const videos = history.map((h) => h.video);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><History className="w-6 h-6 text-brand-accent" /> سجل المشاهدة</h1>
      {videos.length > 0 ? (
        <VideoGrid initialVideos={videos} />
      ) : (
        <div className="text-center py-20">
          <p className="text-gray-400">لم تشاهد أي فيديو بعد — ابدأ بالتصفح الآن</p>
        </div>
      )}
    </div>
  );
}
