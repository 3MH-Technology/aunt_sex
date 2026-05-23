"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Coins, TrendingUp, Gift, Users, Radio, MessageCircle, Eye, Wallet, ArrowUpRight, Clock, Check, X } from "lucide-react";
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
  community_join: "انضمام لمجتمع",
  watch: "مشاهدة فيديو",
  chat: "دردشة",
  stream: "مشاهدة بث",
  gift_sent: "إرسال هدية",
  gift_received: "استقبال هدية",
  conversion: "تحويل نقاط",
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
    <div className="max-w-4xl mx-auto">
      <div className="card-adult p-6 mb-6 text-center bg-gradient-to-br from-brand-card to-brand-dark border-brand-accent/20">
        <Coins className="w-12 h-12 mx-auto mb-3 text-yellow-400" />
        <h1 className="text-2xl font-bold mb-1">نظام النقاط</h1>
        <p className="text-gray-400 text-sm mb-4">اكسب النقاط من المشاهدة والمشاركة، وحولها إلى فلوس حقيقية!</p>
        <div className="text-5xl font-bold text-yellow-400 mb-2">{points.toLocaleString()}</div>
        <p className="text-gray-500 text-sm">نقطة</p>
        <div className="flex justify-center gap-3 mt-4">
          <button onClick={() => setShowConvert(!showConvert)} disabled={points < 1000}
            className="glow-button flex items-center gap-2 px-5 py-2 text-sm disabled:opacity-50">
            <Wallet className="w-4 h-4" /> تحويل إلى فلوس
          </button>
          <Link href="/communities" className="glow-button flex items-center gap-2 px-5 py-2 text-sm">
            <Users className="w-4 h-4" /> المجتمعات
          </Link>
        </div>
      </div>

      {showConvert && (
        <div className="card-adult p-5 mb-6 border-brand-accent/30">
          <h3 className="font-bold mb-3 flex items-center gap-2"><Wallet className="w-4 h-4 text-brand-accent" /> تحويل النقاط</h3>
          <div className="space-y-3">
            <p className="text-sm text-gray-400">1000 نقطة = $1.00 (بعد خصم عمولة 10%)</p>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">عدد النقاط</label>
              <input type="number" value={convertPoints} onChange={(e) => setConvertPoints(Math.min(Number(e.target.value) || 0, maxConvert))}
                min={1000} max={maxConvert} step={1000}
                className="input-field w-full" />
              <p className="text-xs text-gray-600 mt-1">الحد الأقصى: {maxConvert.toLocaleString()} نقطة</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">عنوان المحفظة</label>
              <input value={walletAddress} onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="USDT TRC20 address..." className="input-field w-full font-mono text-xs" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">الشبكة</label>
              <select value={walletNetwork} onChange={(e) => setWalletNetwork(e.target.value)}
                className="input-field w-full">
                <option value="USDT (TRC20)">USDT (TRC20)</option>
                <option value="USDT (ERC20)">USDT (ERC20)</option>
                <option value="USDT (BEP20)">USDT (BEP20)</option>
                <option value="BTC">Bitcoin</option>
                <option value="ETH">Ethereum</option>
              </select>
            </div>
            {convertPoints >= 1000 && walletAddress && (
              <div className="bg-brand-panel rounded-lg p-3 text-sm space-y-1">
                <p className="flex justify-between"><span className="text-gray-400">المبلغ</span><span>${(convertPoints / 1000).toFixed(2)}</span></p>
                <p className="flex justify-between"><span className="text-gray-400">عمولة المنصة (10%)</span><span className="text-red-400">-${(convertPoints / 10000).toFixed(2)}</span></p>
                <p className="flex justify-between font-bold border-t border-brand-border pt-1"><span>ستستلم</span><span className="text-green-400">${(convertPoints / 1000 * 0.9).toFixed(2)}</span></p>
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={handleConvert} disabled={converting || convertPoints < 1000 || !walletAddress}
                className="glow-button flex-1 disabled:opacity-50">
                {converting ? "..." : "تأكيد التحويل"}
              </button>
              <button onClick={() => setShowConvert(false)} className="px-4 py-2 rounded-lg border border-brand-border text-gray-300 hover:bg-brand-hover">
                إلغاء
              </button>
            </div>
            {convertResult?.error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-sm">{convertResult.error}</div>
            )}
            {convertResult?.amount && (
              <div className="bg-green-500/10 border border-green-500/30 text-green-400 p-3 rounded-lg text-sm flex items-center gap-2">
                <Check className="w-4 h-4" /> تم التحويل! ستستلم ${convertResult.amount.toFixed(2)} عبر {convertResult.network}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="card-adult p-5">
        <h2 className="font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-brand-accent" />
          سجل النقاط
        </h2>
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Coins className="w-8 h-8 mx-auto mb-2 text-gray-600" />
            <p className="text-sm">لا توجد حركات بعد</p>
            <p className="text-xs text-gray-600 mt-1">انضم للمجتمعات وشاهد البثوث لتربح النقاط!</p>
          </div>
        ) : (
          <div className="space-y-1">
            {transactions.map((t) => {
              const Icon = REASON_ICONS[t.reason] || Coins;
              return (
                <div key={t.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-brand-hover transition">
                  <div className="w-9 h-9 rounded-full bg-brand-accent/10 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{REASON_LABELS[t.reason] || t.reason}</p>
                    <p className="text-xs text-gray-600 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(t.createdAt).toLocaleDateString("ar-SA")}
                    </p>
                  </div>
                  <span className={`text-sm font-bold ${t.amount > 0 ? "text-green-400" : "text-red-400"}`}>
                    {t.amount > 0 ? "+" : ""}{t.amount.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="card-adult p-5 mt-4">
        <h2 className="font-bold mb-3 flex items-center gap-2"><Gift className="w-5 h-5 text-brand-accent" /> طرق ربح النقاط</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Users, label: "انضمام لمجتمع", points: "+10", color: "text-blue-400" },
            { icon: MessageCircle, label: "رسالة في الشات", points: "+1", color: "text-brand-accent" },
            { icon: Eye, label: "مشاهدة بث", points: "+5/دقيقة", color: "text-green-400" },
            { icon: Gift, label: "استقبال هدية", points: "+قيمة الهدية", color: "text-yellow-400" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="bg-brand-panel rounded-lg p-3 text-center">
                <Icon className={`w-5 h-5 mx-auto mb-1 ${item.color}`} />
                <p className="text-xs text-gray-400">{item.label}</p>
                <p className="text-sm font-bold text-yellow-400">{item.points}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
