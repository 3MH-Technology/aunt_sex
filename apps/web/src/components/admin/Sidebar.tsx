import Link from "next/link";
import { Home, Upload, Film, Heart, Shield, Users } from "lucide-react";

export default function AdminSidebar() {
  return (
    <aside className="w-64 bg-brand-dark/95 border-l border-brand-accent/20 p-4">
      <Link href="/admin" className="flex items-center gap-2 mb-8 px-2">
        <div className="w-8 h-8 bg-gradient-to-br from-brand-accent to-brand-accent-pink rounded-xl flex items-center justify-center shadow-glow">
          <Heart className="w-4 h-4 fill-white" />
        </div>
        <span className="font-bold">Admin</span>
      </Link>
      <nav className="space-y-1">
        <Link href="/admin" className="nav-link">
          <Home className="w-5 h-5" /> لوحة التحكم
        </Link>
        <Link href="/admin/upload" className="nav-link">
          <Upload className="w-5 h-5" /> رفع فيديو
        </Link>
        <Link href="/admin/videos" className="nav-link">
          <Film className="w-5 h-5" /> كل الفيديوهات
        </Link>
        <Link href="/admin/users" className="nav-link">
          <Users className="w-5 h-5" /> المستخدمين
        </Link>
        <Link href="/admin/fraud" className="nav-link">
          <Shield className="w-5 h-5" /> مكافحة الاحتيال
        </Link>
      </nav>
    </aside>
  );
}
