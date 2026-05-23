"use client";
import { useRef, useState } from "react";
import { Upload, X } from "lucide-react";

export default function UploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [progress, setProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = () => {
    if (!file || !title) return;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        setProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.open("POST", "/api/videos/upload");
    xhr.send(formData);
  };

  return (
    <div>
      <input
        ref={fileRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      <div
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-brand-border rounded-xl p-12 text-center cursor-pointer hover:border-brand-accent transition"
      >
        {file ? (
          <div className="flex items-center gap-2">
            <span>{file.name}</span>
            <X
              className="w-5 h-5"
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
              }}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Upload className="w-10 h-10 text-gray-400" />
            <p className="mt-2 text-gray-400">اسحب الفيديو أو اضغط للاختيار</p>
          </div>
        )}
      </div>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="العنوان"
        className="w-full mt-4 bg-brand-panel border border-brand-border rounded-lg px-4 py-3 text-white"
      />
      {progress > 0 && (
        <div className="w-full bg-gray-700 rounded-full h-2 mt-4">
          <div className="bg-brand-accent h-2 rounded-full" style={{ width: `${progress}%` }} />
        </div>
      )}
      <button onClick={handleUpload} className="glow-button mt-6 w-full">
        بدء الرفع
      </button>
    </div>
  );
}
