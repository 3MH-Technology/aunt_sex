"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Coins, TrendingUp, Gift, Users, Radio, MessageCircle, Eye, Wallet, Clock, Check, X } from "lucide-react";
import Link from "next/link";

interface Transaction {
  id: string;
  amount: number;
  reason: string;
  referenceId: string | null;
  createdAt: string;
}

const REASON_ICONS: Record<string, any> = {
  community_join: Users,
  watch: Eye,
  chat: MessageCircle,
  stream: Radio,
  gift_sent: Gift,
  gift_received: Gift,
  conversion: Wallet,
};

const REASON_LABELS: Record<string, string> = {
  community_join: "انضممت لمجتمع شهوة جديد",
  watch: "شاهدت فيديو مثير",
  chat: "تفاعلت في الدردشة الساخنة",
  stream: "حضرت بثاً مباشراً",
  gift_sent: "أرسلت هدية لصانع اللذة",
  gift_received: "استقبلت هدية من معجب",
  conversion: "حوّلت نقاطك إلى مكافأة",
};

export default function PointsPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [points, setPoints] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showConvert, setShowConvert] = useState(false);
  const [convertPoints, setConvertPoints] = useState(1000);
  const [walletAddress, setWalletAddress] = useState("");
  const [walletNetwork, setWalletNetwork] = useState("USDT (TRC20)");
  const [converting, setConverting] = useState(false);
  const [convertResult, setConvertResult] = useState<any>(null);

  useEffect(() => {
    if (!isAuthenticated) { router.push("/auth/signin"); return; }
    fetch("/api/points").then((r) => r.json()).then((d) => setPoints(d.points || 0)).catch(() => {});
    fetch("/api/points/history").then((r) => r.json()).then(setTransactions).catch(() => {});
  }, [isAuthenticated]);

  const handleConvert = async () => {
    if (convertPoints < 1000 || !walletAddress || converting) return;
    setConverting(true);
    setConvertResult(null);
    try {
      const res = await fetch("/api/points/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ points: convertPoints, walletAddress, walletNetwork }),
      });
      const data = await res.json();
      if (data.success) {
        setConvertResult(data);
        setPoints((p) => p - convertPoints);
        setShowConvert(false);
      } else {
        setConvertResult({ error: data.error || "حدث خطأ" });
      }
    } catch {
      setConvertResult({ error: "حدث خطأ في الاتصال" });
    }
    setConverting(false);
  };

  if (!isAuthenticated) return null;

  const maxConvert = Math.floor(points / 1000) * 1000;

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">

      {/* نافذة التحويل */}
      {showConvert && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card-adult w-full max-w-md p-7 shadow-glow space-y-4 animate-fade-in">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-extrabold neon-text flex items-center gap-2">
                <Wallet className="w-5 h-5 text-brand-accent" />
                حوّل نقاطك إلى مكافأة نقدية
              </h3>
              <button onClick={() => setShowConvert(false)} className="text-gray-500 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-gray-400 bg-brand-accent/10 border border-brand-accent/20 rounded-xl px-3 py-2">
              💡 كل 1000 نقطة = $1.00 (بعد خصم عمولة المنصة 10%)
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block font-semibold">عدد النقاط للتحويل</label>
                <input
                  type="number"
                  value={convertPoints}
                  onChange={(e) => setConvertPoints(Math.min(Number(e.target.value) || 0, maxConvert))}
                  min={1000}
                  max={maxConvert}
                  step={1000}
                  className="input-field w-full"
                />
                <p className="text-xs text-gray-600 mt-1">رصيدك المتاح للتحويل: <span className="text-yellow-400 font-bold">{maxConvert.toLocaleString()}</span> نقطة</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block font-semibold">عنوان محفظتك الرقمية</label>
                <input
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  placeholder="USDT TRC20 address..."
                  className="input-field w-full font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block font-semibold">شبكة الاستلام</label>
                <select value={walletNetwork} onChange={(e) => setWalletNetwork(e.target.value)} className="input-field w-full">
                  <option value="USDT (TRC20)">USDT (TRC20)</option>
                  <option value="USDT (ERC20)">USDT (ERC20)</option>
                  <option value="USDT (BEP20)">USDT (BEP20)</option>
                  <option value="BTC">Bitcoin</option>
                  <option value="ETH">Ethereum</option>
                </select>
              </div>
              {convertPoints >= 1000 && walletAddress && (
                <div className="bg-brand-panel rounded-xl p-3 text-sm space-y-1.5 border border-brand-border/40">
                  <p className="flex justify-between"><span className="text-gray-400">المبلغ الإجمالي</span><span className="font-bold">${(convertPoints / 1000).toFixed(2)}</span></p>
                  <p className="flex justify-between"><span className="text-gray-400">عمولة المنصة (10%)</span><span className="text-red-400 font-bold">-${(convertPoints / 10000).toFixed(2)}</span></p>
                  <p className="flex justify-between font-bold border-t border-brand-border pt-1.5 text-base"><span>ستستلم فعلياً</span><span className="text-green-400">${(convertPoints / 1000 * 0.9).toFixed(2)}</span></p>
                </div>
              )}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={handleConvert}
                  disabled={converting || convertPoints < 1000 || !walletAddress}
                  className="glow-button flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {converting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Coins className="w-4 h-4" />}
                  {converting ? "جاري التحويل..." : "تأكيد سحب المكافأة"}
                </button>
                <button onClick={() => setShowConvert(false)} className="px-4 py-2 rounded-xl border border-brand-border text-gray-300 hover:bg-brand-hover transition">
                  إلغاء
                </button>
              </div>
            </div>
            {convertResult?.error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-sm flex items-center gap-2">
                <X className="w-4 h-4 shrink-0" /> {convertResult.error}
              </div>
            )}
            {convertResult?.amount && (
              <div className="bg-green-500/10 border border-green-500/30 text-green-400 p-3 rounded-xl text-sm flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" /> تم التحويل بنجاح! ستستلم ${convertResult.amount.toFixed(2)} عبر {convertResult.network}
              </div>
            )}
          </div>
        </div>
      )}

      {/* بطاقة الرصيد الرئيسية */}
      <div className="card-adult p-8 mb-6 text-center relative overflow-hidden">
        <div className="absolute -top-8 -right-8 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-brand-accent/10 rounded-full blur-3xl" />
        <div className="relative z-10">
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow animate-pulse">
            <Coins className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold mb-1 neon-text">نقاطك يا وحش — كلها لك</h1>
          <p className="text-gray-400 text-sm mb-5">اتفرج، اتكلم، وابعث هدايا… وحوّل نقاطك لفلوس</p>
          <div className="text-6xl font-black text-yellow-400 mb-1 tabular-nums">{points.toLocaleString()}</div>
          <p className="text-gray-500 text-sm mb-6">نقطة في رصيدك</p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <button
              onClick={() => setShowConvert(!showConvert)}
              disabled={points < 1000}
              className="glow-button flex items-center justify-center gap-2 px-6 py-2.5 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Wallet className="w-4 h-4" /> سحب المكافأة النقدية
            </button>
            <Link href="/communities" className="glow-button-outline flex items-center justify-center gap-2 px-6 py-2.5 text-sm">
              <Users className="w-4 h-4" /> اكسب المزيد الآن
            </Link>
          </div>
          {points < 1000 && (
            <p className="text-xs text-gray-600 mt-3">تحتاج 1,000 نقطة على الأقل لتتمكن من السحب</p>
          )}
        </div>
      </div>

      {/* طرق ربح النقاط */}
      <div className="card-adult p-5 mb-6">
        <h2 className="section-title">طرق كسب النقاط وتعظيم الأرباح</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Users, label: "انضمام لمجتمع", points: "+10 نقطة", color: "text-blue-400", bg: "bg-blue-500/10" },
            { icon: MessageCircle, label: "دردشة ساخنة", points: "+1 نقطة/رسالة", color: "text-brand-accent", bg: "bg-brand-accent/10" },
            { icon: Eye, label: "مشاهدة بث مباشر", points: "+5 نقطة/دقيقة", color: "text-green-400", bg: "bg-green-500/10" },
            { icon: Gift, label: "استلام هدية", points: "+قيمة الهدية", color: "text-yellow-400", bg: "bg-yellow-500/10" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className={`${item.bg} border border-brand-border/30 rounded-2xl p-4 text-center transition-all hover:scale-[1.03] hover:shadow-soft cursor-default`}>
                <div className="w-10 h-10 rounded-xl bg-black/20 flex items-center justify-center mx-auto mb-2">
                  <Icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <p className="text-xs text-gray-300 font-medium">{item.label}</p>
                <p className="text-sm font-extrabold text-yellow-400 mt-1">{item.points}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* سجل النقاط */}
      <div className="card-adult p-5">
        <h2 className="section-title">سجل نشاطك وإثارتك</h2>
        {transactions.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <Coins className="w-10 h-10 mx-auto mb-3 text-gray-700" />
            <p className="text-sm font-medium">خزانتك فارغة من الحركات حتى الآن</p>
            <p className="text-xs text-gray-600 mt-1">انضم للمجتمعات وشاهد البثوث الساخنة لتبدأ رحلة كسب النقاط!</p>
          </div>
        ) : (
          <div className="space-y-1">
            {transactions.map((t) => {
              const Icon = REASON_ICONS[t.reason] || Coins;
              return (
                <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-brand-hover transition group cursor-default">
                  <div className="w-10 h-10 rounded-full bg-brand-accent/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Icon className="w-4 h-4 text-gray-400 group-hover:text-brand-accent transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{REASON_LABELS[t.reason] || t.reason}</p>
                    <p className="text-xs text-gray-600 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {new Date(t.createdAt).toLocaleDateString("ar-SA")}
                    </p>
                  </div>
                  <span className={`text-sm font-extrabold tabular-nums ${t.amount > 0 ? "text-green-400" : "text-red-400"}`}>
                    {t.amount > 0 ? "+" : ""}{t.amount.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
