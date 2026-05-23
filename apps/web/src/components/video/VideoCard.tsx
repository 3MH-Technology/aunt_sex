"use client";
import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, Eye, Clock, Heart } from "lucide-react";
import { formatViews, formatDuration, timeAgo } from "@/lib/utils";
import ChannelVideoManager from "@/components/channel/ChannelVideoManager";

interface VideoCardProps {
  video: {
    id: string;
    title: string;
    thumbnail: string;
    previewGif?: string | null;
    duration: number;
    views: number;
    channel: { name: string; avatar: string; userId?: string };
    createdAt: Date;
  };
}

export default function VideoCard({ video }: VideoCardProps) {
  const [isHovering, setIsHovering] = useState(false);
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null);
  const showPreview = isHovering;

  const handleMouseEnter = () => {
    hoverTimeout.current = setTimeout(() => setIsHovering(true), 300);
  };
  const handleMouseLeave = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    setIsHovering(false);
  };

  const badge = video.views > 50000
    ? <span className="badge-exclusive">الأكثر مشاهدة</span>
    : video.views > 10000
    ? <span className="badge-hot">ساخن</span>
    : null;

  return (
    <Link href={`/video/${video.id}`} className="video-card group block">
      <div
        className="relative aspect-video overflow-hidden bg-brand-panel"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <Image
          src={showPreview && video.previewGif ? video.previewGif : video.thumbnail}
          alt={video.title}
          fill
          className={`object-cover transition-all duration-500 ${
            showPreview ? "scale-110" : "group-hover:scale-105"
          }`}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-14 h-14 bg-gradient-to-br from-brand-accent to-brand-accent-pink rounded-full flex items-center justify-center transform scale-0 group-hover:scale-100 transition-transform duration-300 shadow-glow">
              <Play className="w-6 h-6 fill-white text-white ml-0.5" />
            </div>
          </div>
        </div>
        {video.channel.userId && <ChannelVideoManager channelUserId={video.channel.userId} videoId={video.id} />}
        <span className="absolute bottom-2 right-2 bg-gradient-to-r from-black/90 to-black/70 text-white text-[11px] px-2 py-0.5 rounded font-semibold backdrop-blur-sm">
          {formatDuration(video.duration)}
        </span>
        {badge && (
          <span className="absolute top-2 left-2">{badge}</span>
        )}
      </div>
      <div className="p-3 flex gap-2.5">
        <Image
          src={video.channel.avatar}
          alt={video.channel.name}
          width={34}
          height={34}
          className="rounded-full mt-0.5 shrink-0 ring-1 ring-brand-accent/30"
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm leading-5 line-clamp-2 text-gray-100 group-hover:text-brand-accent transition-colors">
            {video.title}
          </h3>
          <p className="text-xs text-gray-500 mt-1 hover:text-gray-300 transition-colors">
            {video.channel.name}
          </p>
          <div className="flex items-center gap-3 text-[11px] text-gray-600 mt-1">
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" /> {formatViews(video.views)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> {timeAgo(video.createdAt)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
