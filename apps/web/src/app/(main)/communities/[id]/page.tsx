"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Users, Crown, User, Plus, Check, Hash, Star, Coins } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const LABEL_COLORS: Record<string, string> = {
  "فحل": "bg-green-600/30 text-green-400 border-green-500/30",
  "سالب": "bg-pink-600/30 text-pink-400 border-pink-500/30",
  "ديوث": "bg-yellow-600/30 text-yellow-400 border-yellow-500/30",
};

export default function CommunityPage() {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser, isAuthenticated } = useAuth();
  const router = useRouter();
  const [community, setCommunity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    fetch(`/api/communities/${id}`)
      .then((r) => r.json())
      .then((data) => { setCommunity(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  const handleJoin = async () => {
    if (!isAuthenticated) { router.push("/auth/signin"); return; }
    setJoining(true);
    const res = await fetch(`/api/communities/${id}/members`, { method: "POST" });
    const data = await res.json();
    if (data.id) {
      setCommunity((prev: any) => ({
        ...prev,
        members: [...(prev?.members || []), data],
        _count: { members: (prev?._count?.members || 0) + 1 },
      }));
    }
    setJoining(false);
  };

  const isMember = community?.members?.some((m: any) => m.user?.id === (currentUser as any)?.id);
  const isOwner = community?.owner?.id === (currentUser as any)?.id;

  if (loading) return <div className="text-center py-20 text-gray-400"><div className="w-8 h-8 border-2 border-brand-accent border-t-transparent rounded-full animate-spin mx-auto" /></div>;
  if (!community) return <div className="text-center py-20 text-gray-400">المجتمع غير موجود</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card-adult p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-accent to-brand-accent-pink flex items-center justify-center text-2xl font-bold shadow-glow shrink-0">
            {community.name[0]}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h1 className="text-2xl font-bold">{community.name}</h1>
                <p className="text-gray-400 flex items-center gap-2 mt-1">
                  <Users className="w-4 h-4" /> {community._count.members} عضو
                  <span className="text-gray-600">•</span>
                  <Crown className="w-4 h-4 text-yellow-500" />
                  {community.owner.name}
                </p>
              </div>
              {!isMember ? (
                <button onClick={handleJoin} disabled={joining}
                  className="glow-button flex items-center gap-2 px-5 py-2 text-sm whitespace-nowrap disabled:opacity-50">
                  {joining ? "..." : <><Plus className="w-4 h-4" /> انضمام</>}
                </button>
              ) : (
                <span className="flex items-center gap-1.5 text-sm text-green-400 bg-green-500/10 border border-green-500/30 px-3 py-1.5 rounded-lg">
                  <Check className="w-4 h-4" /> عضو
                </span>
              )}
            </div>
            {community.description && (
              <p className="text-gray-400 mt-3">{community.description}</p>
            )}
          </div>
        </div>
      </div>

      <div className="card-adult p-5">
        <h2 className="font-bold mb-4 flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-400" />
          ترتيب الأعضاء حسب النقاط
        </h2>
        <div className="space-y-2">
          {community.members?.map((member: any, i: number) => {
            const labels: string[] = (() => { try { return JSON.parse(member.user?.labels || "[]"); } catch { return []; } })();
            return (
              <Link key={member.id} href={`/user/${member.user.id}`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-brand-hover transition group">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${i === 0 ? "bg-yellow-500/20 text-yellow-400" : i === 1 ? "bg-gray-400/20 text-gray-400" : i === 2 ? "bg-orange-500/20 text-orange-400" : "bg-brand-accent/10 text-gray-500"}`}>
                  {i + 1}
                </span>
                <div className="w-9 h-9 rounded-full bg-brand-accent/20 overflow-hidden flex items-center justify-center text-sm font-bold shrink-0">
                  {member.user?.image ? <Image src={member.user.image} alt="" width={36} height={36} className="object-cover" /> : (member.user?.name?.[0] || "U")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-sm truncate group-hover:text-brand-accent">{member.user?.name}</span>
                    {isOwner && <Crown className="w-3.5 h-3.5 text-yellow-500 shrink-0" />}
                    {labels.slice(0, 2).map((l) => (
                      <span key={l} className={`text-[10px] px-1.5 py-px rounded border ${LABEL_COLORS[l] || "bg-gray-600/30 text-gray-400 border-gray-500/30"}`}>{l}</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-yellow-400 text-sm font-semibold">
                  <Coins className="w-3.5 h-3.5" />
                  {member.points.toLocaleString()}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
