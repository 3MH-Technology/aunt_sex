"use client";
import { useState, useEffect, useCallback } from "react";
import VideoGrid from "@/components/video/VideoGrid";
import { searchVideos } from "@/lib/api";

export default function SearchVideoGrid({ query }: { query: string }) {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVideos = useCallback(async () => {
    if (!query) return;
    setLoading(true);
    const results = await searchVideos(query);
    setVideos(results);
    setLoading(false);
  }, [query]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  return <VideoGrid initialVideos={videos} />;
}
