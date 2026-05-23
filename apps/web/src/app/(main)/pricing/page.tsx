"use client";
import { useState, useEffect } from "react";
import { Check, Crown, Sparkles, Lock, Eye, Download, Star, Zap, Coins, Gift } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

const plans = [
  {
    name: "مجاني",
    price: "0",
    period: "شهر",
    features: ["مشاهدة محدودة للفيديوهات", "جودة 720p", "إعلانات", "قائمة مشاهدة"],
    cta: "ابدأ مجاناً",
    popular: false,
    icon: Eye,
  },
  {
    name: "VIP شهري",
    price: "9.99",
    period: "شهر",
    features: ["مشاهدة بدون إعلانات", "جودة 1080p + 4K", "تحميل الفيديوهات", "محتوى VIP حصري", "دردشة خاصة مع المبدعين", "شارة VIP في الملف الشخصي", "إشعارات أولية"],
    cta: "اشترك الآن",
    popular: true,
    icon: Star,
  },
  {
    name: "VIP سنوي",
    price: "99.99",
    period: "سنة",
    features: ["كل مزايا VIP الشهري", "توفير 17%", "محتوى حصري جداً", "طلب محتوى مخصص", "دعم فني متميز 24/7"],
    cta: "اشترك سنوياً",
    popular: false,
    icon: Crown,
  },
];

interface CoinPkg {
  id: string;
  name: string;
  coins: number;
  price: number;
}

export default function PricingPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [coinPackages, setCoinPackages] = useState<CoinPkg[]>([]);
  const [coinLoading, setCoinLoading] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/coins/packages").then((r) => r.json()).then(setCoinPackages).catch(() => {});
  }, []);

  const handleSubscribe = async (plan: string) => {
    if (!isAuthenticated) { router.push("/auth/signin"); return; }
    setLoading(plan);
    try {
      const res = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch { alert("حدث خطأ. حاول مرة أخرى."); }
    finally { setLoading(null); }
  };

  const handleBuyCoins = async (pkg: CoinPkg) => {
    if (!isAuthenticated) { router.push("/auth/signin"); return; }
    setCoinLoading(pkg.id);
    try {
      const res = await fetch("/api/coins/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: pkg.id }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert(data.error || "حدث خطأ");
    } catch { alert("حدث خطأ"); }
    finally { setCoinLoading(null); }
  };

  return (
    <div className="max-w-5xl mx-auto py-12">
      <div className="text-center mb-12">
        <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow">
          <Crown className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold mb-3 neon-text">ارتقِ بمتعتك إلى مستوى جديد</h1>
        <p className="text-gray-400 text-lg">احصل على تجربة مشاهدة لا نهائية بدون إعلانات وبأعلى جودة</p>
        <div className="flex items-center justify-center gap-4 mt-4 text-sm text-gray-500">
          <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> دفع بالعملات الرقمية</span>
          <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> بدون KYC</span>
          <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" /> خصوصية كاملة</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        {plans.map((plan) => {
          const Icon = plan.icon;
          return (
            <div key={plan.name} className={`card-adult p-6 ${plan.popular ? "border-brand-accent shadow-glow !border-brand-accent/60" : ""} relative`}>
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-brand-accent to-brand-accent-pink text-white text-xs px-4 py-1 rounded-full font-semibold shadow-glow">
                  الأكثر طلباً
                </span>
              )}
              <div className="flex items-center gap-3 mb-4">
                <Icon className={`w-6 h-6 ${plan.popular ? "text-yellow-400" : "text-gray-400"}`} />
                <h2 className="text-xl font-bold">{plan.name}</h2>
              </div>
              <div className="mb-4">
                <span className="text-4xl font-bold">${plan.price}</span>
                <span className="text-gray-400">/{plan.period}</span>
              </div>
              <ul className="space-y-2 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                    <Check className="w-4 h-4 text-brand-accent shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <button onClick={() => handleSubscribe(plan.name)}
                disabled={loading === plan.name || plan.price === "0"}
                className={`w-full py-3 rounded-lg font-semibold transition ${plan.popular ? "btn-vip" : "border border-brand-border/60 text-gray-300 hover:bg-brand-hover"} disabled:opacity-50`}>
                {loading === plan.name ? "جاري..." : plan.cta}
              </button>
            </div>
          );
        })}
      </div>

      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow">
          <Coins className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-3xl font-bold mb-2">العملات الافتراضية</h2>
        <p className="text-gray-400">اشترِ العملات وأرسل الهدايا للمبدعين المفضلين لديك</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-3xl mx-auto">
        {coinPackages.map((pkg) => (
          <div key={pkg.id} className="card-adult p-4 text-center hover:border-brand-accent/40 transition">
            <Coins className="w-8 h-8 mx-auto mb-2 text-yellow-400" />
            <p className="text-xl font-bold">{pkg.coins.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mb-3">{pkg.name}</p>
            <p className="text-lg font-bold text-brand-accent mb-2">${pkg.price.toFixed(2)}</p>
            <button onClick={() => handleBuyCoins(pkg)}
              disabled={coinLoading === pkg.id}
              className="w-full py-2 rounded-lg text-sm font-semibold border border-brand-accent/40 text-brand-accent hover:bg-brand-accent/10 disabled:opacity-50">
              {coinLoading === pkg.id ? "..." : "اشتري"}
            </button>
          </div>
        ))}
      </div>

      <div className="text-center mt-12 card-adult p-6 max-w-xl mx-auto">
        <Gift className="w-8 h-8 mx-auto mb-2 text-brand-accent" />
        <h3 className="text-lg font-bold mb-1">نظام الهدايا</h3>
        <p className="text-gray-400 text-sm">أرسل الهدايا للمبدعين أثناء البث المباشر وادعمهم بالعملات التي اشتريتها</p>
      </div>
    </div>
  );
}
