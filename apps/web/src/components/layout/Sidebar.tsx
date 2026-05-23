"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  Home, TrendingUp, Clock, Star, Play, List, History,
  User, Upload, LogIn, LogOut, Crown, Heart, MessageCircle, Radio, Coins, Users, Wallet,
} from "lucide-react";
import { signOut } from "next-auth/react";

const mainLinks = [
  { href: "/", label: "الرئيسية", icon: Home },
  { href: "/trending", label: "الأكثر مشاهدة", icon: TrendingUp },
  { href: "/new", label: "جديد الإباحية", icon: Clock },
  { href: "/top-rated", label: "الأعلى تقييماً", icon: Star },
  { href: "/categories", label: "التصنيفات", icon: Play },
  { href: "/channels", label: "القنوات", icon: Heart },
  { href: "/live", label: "البث المباشر", icon: Radio },
  { href: "/chat", label: "الشات العام", icon: MessageCircle },
  { href: "/communities", label: "المجتمعات", icon: Users },
];

const userLinks = [
  { href: "/watchlist", label: "قائمة المشاهدة", icon: List },
  { href: "/history", label: "سجل المشاهدة", icon: History },
  { href: "/points", label: "النقاط", icon: Wallet },
  { href: "/upload", label: "رفع فيديو", icon: Upload },
  { href: "/profile", label: "الملف الشخصي", icon: User },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-brand-dark/95 border-l border-brand-accent/20 overflow-y-auto">
      <div className="p-4 border-b border-brand-accent/20">
        <Link href="/" className="flex items-center gap-2.5">
          <img src="/logo.png" alt="Aunt sex" className="w-8 h-8 rounded-xl shadow-glow object-cover" />
          <span className="text-xl font-bold tracking-tight neon-text">Aunt sex</span>
        </Link>
      </div>

      <nav className="flex flex-col gap-0.5 p-3">
        <p className="text-[10px] text-gray-600 px-4 mb-1 mt-1 font-semibold tracking-widest uppercase">تصفّح المحتوى</p>
        {mainLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link key={link.href} href={link.href} className={isActive ? "nav-link-active" : "nav-link"}>
              <Icon className="w-5 h-5" />
              <span>{link.label}</span>
            </Link>
          );
        })}

        {isAuthenticated && (
          <>
            <p className="text-[10px] text-gray-600 px-4 mb-1 mt-4 font-semibold tracking-widest uppercase">مكتبتي</p>
            {userLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link key={link.href} href={link.href} className={isActive ? "nav-link-active" : "nav-link"}>
                  <Icon className="w-5 h-5" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </>
        )}

        <div className="divider" />

        <Link href="/pricing" className="nav-link bg-gradient-to-r from-brand-accent/10 to-brand-accent-pink/5 border border-brand-accent/20 rounded-lg">
          <Crown className="w-5 h-5 text-yellow-400" />
          <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">VIP</span>
          <span className="text-[10px] text-brand-accent mr-auto">ادفع الآن</span>
        </Link>

        <Link href="/pricing#coins" className="nav-link">
          <Coins className="w-5 h-5 text-yellow-400" />
          <span className="text-yellow-400 font-semibold">العملات</span>
        </Link>

        {isAuthenticated ? (
          <button onClick={() => signOut()} className="nav-link w-full text-red-400 hover:text-red-300">
            <LogOut className="w-5 h-5" /> <span>تسجيل الخروج</span>
          </button>
        ) : (
          <Link href="/auth/signin" className="nav-link-active mt-1">
            <LogIn className="w-5 h-5" /> <span>تسجيل الدخول</span>
          </Link>
        )}
      </nav>
    </aside>
  );
}
