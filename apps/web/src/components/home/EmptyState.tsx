import Link from "next/link";
import { Heart, Upload, UserPlus } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function EmptyState() {
  const session = await getServerSession(authOptions);
  const isAuthenticated = !!session;

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="text-center max-w-lg">
        <div className="w-20 h-20 bg-gradient-to-br from-brand-accent/20 to-brand-accent-pink/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-glow">
          <Heart className="w-10 h-10 text-brand-accent" />
        </div>
        <h1 className="text-3xl font-bold mb-3 neon-text">لا يوجد محتوى بعد</h1>
        <p className="text-gray-400 text-lg mb-8">
          {isAuthenticated
            ? "لم يتم رفع أي فيديوهات إباحية بعد. كن أول من يشارك المحتوى الساخن!"
            : "لم يتم رفع أي فيديوهات بعد. سجل الدخول وشارك فيديوهاتك الساخنة مع الجميع!"}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {isAuthenticated ? (
            <Link
              href="/upload"
              className="glow-button flex items-center justify-center gap-2 text-lg px-8 py-4"
            >
              <Upload className="w-5 h-5" />
              رفع فيديو جديد
            </Link>
          ) : (
            <>
              <Link
                href="/auth/signin"
                className="glow-button flex items-center justify-center gap-2 text-lg px-8 py-4"
              >
                <UserPlus className="w-5 h-5" />
                إنشاء حساب مجاني
              </Link>
              <Link
                href="/auth/signin"
                className="flex items-center justify-center gap-2 text-lg px-8 py-4 rounded-lg border border-brand-border text-gray-300 hover:bg-brand-hover transition"
              >
                تسجيل الدخول
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
