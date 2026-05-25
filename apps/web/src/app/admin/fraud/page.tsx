import { db } from "@/lib/db";
import { Shield, AlertTriangle, Ban, CheckCircle } from "lucide-react";
export const dynamic = "force-dynamic";

export default async function AdminFraudPage() {
  const [signals, holds, signalCount, holdCount, unviewedCritical] = await Promise.all([
    db.fraudSignal.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { user: { select: { id: true, name: true, username: true, email: true } } },
    }),
    db.fraudHold.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { user: { select: { id: true, name: true, username: true, email: true } } },
    }),
    db.fraudSignal.count(),
    db.fraudHold.count({ where: { releasedAt: null } }),
    db.fraudSignal.count({ where: { reviewed: false, severity: "CRITICAL" } }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Shield className="w-6 h-6 text-red-400" /> مكافحة الاحتيال
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card-adult p-4">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            <span className="text-sm text-gray-400">إشارات الاحتيال</span>
          </div>
          <p className="text-2xl font-bold">{signalCount}</p>
        </div>
        <div className="card-adult p-4">
          <div className="flex items-center gap-3 mb-2">
            <Ban className="w-5 h-5 text-red-400" />
            <span className="text-sm text-gray-400">التجميدات النشطة</span>
          </div>
          <p className="text-2xl font-bold">{holdCount}</p>
        </div>
        <div className="card-adult p-4">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-5 h-5 text-orange-400" />
            <span className="text-sm text-gray-400">حرجة غير مراجعة</span>
          </div>
          <p className="text-2xl font-bold">{unviewedCritical}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-glass overflow-hidden">
          <h2 className="text-lg font-semibold p-4 border-b border-brand-border">الإشارات</h2>
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full">
              <thead>
                <tr className="text-right border-b border-brand-border bg-brand-panel sticky top-0">
                  <th className="p-2 text-xs text-gray-400">المستخدم</th>
                  <th className="p-2 text-xs text-gray-400">النوع</th>
                  <th className="p-2 text-xs text-gray-400">الخطورة</th>
                  <th className="p-2 text-xs text-gray-400">تمت المراجعة</th>
                  <th className="p-2 text-xs text-gray-400">التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {signals.map((s) => (
                  <tr key={s.id} className="border-b border-brand-border/30 hover:bg-brand-hover/30 text-sm">
                    <td className="p-2">{s.user.name || s.user.username || s.user.email}</td>
                    <td className="p-2 text-xs font-mono">{s.signalType}</td>
                    <td className="p-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        s.severity === "CRITICAL" ? "bg-red-500/20 text-red-400" :
                        s.severity === "HIGH" ? "bg-orange-500/20 text-orange-400" :
                        "bg-yellow-500/20 text-yellow-400"
                      }`}>
                        {s.severity}
                      </span>
                    </td>
                    <td className="p-2">{s.reviewed ? "نعم" : "لا"}</td>
                    <td className="p-2 text-gray-400">{new Date(s.createdAt).toLocaleDateString("ar")}</td>
                  </tr>
                ))}
                {signals.length === 0 && (
                  <tr><td colSpan={5} className="p-4 text-center text-gray-500">لا توجد إشارات</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card-glass overflow-hidden">
          <h2 className="text-lg font-semibold p-4 border-b border-brand-border">التجميدات النشطة</h2>
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full">
              <thead>
                <tr className="text-right border-b border-brand-border bg-brand-panel sticky top-0">
                  <th className="p-2 text-xs text-gray-400">المستخدم</th>
                  <th className="p-2 text-xs text-gray-400">السبب</th>
                  <th className="p-2 text-xs text-gray-400">التاريخ</th>
                  <th className="p-2 text-xs text-gray-400">المدة</th>
                </tr>
              </thead>
              <tbody>
                {holds.filter((h) => !h.releasedAt).map((h) => (
                  <tr key={h.id} className="border-b border-brand-border/30 hover:bg-brand-hover/30 text-sm">
                    <td className="p-2">{h.user.name || h.user.username || h.user.email}</td>
                    <td className="p-2 text-xs">{h.reason}</td>
                    <td className="p-2 text-gray-400">{new Date(h.createdAt).toLocaleDateString("ar")}</td>
                    <td className="p-2 text-gray-400">{Math.floor((Date.now() - h.createdAt.getTime()) / 86400000)}d</td>
                  </tr>
                ))}
                {holds.filter((h) => !h.releasedAt).length === 0 && (
                  <tr><td colSpan={4} className="p-4 text-center text-gray-500">لا توجد تجميدات نشطة</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
