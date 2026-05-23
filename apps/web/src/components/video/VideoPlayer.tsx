"use client";
import { useVideoPlayer } from "@/hooks/useVideoPlayer";
import TrackView from "./TrackView";
import { AlertTriangle } from "lucide-react";

interface Props {
  src: string;
  poster: string;
  qualities: Record<string, string>;
  videoId: string;
}

export default function VideoPlayer({ src, poster, videoId }: Props) {
  const { videoRef, error } = useVideoPlayer({ src, poster });

  if (error) {
    return (
      <div className="rounded-lg overflow-hidden bg-black shadow-glow">
        <div className="aspect-video flex items-center justify-center flex-col gap-3 text-gray-400">
          <AlertTriangle className="w-10 h-10 text-brand-accent" />
          <p>تعذر تحميل الفيديو</p>
          <video controls className="w-full max-w-lg">
            <source src={src} type="video/mp4" />
          </video>
        </div>
        <TrackView videoId={videoId} />
      </div>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden bg-black shadow-glow">
      <video ref={videoRef} className="video-js vjs-big-play-centered w-full" />
      <TrackView videoId={videoId} />
    </div>
  );
}
