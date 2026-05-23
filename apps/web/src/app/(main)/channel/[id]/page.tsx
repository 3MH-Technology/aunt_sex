import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import Image from "next/image";
import VideoGrid from "@/components/video/VideoGrid";
import { Film, Heart } from "lucide-react";

export default async function ChannelPage({
  params,
}: {
  params: { id: string };
}) {
  const channel = await db.channel.findUnique({
    where: { id: params.id },
    include: {
      user: true,
      videos: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!channel) notFound();

  return (
    <div>
      <div className="card-adult p-6 flex items-center gap-6 mb-8">
        <Image
          src={channel.avatar}
          alt={channel.name}
          width={96}
          height={96}
          className="rounded-full ring-2 ring-brand-accent/40"
        />
        <div>
          <h1 className="text-2xl font-bold">{channel.name}</h1>
          <div className="flex items-center gap-4 text-gray-400 text-sm mt-2">
            <span className="flex items-center gap-1">
              <Film className="w-4 h-4" /> {channel.videos.length} فيديو
            </span>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        <span className="text-brand-accent">●</span> جميع فيديوهات {channel.name}
      </h2>
      {channel.videos.length > 0 ? (
        <VideoGrid initialVideos={channel.videos.map((v) => ({ ...v, channel: { ...channel, userId: channel.userId } }))} />
      ) : (
        <div className="text-center py-20 text-gray-400">
          <Film className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>لا توجد فيديوهات في هذه القناة بعد</p>
        </div>
      )}
    </div>
  );
}
