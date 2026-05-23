"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Trash2, ArrowLeft } from "lucide-react";

export default function AdminEditVideoPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/videos`)
      .then((r) => r.json())
      .then((videos: any[]) => {
        const video = videos.find((v) => v.id === params.id);
        if (video) {
          setTitle(video.title);
          setDescription(video.description);
          setTags((JSON.parse(video.tags) as string[]).join(", "));
        }
        setLoading(false);
      });
  }, [params.id]);

  const handleSave = async () => {
    setSaving(true);
    await fetch(`/api/videos/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      }),
    });
    setSaving(false);
    router.push("/admin/videos");
  };

  const handleDelete = async () => {
    if (!confirm("هل أنت متأكد من حذف هذا الفيديو؟")) return;
    await fetch(`/api/videos/${params.id}`, { method: "DELETE" });
    router.push("/admin/videos");
  };

  if (loading) {
    return <div className="text-center py-20 text-gray-400">جاري التحميل...</div>;
  }

  return (
    <div className="max-w-2xl">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-gray-400 hover:text-white mb-4">
        <ArrowLeft className="w-4 h-4" /> رجوع
      </button>
      <h1 className="text-2xl font-bold mb-6">تعديل الفيديو</h1>
      <div className="card-glass p-6 space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1 font-semibold">العنوان</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1 font-semibold">الوصف</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="input-field resize-none" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1 font-semibold">الوسوم</label>
          <input value={tags} onChange={(e) => setTags(e.target.value)} className="input-field" placeholder="tag1, tag2" />
        </div>
        <div className="flex gap-3 pt-4">
          <button onClick={handleSave} disabled={saving} className="glow-button flex items-center gap-2">
            <Save className="w-4 h-4" /> {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
          </button>
          <button onClick={handleDelete} className="glow-button-outline !border-red-500 !text-red-400 hover:!bg-red-500/10 flex items-center gap-2">
            <Trash2 className="w-4 h-4" /> حذف
          </button>
        </div>
      </div>
    </div>
  );
}
