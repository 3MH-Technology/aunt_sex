"use client";
import { useRef, useState } from "react";
import { Upload, X, Film, Tag, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

export default function UploadVideoPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  if (isLoading) {
    return <div className="min-h-[60vh] flex items-center justify-center"><div className="w-8 h-8 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (!isAuthenticated) {
    router.push("/auth/signin");
    return null;
  }

  const handleUpload = async () => {
    if (!file || !title) return;
    setUploading(true);
    setProgress(5);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    formData.append("description", description);
    formData.append("tags", JSON.stringify(tags.split(",").map((t) => t.trim()).filter(Boolean)));

    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        setProgress(Math.min(90, Math.round((e.loaded / e.total) * 100)));
      }
    };
    xhr.onload = () => {
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText);
        setProgress(100);
        setSuccess(true);
        setVideoUrl(`/video/${data.videoId}`);
      }
      setUploading(false);
    };
    xhr.onerror = () => setUploading(false);
    xhr.open("POST", "/api/videos/upload");
    xhr.send(formData);
  };

  if (success) {
    return (
      <div className="max-w-lg mx-auto pt-16 text-center">
        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-400" />
        </div>
        <h2 className="text-2xl font-bold mb-2">تم الرفع بنجاح! 🎉</h2>
        <p className="text-gray-400 mb-8">فيديوك قيد المعالجة سيظهر قريباً للمشاهدين</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a href={videoUrl} className="glow-button inline-flex items-center gap-2 px-6">
            <Film className="w-5 h-5" /> مشاهدة الفيديو
          </a>
          <button onClick={() => { setSuccess(false); setFile(null); setTitle(""); setDescription(""); setTags(""); setProgress(0); }}
            className="glow-button-outline">
            رفع فيديو آخر
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pt-4">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Upload className="w-6 h-6 text-brand-accent" /> رفع فيديو جديد
      </h1>

      <div className="card-glass p-6">
        <input ref={fileRef} type="file" accept="video/*" className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] || null)} />

        <div onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-brand-border/60 rounded-xl p-10 text-center cursor-pointer hover:border-brand-accent/50 transition-all group">
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <Film className="w-8 h-8 text-brand-accent" />
              <div className="text-right">
                <p className="text-white font-semibold">{file.name}</p>
                <p className="text-gray-500 text-sm">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
              </div>
              <X className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer"
                onClick={(e) => { e.stopPropagation(); setFile(null); }} />
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-brand-accent/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Upload className="w-8 h-8 text-brand-accent" />
              </div>
              <p className="text-gray-300 font-semibold">اسحب الفيديو أو اضغط للاختيار</p>
              <p className="text-gray-600 text-sm mt-1">MP4, WebM, MOV — حد أقصى 2GB</p>
            </div>
          )}
        </div>
      </div>

      <div className="card-glass p-6 mt-4 space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1.5 font-semibold">عنوان الفيديو *</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="أضف عنواناً..." className="input-field" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1.5 font-semibold">الوصف</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="أضف وصفاً..." rows={3} className="input-field resize-none" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1.5 font-semibold">الوسوم (tags)</label>
          <div className="relative">
            <Tag className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input type="text" value={tags} onChange={(e) => setTags(e.target.value)}
              placeholder="سكس, نيك, طيز, شرموطة, محارم, مصري (مفصولة بفواصل)" className="input-field pr-10" />
          </div>
        </div>
      </div>

      {progress > 0 && (
        <div className="mt-4 card-glass p-4">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>{uploading ? "جاري الرفع..." : "تمت المعالجة"}</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-brand-border/40 rounded-full h-2 overflow-hidden">
            <div className="bg-brand-accent h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      <button onClick={handleUpload} disabled={!file || !title || uploading}
        className="glow-button mt-6 w-full text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
        {uploading ? (
          <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> جاري الرفع...</>
        ) : (
          <><Upload className="w-5 h-5" /> رفع الفيديو</>
        )}
      </button>
    </div>
  );
}
