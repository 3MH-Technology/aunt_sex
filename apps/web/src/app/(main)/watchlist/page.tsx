import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import VideoGrid from "@/components/video/VideoGrid";
import { List } from "lucide-react";

export default async function WatchlistPage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) redirect("/auth/signin");

  const currentUser = await db.user.findUnique({ where: { email } });
  if (!currentUser) redirect("/auth/signin");

  const watchlist = await db.watchlistItem.findMany({
    where: { userId: currentUser.id },
    include: { video: { include: { channel: true } } },
  });

  const videos = watchlist.map((item) => item.video);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><List className="w-6 h-6 text-brand-accent" /> قائمة المشاهدة</h1>
      {videos.length > 0 ? (
        <VideoGrid initialVideos={videos} />
      ) : (
        <p className="text-gray-400">لم تقم بإضافة فيديوهات بعد — استعرض وأضف ما يعجبك</p>
      )}
    </div>
  );
}
