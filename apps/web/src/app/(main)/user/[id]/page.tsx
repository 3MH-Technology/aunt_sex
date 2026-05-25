"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { User, Film, Heart, Gift, AtSign, MessageCircle, Radio } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { USER_LABEL_COLORS as LABEL_STYLES } from "@/config/user-labels";

export default function UserProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/user/${id}`)
      .then((r) => r.json())
      .then((data) => { setProfile(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-center py-20 text-gray-400"><div className="w-8 h-8 border-2 border-brand-accent border-t-transparent rounded-full animate-spin mx-auto" /></div>;
  if (!profile) return <div className="text-center py-20 text-gray-400">المستخدم غير موجود</div>;

  const labels: string[] = (() => { try { return JSON.parse(profile.labels || "[]"); } catch { return []; } })();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card-adult p-6 text-center">
        <div className="w-24 h-24 mx-auto rounded-2xl overflow-hidden bg-gradient-to-br from-brand-accent to-brand-accent-pink shadow-glow mb-4">
          {profile.image ? (
            <Image src={profile.image} alt="" width={96} height={96} className="object-cover w-full h-full" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-white">
              {profile.name?.[0] || "U"}
            </div>
          )}
        </div>
        <h1 className="text-2xl font-bold">{profile.name}</h1>
        <p className="text-gray-400 flex items-center justify-center gap-1 mt-1">
          <AtSign className="w-3.5 h-3.5" /> {profile.username}
        </p>
        <div className="flex justify-center gap-2 mt-2 flex-wrap">
          {labels.map((l: string) => (
            <span key={l} className={`text-xs px-2 py-0.5 rounded-full border ${LABEL_STYLES[l] || "bg-gray-600/30 text-gray-400 border-gray-500/30"}`}>{l}</span>
          ))}
        </div>
        {profile.bio && <p className="text-gray-400 mt-3">{profile.bio}</p>}
      </div>

      <div className="grid grid-cols-3 gap-3 my-4">
        <div className="card-adult p-4 text-center">
          <Heart className="w-5 h-5 mx-auto mb-1 text-brand-accent" />
          <p className="text-lg font-bold">{profile._count.likes}</p>
          <p className="text-xs text-gray-500">إعجابات</p>
        </div>
        <div className="card-adult p-4 text-center">
          <Gift className="w-5 h-5 mx-auto mb-1 text-yellow-400" />
          <p className="text-lg font-bold">{profile._count.receivedGifts}</p>
          <p className="text-xs text-gray-500">هدايا</p>
        </div>
        <div className="card-adult p-4 text-center">
          <Film className="w-5 h-5 mx-auto mb-1 text-blue-400" />
          <p className="text-lg font-bold">{profile.channel?._count.videos || 0}</p>
          <p className="text-xs text-gray-500">فيديوهات</p>
        </div>
      </div>

      {profile.channel && (
        <Link href={`/channel/${profile.channel.id}`} className="card-adult p-4 flex items-center gap-3 hover:bg-brand-hover transition block">
          <div className="w-12 h-12 rounded-xl overflow-hidden bg-brand-accent/20 flex items-center justify-center font-bold">
            {profile.channel.avatar ? <Image src={profile.channel.avatar} alt="" width={48} height={48} className="object-cover" /> : profile.channel.name[0]}
          </div>
          <div className="flex-1">
            <p className="font-semibold">{profile.channel.name}</p>
            <p className="text-xs text-gray-500">{profile.channel._count.videos} فيديو</p>
          </div>
          <span className="text-brand-accent text-sm">←</span>
        </Link>
      )}

      <div className="flex gap-3 mt-4">
        <Link href={`/chat`} className="glow-button flex-1 flex items-center justify-center gap-2 py-3">
          <MessageCircle className="w-4 h-4" /> راسلني
        </Link>
        <Link href={`/live`} className="glow-button flex-1 flex items-center justify-center gap-2 py-3">
          <Radio className="w-4 h-4" /> بثوث حية
        </Link>
      </div>
    </div>
  );
}
