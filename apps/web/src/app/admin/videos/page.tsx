import { db } from "@/lib/db";
import Link from "next/link";
import { Film, Edit3, Eye } from "lucide-react";

export default async function AdminVideosPage() {
  const videos = await db.video.findMany({
    orderBy: { createdAt: "desc" },
    include: { channel: true },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Film className="w-6 h-6 text-brand-accent" /> إدارة الفيديوهات ({videos.length})
      </h1>
      <div className="card-glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-right border-b border-brand-border bg-brand-panel">
                <th className="p-3 text-xs text-gray-400 font-semibold">العنوان</th>
                <th className="p-3 text-xs text-gray-400 font-semibold">القناة</th>
                <th className="p-3 text-xs text-gray-400 font-semibold">المشاهدات</th>
                <th className="p-3 text-xs text-gray-400 font-semibold">التاريخ</th>
                <th className="p-3 text-xs text-gray-400 font-semibold">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {videos.map((video) => (
                <tr key={video.id} className="border-b border-brand-border/50 hover:bg-brand-hover/50 transition">
                  <td className="p-3 text-sm max-w-[250px] truncate">{video.title}</td>
                  <td className="p-3 text-sm text-gray-400">{video.channel.name}</td>
                  <td className="p-3 text-sm text-gray-400">{video.views.toLocaleString()}</td>
                  <td className="p-3 text-sm text-gray-400">{new Date(video.createdAt).toLocaleDateString("ar")}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <Link href={`/admin/videos/${video.id}`} className="text-brand-accent text-sm hover:underline flex items-center gap-1">
                        <Edit3 className="w-3.5 h-3.5" /> تعديل
                      </Link>
                      <Link href={`/video/${video.id}`} className="text-gray-400 text-sm hover:text-white flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" /> عرض
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
