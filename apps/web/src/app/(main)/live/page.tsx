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
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-500/20 flex items-center justify-center">
              <Radio className="w-5 h-5 text-red-400 animate-pulse" />
            </div>
            لايف سكس — شوفني وأنا حية
          </h1>
          <p className="text-gray-500 text-xs mt-1 mr-11">شوف نيك لايف أو ابدأ بثك وخلّي الزباين يتجننوا</p>
        </div>
        {isAuthenticated && (
          <button onClick={() => setShowCreate(!showCreate)} className="glow-button flex items-center gap-2 text-sm px-5 py-2.5">
            <Plus className="w-4 h-4" /> ابدأ لايف دلوقتي
          </button>
        )}
      </div>

      {showCreate && (
        <div className="card-adult p-5 mb-6">
          <h3 className="font-extrabold mb-3 neon-text text-base">ابدأ لايف… وورّيهم طيزك أو نيكك</h3>
          <div className="flex gap-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="عنوان يهيجهم… سكس، نيك، شرموطة…"
              className="input-field flex-1"
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
            <button onClick={handleCreate} disabled={creating || !title.trim()} className="glow-button px-6 disabled:opacity-50 flex items-center gap-2">
              {creating ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Radio className="w-4 h-4" />}
              {creating ? "جاري..." : "يلا ابدأ النيك"}
            </button>
            <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-white transition p-2 rounded-xl hover:bg-brand-hover">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {streams.length === 0 ? (
        <div className="text-center py-24 animate-fade-in">
          <div className="w-20 h-20 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-5">
            <Radio className="w-10 h-10 text-red-500/50 animate-pulse" />
          </div>
          <p className="text-gray-300 font-bold text-lg">مفيش بث للحين…</p>
          <p className="text-gray-600 text-sm mt-1.5">كن أول واحد يفتح لايف نيك ويحرق الشاشة!</p>
          {isAuthenticated && (
            <button onClick={() => setShowCreate(true)} className="glow-button mt-6 inline-flex items-center gap-2 px-6 py-2.5">
              <Plus className="w-4 h-4" /> ابدأ لايف سكس دلوقتي
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {streams.map((stream) => (
            <Link key={stream.id} href={`/live/${stream.id}`} className="video-card group block">
              <div className="relative aspect-video bg-gradient-to-br from-brand-panel to-brand-dark overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-red-500/15 flex items-center justify-center">
                    <Radio className="w-8 h-8 text-red-400/60" />
                  </div>
                </div>
                {/* LIVE Badge */}
                <div className="absolute top-2 right-2 bg-gradient-to-r from-red-600 to-rose-500 text-white text-[10px] px-2.5 py-1 rounded-full font-extrabold flex items-center gap-1.5 shadow-glow tracking-wider">
                  <span className="w-2 h-2 bg-white rounded-full animate-ping" />
                  LIVE
                </div>
                {/* عداد المشاهدين */}
                <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-white/10">
                  <Eye className="w-3 h-3 text-brand-accent" /> {stream.viewerCount.toLocaleString()}
                </div>
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-brand-accent/80 flex items-center justify-center shadow-glow scale-90 group-hover:scale-100 transition-all duration-300">
                    <Play className="w-7 h-7 text-white fill-white" />
                  </div>
                </div>
              </div>
              <div className="p-3.5">
                <h3 className="font-bold text-sm line-clamp-2 group-hover:text-brand-accent transition-colors">{stream.title}</h3>
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="w-5 h-5 rounded-full bg-brand-accent/20 flex items-center justify-center text-[10px] font-bold text-brand-accent">{stream.user.name?.[0]}</div>
                  <p className="text-xs text-gray-500">{stream.user.name}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
