"use client";
import { useState, useEffect } from "react";
import { Check, Crown, Sparkles, Lock, Eye, Download, Star, Zap, Coins, Gift } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

const plans = [
  {
    name: "مبتدئ مجاني",
    price: "0",
    period: "شهر",
    features: [
      "تذوق أولي للمشاهد المثيرة الأساسية",
      "دقة عادية 720p فقط",
      "إعلانات مزعجة تعيق لحظات متعتك",
      "قائمة حفظ الرغبات الأساسية"
    ],
    cta: "تصفّح مجاناً الآن",
    popular: false,
    icon: Eye,
  },
  {
    name: "VIP الملكية الشهرية",
    price: "9.99",
    period: "شهر",
    features: [
      "مشاهدة مستمرة بلا فواصل أو إعلانات تعكر مزاجك",
      "دقة فائقة النقاء 1080p + 4K تكشف كل تفصيل",
      "تحميل فوري للمشاهد الساخنة بجهازك للرجوع لها دائماً",
      "الولوج الكامل لمشاهد VIP الحصرية شديدة السخونة والندرة",
      "دردشة حميمة وخاصة جداً مع العارضات وصناع اللذة",
      "شارة VIP ملوكية ذهبية تمنحك هيبة وتوقيراً في الشات",
      "إخطار فوري فور صدور أي حصريات جديدة للعارضات"
    ],
    cta: "أطلق سراح رغبتك الآن",
    popular: true,
    icon: Star,
  },
  {
    name: "VIP النخبة السنوية",
    price: "99.99",
    period: "سنة",
    features: [
      "امتلاك جميع مزايا VIP الشهرية الفاخرة بلا حدود",
      "توفير ملوكي 17% من قيمة رغبتك السنوية",
      "مشاهد فائقة السرية والخصوصية غير متاحة لأي رتبة أخرى",
      "أولوية مطلقة لطلب أفلام مخصصة ومصممة لنزواتك الخاصة",
      "دعم فني شخصي وخاص 24/7 لتلبية متطلبات متعتك"
    ],
    cta: "احجز مكانك في النخبة سنوياً",
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
    <div className="max-w-5xl mx-auto py-12 px-4 animate-fade-in">
      <div className="text-center mb-12">
        <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-glow animate-pulse">
          <Crown className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold mb-3 neon-text">يا وحش… VIP عشان تفرك براحتك</h1>
        <p className="text-gray-300 text-lg max-w-xl mx-auto leading-relaxed">
          اشترك وشيل الإعلانات — سكس ونيك 4K، تحميل، ومحارم وشرموطات VIP ما حد يشوفها غيرك.
        </p>
        <div className="flex items-center justify-center gap-6 mt-6 text-sm text-gray-400 flex-wrap">
          <span className="flex items-center gap-1.5"><Lock className="w-4 h-4 text-yellow-500" /> دفع بالعملات الرقمية</span>
          <span className="flex items-center gap-1.5"><Zap className="w-4 h-4 text-brand-accent" /> سرية مطلقة بدون KYC</span>
          <span className="flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-blue-400" /> خصوصية كاملة مشفرة</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        {plans.map((plan) => {
          const Icon = plan.icon;
          return (
            <div key={plan.name} className={`card-adult p-6 ${plan.popular ? "border-brand-accent shadow-glow !border-brand-accent/60" : ""} relative`}>
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-brand-accent to-brand-accent-pink text-white text-xs px-4 py-1 rounded-full font-semibold shadow-glow animate-bounce">
                  الأكثر طلباً
                </span>
              )}
              <div className="flex items-center gap-3 mb-4">
                <Icon className={`w-6 h-6 ${plan.popular ? "text-yellow-400 animate-pulse" : "text-gray-400"}`} />
                <h2 className="text-xl font-bold">{plan.name}</h2>
              </div>
              <div className="mb-4">
                <span className="text-4xl font-bold">${plan.price}</span>
                <span className="text-gray-400">/{plan.period}</span>
              </div>
              <ul className="space-y-3 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
                    <Check className="w-4 h-4 text-brand-accent shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <button onClick={() => handleSubscribe(plan.name)}
                disabled={loading === plan.name || plan.price === "0"}
                className={`w-full py-3.5 rounded-xl font-bold transition duration-300 ${plan.popular ? "btn-vip" : "border border-brand-border/60 text-gray-300 hover:bg-brand-hover hover:border-brand-accent/40"} disabled:opacity-50`}>
                {loading === plan.name ? "جاري فتح الأبواب..." : plan.cta}
              </button>
            </div>
          );
        })}
      </div>

      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow animate-pulse">
          <Coins className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-3.5xl font-extrabold mb-2 neon-text">عملات — هدايا للشرموطات</h2>
        <p className="text-gray-300 max-w-md mx-auto leading-relaxed">
          اشحن وابعث هدايا للباثات — خلّي الشرموطة تعرف إنك راجل كبير وعايز تتشرمط معاها.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-3xl mx-auto mb-16">
        {coinPackages.map((pkg) => (
          <div key={pkg.id} className="card-adult p-4 text-center hover:border-brand-accent/50 transition duration-300 group hover:-translate-y-1 hover:shadow-glow">
            <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition duration-300">
              <Coins className="w-6 h-6 text-yellow-400" />
            </div>
            <p className="text-xl font-extrabold text-white">{pkg.coins.toLocaleString()}</p>
            <p className="text-[10px] text-gray-500 mb-3">{pkg.name}</p>
            <p className="text-lg font-bold text-brand-accent mb-3">${pkg.price.toFixed(2)}</p>
            <button onClick={() => handleBuyCoins(pkg)}
              disabled={coinLoading === pkg.id}
              className="w-full py-2 rounded-xl text-xs font-bold border border-brand-accent/40 text-brand-accent hover:bg-brand-accent/10 disabled:opacity-50 transition duration-200">
              {coinLoading === pkg.id ? "شحن..." : "شحن الرصيد"}
            </button>
          </div>
        ))}
      </div>

      <div className="text-center mt-12 card-adult p-8 max-w-xl mx-auto hover:border-brand-accent/40 transition duration-300">
        <Gift className="w-9 h-9 mx-auto mb-3 text-brand-accent animate-bounce" />
        <h3 className="text-xl font-bold mb-1.5 neon-text">مبادلة الهدايا الحميمة</h3>
        <p className="text-gray-300 text-sm leading-relaxed">
          أرسل أرقى الهدايا التعبيرية للعارضين وصانعي الإثارة أثناء عروض البث المباشر. ادعم نزواتهم وعبر عن اهتمامك الحقيقي بالرموز الذهبية التي بحوزتك لتقيم معهم روابط خاصة جداً.
        </p>
      </div>
    </div>
  );
}

