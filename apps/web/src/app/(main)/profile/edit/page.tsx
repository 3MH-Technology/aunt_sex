"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Mail, User, Phone, Calendar, Info, Upload, Camera, X } from "lucide-react";
import Image from "next/image";

import { USER_LABEL_OPTIONS, USER_LABEL_COLORS } from "@/config/user-labels";

const LABEL_OPTIONS = [...USER_LABEL_OPTIONS];
const LABEL_COLORS = USER_LABEL_COLORS;

export default function EditProfilePage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [bio, setBio] = useState("");
  const [labels, setLabels] = useState<string[]>([]);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setUsername((user as any).username || "");
      setPhone((user as any).phone || "");
      setDateOfBirth((user as any).dateOfBirth || "");
      setGender((user as any).gender || "");
      setBio((user as any).bio || "");
      setAvatarUrl(user.image || "");
      try { setLabels(JSON.parse((user as any).labels || "[]")); } catch { setLabels([]); }
    }
  }, [user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/user/avatar", { method: "POST", body: formData });
    const data = await res.json();
    if (data.url) setAvatarUrl(data.url);
    setUploading(false);
  };

  const toggleLabel = (label: string) => {
    setLabels((prev) => prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/user/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, username, phone, dateOfBirth, gender, bio }),
      });
      const data = await res.json();
      if (res.ok) {
        await fetch("/api/user/labels", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ labels }),
        });
        setMessage("تم حفظ التغييرات بنجاح!");
        setTimeout(() => router.push("/profile"), 1000);
      } else {
        setMessage(data.error || "حدث خطأ أثناء الحفظ");
      }
    } catch {
      setMessage("حدث خطأ في الاتصال");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (!isAuthenticated) {
    router.push("/auth/signin");
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto pt-6">
      <h1 className="text-2xl font-bold mb-6">تعديل الملف الشخصي</h1>

      <form onSubmit={handleSubmit} className="bg-brand-card rounded-xl p-6 border border-brand-border space-y-5">
        <div className="flex flex-col items-center mb-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-brand-accent/20 flex items-center justify-center text-4xl font-bold shadow-glow">
              {avatarUrl ? <Image src={avatarUrl} alt="" width={96} height={96} className="object-cover w-full h-full" /> : (name?.[0] || "U")}
            </div>
            <button type="button" onClick={() => fileRef.current?.click()} className="absolute bottom-0 right-0 bg-brand-accent rounded-full p-1.5 shadow-lg hover:scale-110 transition">
              <Camera className="w-4 h-4 text-white" />
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          <p className="text-xs text-gray-500 mt-2">{uploading ? "جاري الرفع..." : "اضغط لتغيير الصورة"}</p>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">الاسم</label>
          <div className="relative">
            <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-brand-panel border border-brand-border rounded-lg pr-10 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-accent" />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">اسم المستخدم</label>
          <div className="relative">
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">@</span>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required className="w-full bg-brand-panel border border-brand-border rounded-lg pr-10 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-accent" />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">البريد الإلكتروني</label>
          <div className="relative">
            <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input type="email" value={user?.email || ""} disabled className="w-full bg-brand-panel/50 border border-brand-border rounded-lg pr-10 px-4 py-3 text-gray-500 cursor-not-allowed" />
          </div>
          <p className="text-xs text-gray-600 mt-1">لا يمكن تغيير البريد الإلكتروني</p>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">رقم الهاتف</label>
          <div className="relative">
            <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-brand-panel border border-brand-border rounded-lg pr-10 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-accent" />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">تاريخ الميلاد</label>
          <div className="relative">
            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} className="w-full bg-brand-panel border border-brand-border rounded-lg pr-10 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-accent" />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">الجنس</label>
          <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full bg-brand-panel border border-brand-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-accent">
            <option value="">اختر</option>
            <option value="ذكر">ذكر</option>
            <option value="أنثى">أنثى</option>
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">الوسوم الشخصية</label>
          <div className="flex flex-wrap gap-2">
            {LABEL_OPTIONS.map((label) => (
              <button key={label} type="button" onClick={() => toggleLabel(label)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                  labels.includes(label)
                    ? (LABEL_COLORS[label] || "bg-brand-accent/30 text-brand-accent border-brand-accent/50")
                    : "border-brand-border/60 text-gray-500 hover:border-brand-accent/30 hover:text-gray-300"
                }`}
              >
                {labels.includes(label) ? "✓ " : ""}{label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">نبذة</label>
          <div className="relative">
            <Info className="absolute right-3 top-3 w-4 h-4 text-gray-500" />
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="w-full bg-brand-panel border border-brand-border rounded-lg pr-10 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-accent resize-none" />
          </div>
        </div>

        {message && (
          <div className={`p-3 rounded-lg text-sm ${message.includes("بن") ? "bg-green-500/10 text-green-400 border border-green-500/30" : "bg-red-500/10 text-red-400 border border-red-500/30"}`}>
            {message}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="glow-button flex-1 disabled:opacity-50">
            {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
          </button>
          <button type="button" onClick={() => router.push("/profile")} className="px-6 py-3 rounded-lg border border-brand-border text-gray-300 hover:bg-brand-hover transition">
            إلغاء
          </button>
        </div>
      </form>
    </div>
  );
}
