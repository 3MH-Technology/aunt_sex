"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Film, Check, X, Clock, Eye, Edit3 } from "lucide-react";

type VideoItem = {
  id: string;
  title: string;
  status: string;
  views: number;
  createdAt: string;
  channel: { id: string; name: string };
  _count: { comments: number; likes: number };
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "قيد المراجعة",
  APPROVED: "مقبول",
  REJECTED: "مرفوض",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-500/20 text-yellow-400",
  APPROVED: "bg-green-500/20 text-green-400",
  REJECTED: "bg-red-500/20 text-red-400",
};

export default function AdminVideosPage() {
  const [tab, setTab] = useState("PENDING");
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/videos?status=${tab}&limit=50`)
      .then((r) => r.json())
      .then((data) => { setVideos(data.videos || []); setTotal(data.total || 0); setLoading(false); })
      .catch(() => setLoading(false));
  }, [tab]);

  const handleAction = async (id: string, action: "approve" | "reject") => {
    setActionId(id);
    try {
      const res = await fetch("/api/admin/videos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      if (res.ok) {
        setVideos((prev) => prev.filter((v) => v.id !== id));
      }
    } catch {}
    setActionId(null);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Film className="w-6 h-6 text-brand-accent" /> إدارة الفيديوهات
      </h1>

      <div className="flex gap-2 mb-6">
        {["PENDING", "APPROVED", "REJECTED"].map((s) => (
          <button key={s} onClick={() => setTab(s)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              tab === s
                ? "bg-brand-accent/20 text-brand-accent border border-brand-accent/30"
                : "bg-brand-panel/50 text-gray-400 border border-brand-border/30 hover:text-white"
            }`}
          >
            {STATUS_LABELS[s] || s} {tab === s && `(${total})`}
          </button>
        ))}
      </div>

      <div className="card-glass overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-10 text-gray-400">جاري التحميل...</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="table-header">
                  <th>العنوان</th>
                  <th>القناة</th>
                  <th>الحالة</th>
                  <th>المشاهدات</th>
                  <th>التاريخ</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {videos.map((video) => (
                  <tr key={video.id} className="table-row">
                    <td className="table-cell max-w-[250px] truncate text-sm">{video.title}</td>
                    <td className="table-cell text-sm text-gray-400">{video.channel.name}</td>
                    <td className="table-cell">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[video.status] || ""}`}>
                        {STATUS_LABELS[video.status] || video.status}
                      </span>
                    </td>
                    <td className="table-cell text-sm text-gray-400">{video.views.toLocaleString()}</td>
                    <td className="table-cell text-sm text-gray-400">{new Date(video.createdAt).toLocaleDateString("ar")}</td>
                    <td className="table-cell">
                      <div className="flex gap-2 items-center">
                        {video.status === "PENDING" && (
                          <>
                            <button onClick={() => handleAction(video.id, "approve")} disabled={actionId === video.id}
                              className="btn-icon text-green-400 hover:text-green-300 hover:border-green-500/40" title="موافقة">
                              {actionId === video.id ? <Clock className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            </button>
                            <button onClick={() => handleAction(video.id, "reject")} disabled={actionId === video.id}
                              className="btn-icon text-red-400 hover:text-red-300 hover:border-red-500/40" title="رفض">
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <Link href={`/admin/videos/${video.id}`} className="btn-icon" title="تعديل">
                          <Edit3 className="w-4 h-4" />
                        </Link>
                        <Link href={`/video/${video.id}`} className="btn-icon" title="عرض">
                          <Eye className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
                {videos.length === 0 && (
                  <tr><td colSpan={6} className="p-4 text-center text-gray-500">لا توجد فيديوهات في هذه الحالة</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
