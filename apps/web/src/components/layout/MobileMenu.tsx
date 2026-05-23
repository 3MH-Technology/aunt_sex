"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "next-auth/react";
import {
  Home, TrendingUp, Clock, Star, Play, List, History,
  User, Upload, LogIn, LogOut, Crown, MessageCircle, Radio, Coins, Users, Wallet,
} from "lucide-react";

const links = [
  { href: "/", label: "الرئيسية", icon: Home },
  { href: "/trending", label: "الأكثر مشاهدة", icon: TrendingUp },
  { href: "/new", label: "جديد الإباحية", icon: Clock },
  { href: "/top-rated", label: "الأعلى تقييماً", icon: Star },
  { href: "/categories", label: "التصنيفات", icon: Play },
  { href: "/channels", label: "القنوات", icon: Star },
  { href: "/live", label: "البث المباشر", icon: Radio },
  { href: "/chat", label: "الشات العام", icon: MessageCircle },
  { href: "/communities", label: "المجتمعات", icon: Users },
  { href: "/pricing", label: "VIP", icon: Crown },
  { href: "/pricing#coins", label: "العملات", icon: Coins },
];

const userLinks = [
  { href: "/watchlist", label: "قائمة المشاهدة", icon: List },
  { href: "/history", label: "السجل", icon: History },
  { href: "/points", label: "النقاط", icon: Wallet },
  { href: "/upload", label: "رفع فيديو", icon: Upload },
  { href: "/profile", label: "الملف الشخصي", icon: User },
];

export default function MobileMenu({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();

  return (
    <div className="fixed inset-0 z-30 lg:hidden" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <nav
        className="absolute right-0 top-14 bottom-0 w-72 bg-brand-dark border-l border-brand-accent/20 p-4 overflow-y-auto animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-xs text-gray-600 px-3 mb-2 font-semibold tracking-wider">القائمة الرئيسية</p>
        {links.map((link) => {
          const Icon = link.icon;
          const active = pathname === link.href;
          return (
            <Link key={link.href} href={link.href} onClick={onClose}
              className={active ? "nav-link-active" : "nav-link"}>
              <Icon className="w-5 h-5" /> <span>{link.label}</span>
            </Link>
          );
        })}

        {isAuthenticated && (
          <>
            <div className="divider" />
            <p className="text-xs text-gray-600 px-3 mb-2 font-semibold tracking-wider">مكتبتي</p>
            {userLinks.map((link) => {
              const Icon = link.icon;
              const active = pathname === link.href;
              return (
                <Link key={link.href} href={link.href} onClick={onClose}
                  className={active ? "nav-link-active" : "nav-link"}>
                  <Icon className="w-5 h-5" /> <span>{link.label}</span>
                </Link>
              );
            })}
          </>
        )}

        <div className="divider" />
        {isAuthenticated ? (
          <button onClick={() => { signOut(); onClose(); }} className="nav-link w-full text-red-400 hover:text-red-300">
            <LogOut className="w-5 h-5" /> <span>تسجيل الخروج</span>
          </button>
        ) : (
          <Link href="/auth/signin" onClick={onClose} className="nav-link-active">
            <LogIn className="w-5 h-5" /> <span>تسجيل الدخول</span>
          </Link>
        )}
      </nav>
    </div>
  );
}
