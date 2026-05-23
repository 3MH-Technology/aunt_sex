"use client";
import { useEffect } from "react";
import Link from "next/link";
import { Home, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-brand-black flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">!</span>
        </div>
        <h1 className="text-3xl font-bold mb-3">حدث خطأ غير متوقع</h1>
        <p className="text-gray-400 mb-8">
          عذراً، حدث خطأ أثناء تحميل هذه الصفحة. حاول مرة أخرى أو ارجع للرئيسية.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="glow-button inline-flex items-center justify-center gap-2 px-6 py-3"
          >
            <RefreshCw className="w-5 h-5" />
            إعادة المحاولة
          </button>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-brand-border text-gray-300 hover:bg-brand-hover transition"
          >
            <Home className="w-5 h-5" />
            العودة للرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}
