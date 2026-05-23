import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { Mail, User, Calendar, Film, Settings, Crown, Play, Eye, Heart } from "lucide-react";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) redirect("/auth/signin");

  const user = await db.user.findUnique({
    where: { email },
    include: {
      subscription: true,
      channel: { include: { _count: { select: { videos: true } } } },
      _count: { select: { watchlist: true, history: true, likes: true } },
    },
  });

  if (!user) redirect("/auth/signin");

  const isVIP = user.subscription?.plan !== "free" && user.subscription?.expiresAt && new Date(user.subscription.expiresAt) > new Date();
  const initialLetter = user.name?.[0] || "U";

  const stats = [
    { label: "فيديوهاتي", value: user.channel ? user.channel._count.videos : 0, icon: Film, color: "text-blue-400" },
    { label: "الإعجابات", value: user._count.likes, icon: Heart, color: "text-brand-accent" },
    { label: "مشاهدة لاحقاً", value: user._count.watchlist, icon: Play, color: "text-green-400" },
    { label: "السجل", value: user._count.history, icon: Eye, color: "text-yellow-400" },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card-adult p-6 flex flex-col md:flex-row items-center md:items-start gap-6 mb-6">
        <div className="w-24 h-24 bg-gradient-to-br from-brand-accent to-brand-accent-pink rounded-2xl flex items-center justify-center text-4xl font-bold shrink-0 shadow-glow">
          {initialLetter}
        </div>
        <div className="flex-1 text-center md:text-right">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div>
              <h1 className="text-2xl font-bold">{user.name}</h1>
              <p className="text-gray-400">@{user.username}</p>
            </div>
            <Link href="/profile/edit"
              className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white px-4 py-2 rounded-lg border border-brand-accent/20 hover:bg-brand-hover transition-all">
              <Settings className="w-4 h-4" /> تعديل الملف
            </Link>
          </div>
          <p className="mt-2">
            {isVIP ? (
              <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400 text-sm px-3 py-1 rounded-full font-semibold border border-yellow-500/30">
                <Crown className="w-4 h-4" /> عضو VIP
              </span>
            ) : (
              <Link href="/pricing" className="text-brand-accent underline text-sm font-semibold hover:no-underline">
                ترقية إلى VIP واستمتع بدون إعلانات
              </Link>
            )}
          </p>
          {user.bio && <p className="text-gray-400 text-sm mt-3">{user.bio}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="card-adult p-4 text-center">
              <Icon className={`w-5 h-5 mx-auto mb-1 ${s.color}`} />
              <p className="text-xl font-bold">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card-adult p-5">
          <h2 className="font-bold mb-3 flex items-center gap-2"><User className="w-4 h-4 text-brand-accent" /> معلومات الحساب</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3 text-gray-300"><Mail className="w-4 h-4 text-gray-500" /> {user.email}</div>
            {user.dateOfBirth && <div className="flex items-center gap-3 text-gray-300"><Calendar className="w-4 h-4 text-gray-500" /> {user.dateOfBirth}</div>}
            {user.gender && <div className="flex items-center gap-3 text-gray-300"><User className="w-4 h-4 text-gray-500" /> {user.gender === "ذكر" ? "ذكر" : user.gender === "أنثى" ? "أنثى" : user.gender}</div>}
          </div>
        </div>

        <div className="card-adult p-5">
          <h2 className="font-bold mb-3 flex items-center gap-2"><Film className="w-4 h-4 text-brand-accent" /> القناة</h2>
          {user.channel ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-300">{user.channel.name}</p>
              <Link href={`/channel/${user.channel.id}`} className="text-brand-accent text-sm font-semibold hover:underline">
                زيارة القناة ←
              </Link>
              <Link href={`/channel/${user.channel.id}/settings`} className="text-gray-400 text-sm block hover:text-white">
                إعدادات القناة
              </Link>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">ليس لديك قناة بعد — ارفع فيديو لإنشاء قناة</p>
          )}
        </div>
      </div>
    </div>
  );
}
