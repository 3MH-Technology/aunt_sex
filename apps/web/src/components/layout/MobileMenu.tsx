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
  { href: "/", label: "البيت", icon: Home },
  { href: "/trending", label: "اللي بيتشرمطوا عليه", icon: TrendingUp },
  { href: "/new", label: "سكس جديد 🔥", icon: Clock },
  { href: "/top-rated", label: "أحلى نيك", icon: Star },
  { href: "/categories", label: "أقسام السكس", icon: Play },
  { href: "/channels", label: "شرموطات", icon: Star },
  { href: "/live", label: "لايف سكس", icon: Radio },
  { href: "/chat", label: "شات نيك", icon: MessageCircle },
  { href: "/communities", label: "مجتمعات", icon: Users },
  { href: "/pricing", label: "VIP", icon: Crown },
  { href: "/pricing#coins", label: "عملات", icon: Coins },
];

const userLinks = [
  { href: "/watchlist", label: "سكس محفوظ", icon: List },
  { href: "/history", label: "إيه اللي فركت عليه", icon: History },
  { href: "/points", label: "نقاطي", icon: Wallet },
  { href: "/upload", label: "ارفع سكس", icon: Upload },
  { href: "/profile", label: "حسابي", icon: User },
];

export default function MobileMenu({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();

  return (
    <div className="fixed inset-0 z-30 lg:hidden" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <nav
        className="absolute right-0 top-14 bottom-0 w-72 bg-gradient-to-b from-brand-dark to-brand-black border-l border-brand-accent/25 p-4 overflow-y-auto animate-slide-up shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-xs text-brand-accent/80 px-3 mb-2 font-bold">عايز تروح فين يا وحش؟</p>
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
            <p className="text-xs text-brand-accent/80 px-3 mb-2 font-bold">حسابك يا كبير</p>
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
            <LogOut className="w-5 h-5" /> <span>اطلع يا نزوح</span>
          </button>
        ) : (
          <Link href="/auth/signin" onClick={onClose} className="nav-link-active">
            <LogIn className="w-5 h-5" /> <span>تعال اتشرمط</span>
          </Link>
        )}
      </nav>
    </div>
  );
}
