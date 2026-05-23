"use client";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Edit3, Trash2 } from "lucide-react";
import { useState } from "react";

interface Props {
  channelUserId: string;
  videoId: string;
}

export default function ChannelVideoManager({ channelUserId, videoId }: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  if (!user || (user as any).id !== channelUserId) return null;

  const handleDelete = async () => {
    if (!confirm("هل أنت متأكد من حذف هذا الفيديو؟")) return;
    setDeleting(true);
    await fetch(`/api/videos/${videoId}`, { method: "DELETE" });
    router.refresh();
  };

  return (
    <div className="absolute top-2 left-2 flex gap-1.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
      <button
        onClick={(e) => { e.preventDefault(); router.push(`/video/${videoId}/edit`); }}
        className="bg-black/80 p-1.5 rounded hover:bg-brand-accent transition-colors"
        title="تعديل"
      >
        <Edit3 className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={(e) => { e.preventDefault(); handleDelete(); }}
        disabled={deleting}
        className="bg-black/80 p-1.5 rounded hover:bg-red-500 transition-colors"
        title="حذف"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
