"use client";
import Link from "next/link";
import { Heart, Flame, Star, TrendingUp, Lock, Eye, Play, Sparkles } from "lucide-react";

const categories = [
  { label: "سكس عربي", href: "/search?q=سكس+عربي", icon: Heart, color: "text-brand-accent", desc: "سكس مصري وعربي يخليك ما ترفع إيدك من الزبر" },
  { label: "نيك ساخن", href: "/search?q=نيك", icon: Flame, color: "text-orange-400", desc: "نيك جامد أوي… زي ما بتحب يا وحش" },
  { label: "محارم", href: "/search?q=محارم", icon: Lock, color: "text-purple-400", desc: "محارم وممنوعات… أنا فتحتهالك" },
  { label: "شرموطات", href: "/search?q=شرموطة", icon: Star, color: "text-yellow-400", desc: "شرموطات مصريات تموت عليك" },
  { label: "طيز وكس", href: "/search?q=طيز", icon: TrendingUp, color: "text-green-400", desc: "طيز كبيرة وكس مبلول… نار" },
  { label: "فضائح", href: "/search?q=مشاهير", icon: Eye, color: "text-blue-400", desc: "تسريبات وفضائح النجوم" },
  { label: "سحاق", href: "/search?q=سحاق", icon: Play, color: "text-pink-400", desc: "سحاق مصري يهيجك من أول دقيقة" },
  { label: "نيك جماعي", href: "/search?q=جماعي", icon: Flame, color: "text-red-400", desc: "جماعي… مش هتخرج بنفس المزاج" },
];

export default function HeroSection() {
  return (
    <div>
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-accent/30 via-brand-card to-brand-accent-pink/20 p-8 md:p-10 mb-8 border border-brand-accent/25 neon-border animate-fade-in">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,45,85,0.12),_transparent_55%)]" />
        <div className="relative z-10">
          <p className="inline-flex items-center gap-2 text-xs font-semibold text-brand-accent-pink mb-4 bg-white/5 border border-white/10 rounded-full px-3 py-1">
            <Sparkles className="w-3.5 h-3.5" />
            أيوه يا كبير… جاهز تتشرمط معانا؟ 🔥
          </p>
          <h1 className="text-3xl md:text-5xl font-extrabold mb-3 leading-tight">
            <span className="neon-text">Aunt Sex</span>
            <span className="block text-lg md:text-2xl font-bold text-white/90 mt-2">وكرتك السري… أنا شرموطتك على الشاشة</span>
          </h1>
          <p className="text-gray-300 text-sm md:text-base max-w-2xl leading-relaxed mb-1">
            رتبتلك كل حاجة تفرك عليها: سكس، نيك، محارم، شرموطات، طيز، كس، وبث مباشر. ادخل، اختار، وإضرب إفراج لحد ما تخلص… مجاناً وجودة تخليك ترجع كل ليلة يا نزوح.
          </p>
          <div className="flex flex-wrap gap-3 mt-7">
            <Link href="/new" className="glow-button flex items-center gap-2 text-sm md:text-base">
              <Play className="w-5 h-5 fill-white" /> يلا… ابدأ تفرك
            </Link>
            <Link href="/categories" className="glow-button-outline flex items-center gap-2 text-sm md:text-base">
              ورّيني السكس كله
            </Link>
          </div>
        </div>
        <div className="absolute -top-10 -left-10 w-48 h-48 bg-brand-accent/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-brand-accent-pink/20 rounded-full blur-3xl" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-8">
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <Link
              key={cat.label}
              href={cat.href}
              className="card-adult p-5 flex flex-col items-center gap-2.5 text-center hover:border-brand-accent/60 transition-all hover:-translate-y-1.5 hover:shadow-glow group cursor-pointer"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-accent/15 to-brand-accent-pink/10 flex items-center justify-center group-hover:scale-110 transition-all duration-300 ring-1 ring-brand-accent/20">
                <Icon className={`w-7 h-7 ${cat.color}`} />
              </div>
              <span className="text-sm font-bold text-white group-hover:text-brand-accent transition-colors">{cat.label}</span>
              <span className="text-[10px] text-gray-500 font-medium group-hover:text-gray-300 transition-colors leading-relaxed px-1">{cat.desc}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
