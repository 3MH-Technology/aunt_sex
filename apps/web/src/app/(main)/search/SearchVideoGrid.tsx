"use client";
import { useState, useEffect, useCallback } from "react";
import VideoGrid from "@/components/video/VideoGrid";


export default function SearchVideoGrid({ query }: { query: string }) {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVideos = useCallback(async () => {
    if (!query) return;
    setLoading(true);
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    if (res.ok) {
      const data = await res.json();
      setVideos(data.videos || []);
    }
    setLoading(false);
  }, [query]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  return <VideoGrid initialVideos={videos} />;
}
