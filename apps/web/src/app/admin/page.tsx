import { db } from "@/lib/db";
import { Film, Users, DollarSign, TrendingUp } from "lucide-react";
export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [videoCount, userCount, viewCount, channelCount] = await Promise.all([
    db.video.count(),
    db.user.count(),
    db.video.aggregate({ _sum: { views: true } }),
    db.channel.count(),
  ]);

  const totalViews = viewCount._sum.views || 0;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <TrendingUp className="w-6 h-6 text-brand-accent" /> لوحة التحكم
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card-adult p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-brand-accent/20 rounded-lg flex items-center justify-center">
              <Film className="w-5 h-5 text-brand-accent" />
            </div>
            <h2 className="text-gray-400 text-sm">إجمالي الفيديوهات</h2>
          </div>
          <p className="text-3xl font-bold">{videoCount}</p>
        </div>
        <div className="card-adult p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <h2 className="text-gray-400 text-sm">المستخدمين</h2>
          </div>
          <p className="text-3xl font-bold">{userCount}</p>
        </div>
        <div className="card-adult p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <h2 className="text-gray-400 text-sm">إجمالي المشاهدات</h2>
          </div>
          <p className="text-3xl font-bold">{totalViews.toLocaleString()}</p>
        </div>
        <div className="card-adult p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-yellow-400" />
            </div>
            <h2 className="text-gray-400 text-sm">الإيرادات</h2>
          </div>
          <p className="text-3xl font-bold">$ --</p>
        </div>
      </div>
    </div>
  );
}
