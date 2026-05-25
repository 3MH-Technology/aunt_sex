import Link from "next/link";
import { Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-brand-black flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="text-8xl font-bold text-brand-accent/30 mb-4">404</div>
        <h1 className="text-3xl font-bold mb-3 neon-text">يا كبير… الصفحة ضاعت</h1>
        <p className="text-gray-400 mb-8 leading-relaxed">
          مش لاقية اللي بتدور عليه. ارجع للبيت وأنا أوريك سكس ونيك على طول.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="glow-button inline-flex items-center justify-center gap-2 px-6 py-3">
            <Home className="w-5 h-5" />
            رجّعني للبيت
          </Link>
          <Link
            href="/categories"
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-brand-border text-gray-300 hover:bg-brand-hover transition"
          >
            <Search className="w-5 h-5" />
            أقسام السكس
          </Link>
        </div>
      </div>
    </div>
  );
}
