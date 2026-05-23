"use client";
import Link from "next/link";
import { Heart, Flame, Star, TrendingUp, Lock, Eye, Play } from "lucide-react";

const categories = [
  { label: "سكس عربي", href: "/search?q=سكس+عربي", icon: Heart, color: "text-brand-accent", desc: "أفلام عربية حصرية" },
  { label: "نيك", href: "/search?q=نيك", icon: Flame, color: "text-orange-400", desc: "أشرس النيك" },
  { label: "محارم", href: "/search?q=محارم", icon: Lock, color: "text-purple-400", desc: "ممنوع من العرض" },
  { label: "مصري", href: "/search?q=مصري", icon: Star, color: "text-yellow-400", desc: "إنتاج مصري" },
  { label: "خليجي", href: "/search?q=خليجي", icon: TrendingUp, color: "text-green-400", desc: "بنات الخليج" },
  { label: "مشاهير", href: "/search?q=مشاهير", icon: Eye, color: "text-blue-400", desc: "أفلام مشاهير" },
  { label: "سحاق", href: "/search?q=سحاق", icon: Play, color: "text-pink-400", desc: "بنات مع بنات" },
  { label: "جماعي", href: "/search?q=جماعي", icon: Flame, color: "text-red-400", desc: "مشاهد جماعية" },
];

export default function HeroSection() {
  return (
    <div>
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-accent/20 via-brand-card to-brand-accent-pink/10 p-8 mb-8 border border-brand-accent/20 neon-border">
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            <span className="neon-text">Aunt sex</span>
          </h1>
          <p className="text-gray-300 text-lg mb-1">أكبر موقع سكس عربي مجاني — كل ما تشتهيه في مكان واحد</p>
          <p className="text-gray-500 text-sm">آلاف الأفلام الحصرية — سكس عربي, نيك, محارم, مصري, خليجي والمزيد</p>
          <div className="flex gap-3 mt-6">
            <Link href="/new" className="glow-button flex items-center gap-2">
              <Play className="w-5 h-5" /> شاهد الآن
            </Link>
            <Link href="/categories" className="glow-button-outline flex items-center gap-2">
              التصنيفات
            </Link>
          </div>
        </div>
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-brand-accent/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-brand-accent-pink/10 rounded-full blur-3xl" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <Link
              key={cat.label}
              href={cat.href}
              className="card-adult p-4 flex flex-col items-center gap-2 text-center hover:border-brand-accent/40 transition-all hover:-translate-y-0.5 hover:shadow-card group"
            >
              <div className="w-12 h-12 rounded-xl bg-brand-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Icon className={`w-6 h-6 ${cat.color}`} />
              </div>
              <span className="text-sm font-bold text-gray-200">{cat.label}</span>
              <span className="text-[10px] text-gray-500">{cat.desc}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
