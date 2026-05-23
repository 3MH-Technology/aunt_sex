"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Radio, Eye, Plus, X, Play } from "lucide-react";
import Link from "next/link";

interface LiveStream {
  id: string;
  title: string;
  thumbnail: string;
  viewerCount: number;
  isLive: boolean;
  createdAt: string;
  user: { id: string; name: string; image: string; labels?: string };
}

export default function LivePage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchStreams = async () => {
    const res = await fetch("/api/live");
    const data = await res.json();
    setStreams(data);
  };

  useEffect(() => { fetchStreams(); const t = setInterval(fetchStreams, 10000); return () => clearInterval(t); }, []);

  const handleCreate = async () => {
    if (!title.trim()) return;
    setCreating(true);
    const res = await fetch("/api/live", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim() }),
    });
    const data = await res.json();
    setCreating(false);
    if (data.id) {
      router.push(`/live/${data.id}`);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Radio className="w-6 h-6 text-brand-accent" /> البث المباشر
        </h1>
        {isAuthenticated && (
          <button onClick={() => setShowCreate(!showCreate)} className="glow-button flex items-center gap-2 text-sm px-4 py-2">
            <Plus className="w-4 h-4" /> بدء بث
          </button>
        )}
      </div>

      {showCreate && (
        <div className="card-adult p-4 mb-6 flex gap-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="عنوان البث..." className="input-field flex-1" />
          <button onClick={handleCreate} disabled={creating || !title.trim()} className="glow-button px-6 disabled:opacity-50">
            {creating ? "..." : "ابدأ"}
          </button>
          <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
      )}

      {streams.length === 0 ? (
        <div className="text-center py-20">
          <Radio className="w-12 h-12 mx-auto mb-4 text-gray-600" />
          <p className="text-gray-400">لا يوجد بث مباشر الآن</p>
          <p className="text-gray-600 text-sm mt-1">كن أول من يبدأ البث!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {streams.map((stream) => (
            <Link key={stream.id} href={`/live/${stream.id}`} className="video-card group block">
              <div className="relative aspect-video bg-brand-panel overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Radio className="w-12 h-12 text-gray-700" />
                </div>
                <div className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-0.5 rounded font-bold flex items-center gap-1 animate-pulse">
                  <span className="w-2 h-2 bg-white rounded-full" /> LIVE
                </div>
                <div className="absolute top-2 left-2 bg-black/80 text-white text-xs px-2 py-0.5 rounded flex items-center gap-1">
                  <Eye className="w-3 h-3" /> {stream.viewerCount}
                </div>
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                  <Play className="w-12 h-12 text-white" />
                </div>
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-sm line-clamp-2">{stream.title}</h3>
                <p className="text-xs text-gray-500 mt-1">{stream.user.name}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
