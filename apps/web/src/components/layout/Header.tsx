"use client";
import { useRouter } from "next/navigation";
import { Search, Upload, LogIn, User, Menu, X, Heart, Coins, Wallet } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import Image from "next/image";
import Link from "next/link";
import MobileMenu from "./MobileMenu";

export default function Header() {
  const [q, setQ] = useState("");
  const [showMobile, setShowMobile] = useState(false);
  const [coinBalance, setCoinBalance] = useState<number | null>(null);
  const [pointsBalance, setPointsBalance] = useState<number | null>(null);
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetch("/api/coins/balance").then((r) => r.json()).then((d) => setCoinBalance(d.coins)).catch(() => {});
      fetch("/api/points").then((r) => r.json()).then((d) => setPointsBalance(d.points)).catch(() => {});
    }
  }, [isAuthenticated]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) {
      router.push(`/search?q=${encodeURIComponent(q.trim())}`);
      setShowMobile(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 flex items-center justify-between bg-brand-black/90 backdrop-blur-lg px-4 py-2.5 border-b border-brand-accent/20">
        <div className="flex items-center gap-3">
          <button onClick={() => setShowMobile(!showMobile)} className="lg:hidden text-white hover:text-brand-accent">
            {showMobile ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Aunt sex" className="w-8 h-8 rounded-xl shadow-glow object-cover" />
            <span className="text-lg font-bold hidden sm:inline neon-text">Aunt sex</span>
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 max-w-xl mx-2 md:mx-4">
          <div className="relative">
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ابحث ومتع زبك..."
              className="w-full bg-brand-panel border border-brand-accent/20 rounded-full py-2 px-4 pr-10 text-sm text-white placeholder-gray-500 focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/30 transition-all"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </form>

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              {coinBalance !== null && (
                <Link href="/pricing#coins" className="hidden sm:flex items-center gap-1.5 text-sm text-yellow-400 bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-3 py-1.5 transition-all hover:bg-yellow-500/20">
                  <Coins className="w-4 h-4" />
                  <span className="font-semibold tabular-nums">{coinBalance.toLocaleString()}</span>
                </Link>
              )}
              {pointsBalance !== null && (
                <Link href="/points" className="hidden sm:flex items-center gap-1.5 text-sm text-blue-400 bg-blue-500/10 border border-blue-500/30 rounded-lg px-3 py-1.5 transition-all hover:bg-blue-500/20">
                  <Wallet className="w-4 h-4" />
                  <span className="font-semibold tabular-nums">{pointsBalance.toLocaleString()}</span>
                </Link>
              )}
              <Link href="/upload" className="hidden sm:flex items-center gap-1.5 text-sm text-gray-300 hover:text-brand-accent bg-brand-panel border border-brand-accent/20 rounded-lg px-3 py-2 transition-all">
                <Upload className="w-4 h-4" />
                <span className="hidden md:inline">رفع</span>
              </Link>
              <Link href="/profile">
                {user?.image ? (
                  <Image src={user.image} width={34} height={34} className="rounded-full ring-2 ring-brand-accent/30" alt="avatar" />
                ) : (
                  <div className="w-[34px] h-[34px] bg-gradient-to-br from-brand-accent to-brand-accent-pink rounded-full flex items-center justify-center text-sm font-bold text-white shadow-glow">
                    {user?.name?.[0] || "U"}
                  </div>
                )}
              </Link>
            </>
          ) : (
            <Link href="/auth/signin" className="glow-button flex items-center gap-2 px-4 py-2 text-sm">
              <LogIn className="w-4 h-4" />
              <span className="hidden sm:inline">دخول</span>
            </Link>
          )}
        </div>
      </header>

      {showMobile && <MobileMenu onClose={() => setShowMobile(false)} />}
    </>
  );
}
