"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Save, ArrowLeft } from "lucide-react";

export default function ChannelSettingsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    fetch(`/api/channel/${params.id}`)
      .then((r) => r.json())
      .then((ch) => {
        if (ch && !ch.error) {
          setName(ch.name);
          setAvatar(ch.avatar);
          if (user && ch.user?.id === (user as any).id) {
            setIsOwner(true);
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.id, user, isLoading]);

  const handleSave = async () => {
    setSaving(true);
    await fetch("/api/channel/update", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, avatar }),
    });
    setSaving(false);
    router.push(`/channel/${params.id}`);
  };

  if (loading || isLoading) {
    return <div className="text-center py-20 text-gray-400">جاري التحميل...</div>;
  }

  if (!isOwner) {
    return <div className="text-center py-20 text-gray-400">ليس لديك صلاحية</div>;
  }

  return (
    <div className="max-w-lg mx-auto pt-4">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-gray-400 hover:text-white mb-4">
        <ArrowLeft className="w-4 h-4" /> رجوع
      </button>
      <h1 className="text-2xl font-bold mb-6">إعدادات القناة</h1>
      <div className="card-glass p-6 space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1 font-semibold">اسم القناة</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="input-field" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1 font-semibold">رابط الصورة</label>
          <input value={avatar} onChange={(e) => setAvatar(e.target.value)} className="input-field" placeholder="/default-avatar.svg" />
        </div>
        <button onClick={handleSave} disabled={saving} className="glow-button flex items-center gap-2 w-full justify-center">
          <Save className="w-4 h-4" /> {saving ? "جاري الحفظ..." : "حفظ الإعدادات"}
        </button>
      </div>
    </div>
  );
}
