import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getRecommendedVideos } from "@/lib/recommendations";
import VideoPlayer from "@/components/video/VideoPlayer";
import VideoActions from "@/components/video/VideoActions";
import VideoDescription from "@/components/video/VideoDescription";
import CommentSection from "@/components/comments/CommentSection";
import RecommendedSidebar from "@/components/video/RecommendedSidebar";
import WatchlistButton from "@/components/video/WatchlistButton";
import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const video = await db.video.findUnique({ where: { id: params.id } });
  if (!video) return { title: "غير موجود" };
  return {
    title: `${video.title} - Aunt sex`,
    description: video.description,
    openGraph: {
      title: video.title,
      description: video.description,
      images: [video.thumbnail],
    },
  };
}

export default async function VideoPage({
  params,
}: {
  params: { id: string };
}) {
  const video = await db.video.findUnique({
    where: { id: params.id },
    include: { channel: true, comments: { include: { user: true }, orderBy: { createdAt: "desc" } } },
  });
  if (!video || video.status !== "APPROVED") notFound();

  const recommended = await getRecommendedVideos(null, params.id);

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1 min-w-0">
        <VideoPlayer
          src={video.hlsUrl}
          poster={video.thumbnail}
          qualities={JSON.parse(video.qualities)}
          videoId={video.id}
        />
        <div className="mt-4 px-1">
          <h1 className="text-xl font-bold">{video.title}</h1>
          <div className="flex flex-wrap items-center gap-4 mt-3">
            <span className="text-gray-400 text-sm">
              {video.views.toLocaleString()} مشاهدة
            </span>
            {video.views > 10000 && <span className="badge-hot">نار</span>}
            {Date.now() - new Date(video.createdAt).getTime() < 86400000 && <span className="badge-exclusive">جديد</span>}
            <VideoActions
              videoId={video.id}
              initialLikes={0}
              initialDislikes={0}
            />
            <WatchlistButton videoId={video.id} />
          </div>
          <div className="flex gap-2 mt-3 flex-wrap">
            {(JSON.parse(video.tags) as string[]).map((tag: string) => (
              <span
                key={tag}
                className="bg-brand-hover text-xs px-3 py-1 rounded-full text-gray-300"
              >
                #{tag}
              </span>
            ))}
          </div>
          <VideoDescription description={video.description} />
          <CommentSection
            videoId={video.id}
            initialComments={video.comments.map((c) => ({
              id: c.id,
              text: c.text,
              createdAt: c.createdAt.toISOString(),
              user: { name: c.user.name ?? "مستخدم", avatar: c.user.image ?? "" },
            }))}
          />
        </div>
      </div>
      <aside className="w-full lg:w-[380px] shrink-0">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <span className="text-brand-accent">●</span> قد يعجبك أيضاً
        </h2>
        <RecommendedSidebar videos={recommended} />
      </aside>
    </div>
  );
}
