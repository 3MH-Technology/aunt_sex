"use client";
import { useState, useEffect } from "react";
import { Bookmark } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function WatchlistButton({ videoId }: { videoId: string }) {
  const { isAuthenticated } = useAuth();
  const [inWatchlist, setInWatchlist] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetch("/api/watchlist")
      .then((r) => r.json())
      .then((data) => {
        if (data.some((item: any) => item.videoId === videoId)) {
          setInWatchlist(true);
        }
      })
      .catch(() => {});
  }, [videoId, isAuthenticated]);

  const toggle = async () => {
    if (!isAuthenticated) return;
    const res = await fetch("/api/watchlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoId }),
    });
    const data = await res.json();
    setInWatchlist(data.action === "added");
  };

  if (!isAuthenticated) return null;

  return (
    <button
      onClick={toggle}
      className={`flex items-center gap-1 text-sm transition ${
        inWatchlist ? "text-brand-accent" : "text-gray-400 hover:text-white"
      }`}
    >
      <Bookmark className={`w-5 h-5 ${inWatchlist ? "fill-brand-accent" : ""}`} />
      {inWatchlist ? "محفوظ" : "احفظ"}
    </button>
  );
}
