"use client";
import { useState, useCallback } from "react";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import VideoCard from "./VideoCard";
import { VideoSkeleton } from "./VideoSkeleton";

export default function VideoGrid({ initialVideos }: { initialVideos: any[] }) {
  const [videos, setVideos] = useState(initialVideos);
  const [page, setPage] = useState(2);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const loadMore = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/videos?page=${page}&limit=12`);
      const newVideos = await res.json();
      if (newVideos.length === 0) {
        setHasMore(false);
      } else {
        setVideos((prev) => [...prev, ...newVideos]);
        setPage((p) => p + 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  const sentinelRef = useInfiniteScroll(loadMore, hasMore, isLoading);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {videos.map((video) => (
        <div key={video.id} className="animate-fade-in">
          <VideoCard video={video} />
        </div>
      ))}
      {isLoading &&
        Array.from({ length: 4 }).map((_, i) => <VideoSkeleton key={i} />)}
      {hasMore && <div ref={sentinelRef} className="h-10" />}
    </div>
  );
}
