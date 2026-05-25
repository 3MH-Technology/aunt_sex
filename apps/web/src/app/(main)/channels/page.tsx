import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { Heart, Plus, Film } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ChannelsPage() {
  const channels = await db.channel.findMany({
    include: { _count: { select: { videos: true } } },
  });

  if (channels.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-gradient-to-br from-brand-accent/20 to-brand-accent-pink/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="w-10 h-10 text-brand-accent" />
          </div>
          <h1 className="text-2xl font-bold mb-3">لا توجد قنوات بعد</h1>
          <p className="text-gray-400 mb-8">
            مفيش قنوات سكس للحين. سجّل واعمل أول قناة شرموطة!
          </p>
          <Link
            href="/auth/signin"
            className="glow-button inline-flex items-center gap-2 px-6 py-3"
          >
            <Plus className="w-5 h-5" />
            إنشاء حساب
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2 flex items-center gap-2"><Heart className="w-6 h-6 text-brand-accent" /> قنوات الشرموطات</h1>
      <p className="text-gray-500 text-sm mb-6">أحلى قنوات سكس ونيك مصري وعربي</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {channels.map((channel: { id: string; name: string; avatar: string; _count: { videos: number } }) => (
          <Link
            key={channel.id}
            href={`/channel/${channel.id}`}
            className="card-adult p-6 flex flex-col items-center hover:shadow-card transition group"
          >
            <Image
              src={channel.avatar}
              alt={channel.name}
              width={80}
              height={80}
              className="rounded-full mb-3 ring-2 ring-brand-accent/30 group-hover:ring-brand-accent transition-all"
            />
            <h2 className="font-semibold text-lg">{channel.name}</h2>
            <p className="text-gray-400 text-sm"><Film className="w-3 h-3 inline" /> {channel._count.videos} فيديو</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
