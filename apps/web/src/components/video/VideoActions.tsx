"use client";
import { useState, useEffect, useCallback } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function VideoActions({
  videoId,
  initialLikes,
  initialDislikes,
}: {
  videoId: string;
  initialLikes: number;
  initialDislikes: number;
}) {
  const { isAuthenticated } = useAuth();
  const [likes, setLikes] = useState(initialLikes);
  const [dislikes, setDislikes] = useState(initialDislikes);
  const [userVote, setUserVote] = useState<"like" | "dislike" | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function fetchVotes() {
      try {
        const res = await fetch(`/api/likes?videoId=${videoId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) {
          setLikes(data.likeCount);
          setDislikes(data.dislikeCount);
        }
      } catch {
        // silently fail
      }
    }
    fetchVotes();
    return () => { cancelled = true; };
  }, [videoId]);

  const toggle = useCallback(async (type: "like" | "dislike") => {
    if (!isAuthenticated || loading) return;
    setLoading(true);

    try {
      const res = await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId, type }),
      });
      if (!res.ok) return;
      const data = await res.json();

      if (data.action === "removed") {
        if (type === "like") setLikes((l) => Math.max(0, l - 1));
        else setDislikes((d) => Math.max(0, d - 1));
        setUserVote(null);
      } else if (data.action === "updated") {
        if (type === "like") {
          setLikes((l) => l + 1);
          setDislikes((d) => Math.max(0, d - 1));
        } else {
          setDislikes((d) => d + 1);
          setLikes((l) => Math.max(0, l - 1));
        }
        setUserVote(type);
      } else {
        if (type === "like") setLikes((l) => l + 1);
        else setDislikes((d) => d + 1);
        setUserVote(type);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [videoId, isAuthenticated, loading]);

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={() => toggle("like")}
        disabled={loading}
        className={`flex items-center gap-1 transition-colors ${
          userVote === "like" ? "text-brand-accent" : "text-gray-400 hover:text-white"
        } ${loading ? "opacity-50" : ""}`}
      >
        <ThumbsUp className="w-5 h-5" />
        <span>{likes}</span>
      </button>
      <button
        onClick={() => toggle("dislike")}
        disabled={loading}
        className={`flex items-center gap-1 transition-colors ${
          userVote === "dislike" ? "text-red-500" : "text-gray-400 hover:text-white"
        } ${loading ? "opacity-50" : ""}`}
      >
        <ThumbsDown className="w-5 h-5" />
        <span>{dislikes}</span>
      </button>
    </div>
  );
}
