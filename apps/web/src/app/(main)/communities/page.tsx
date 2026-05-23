"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Users, Plus, X, User, Hash, Crown } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface Community {
  id: string;
  name: string;
  description: string;
  image: string | null;
  _count: { members: number };
  owner: { id: string; name: string; image: string };
}

export default function CommunitiesPage() {
  const { isAuthenticated, user } = useAuth();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch("/api/communities").then((r) => r.json()).then(setCommunities).catch(() => {});
  }, []);

  const handleCreate = async () => {
    if (!name.trim() || creating) return;
    setCreating(true);
    const res = await fetch("/api/communities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), description: description.trim() }),
    });
    const data = await res.json();
    setCreating(false);
    if (data.id) {
      setCommunities((prev) => [data, ...prev]);
      setName("");
      setDescription("");
      setShowCreate(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="w-6 h-6 text-brand-accent" /> المجتمعات
        </h1>
        {isAuthenticated && (
          <button onClick={() => setShowCreate(!showCreate)} className="glow-button flex items-center gap-2 text-sm px-4 py-2">
            <Plus className="w-4 h-4" /> إنشاء مجتمع
          </button>
        )}
      </div>

      {showCreate && (
        <div className="card-adult p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold">مجتمع جديد</h3>
            <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
          </div>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="اسم المجتمع" className="input-field w-full mb-3" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="الوصف (اختياري)" rows={2} className="input-field w-full mb-3 resize-none" />
          <button onClick={handleCreate} disabled={creating || !name.trim()} className="glow-button w-full disabled:opacity-50">
            {creating ? "..." : "إنشاء"}
          </button>
        </div>
      )}

      {communities.length === 0 ? (
        <div className="text-center py-20">
          <Users className="w-12 h-12 mx-auto mb-4 text-gray-600" />
          <p className="text-gray-400">لا توجد مجتمعات بعد</p>
          <p className="text-gray-600 text-sm mt-1">كن أول من ينشئ مجتمع!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {communities.map((c) => (
            <Link key={c.id} href={`/communities/${c.id}`} className="card-adult p-5 hover:border-brand-accent/40 transition block">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-accent to-brand-accent-pink flex items-center justify-center text-xl font-bold shadow-glow shrink-0">
                  {c.name[0]}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold truncate">{c.name}</h3>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Users className="w-3 h-3" /> {c._count.members} عضو
                  </p>
                </div>
              </div>
              {c.description && <p className="text-sm text-gray-400 line-clamp-2">{c.description}</p>}
              <div className="flex items-center gap-1.5 mt-3 text-xs text-gray-600">
                <Crown className="w-3 h-3 text-yellow-500" />
                {c.owner.name}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
