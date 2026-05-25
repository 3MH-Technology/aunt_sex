"use client";
import { useState, useEffect } from "react";
import { Users, Shield, UserCheck, Check, X } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  user: "مستخدم",
  admin: "مشرف",
  moderator: "مشرف مساعد",
  banned: "محظور",
};

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-brand-accent/20 text-brand-accent",
  moderator: "bg-blue-500/20 text-blue-400",
  user: "bg-gray-600/20 text-gray-400",
  banned: "bg-red-500/20 text-red-400",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [changing, setChanging] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((data) => { setUsers(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const changeRole = async (userId: string, role: string) => {
    setChanging(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role }),
      });
      if (res.ok) {
        setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role } : u));
      }
    } catch {}
    setChanging(null);
  };

  const totalCoins = users.reduce((s: number, u: any) => s + u.coins, 0);

  if (loading) return <div className="text-center py-20 text-gray-400">جاري التحميل...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Users className="w-6 h-6 text-brand-accent" /> إدارة المستخدمين
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card-adult p-4">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-blue-400" />
            <span className="text-sm text-gray-400">إجمالي المستخدمين</span>
          </div>
          <p className="text-2xl font-bold">{users.length}</p>
        </div>
        <div className="card-adult p-4">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-5 h-5 text-brand-accent" />
            <span className="text-sm text-gray-400">المشرفين</span>
          </div>
          <p className="text-2xl font-bold">{users.filter((u: any) => u.role === "admin").length}</p>
        </div>
        <div className="card-adult p-4">
          <div className="flex items-center gap-3 mb-2">
            <UserCheck className="w-5 h-5 text-yellow-400" />
            <span className="text-sm text-gray-400">إجمالي العملات</span>
          </div>
          <p className="text-2xl font-bold">{totalCoins.toLocaleString()}</p>
        </div>
      </div>

      <div className="card-glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th>المستخدم</th>
                <th>البريد</th>
                <th>الدور</th>
                <th>العملات</th>
                <th>البثوث</th>
                <th>المشتريات</th>
                <th>التسجيل</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u: any) => (
                <tr key={u.id} className="table-row">
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-brand-accent/20 flex items-center justify-center text-xs font-bold text-brand-accent">
                        {u.name?.[0] || u.username?.[0] || "U"}
                      </div>
                      <div>
                        <p className="font-medium">{u.name || u.username}</p>
                        <p className="text-xs text-gray-500">@{u.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell text-gray-400">{u.email || "—"}</td>
                  <td className="table-cell">
                    <select
                      value={u.role}
                      disabled={changing === u.id}
                      onChange={(e) => changeRole(u.id, e.target.value)}
                      className={`px-2 py-1 rounded text-xs font-medium border border-brand-border/50 bg-brand-panel cursor-pointer ${
                        ROLE_COLORS[u.role] || "text-gray-400"
                      } disabled:opacity-50`}
                    >
                      {Object.entries(ROLE_LABELS).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                    {changing === u.id && <span className="mr-2 text-xs text-brand-accent animate-pulse">...</span>}
                  </td>
                  <td className="table-cell font-mono">{u.coins}</td>
                  <td className="table-cell">{u._count.liveStreams}</td>
                  <td className="table-cell">{u._count.coinPurchases}</td>
                  <td className="table-cell text-gray-400">{new Date(u.createdAt).toLocaleDateString("ar")}</td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={7} className="p-4 text-center text-gray-500">لا يوجد مستخدمين</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
