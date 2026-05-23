"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Mail, Lock, User, AtSign, Eye, EyeOff, LogIn, Heart } from "lucide-react";

export default function SignInPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    username: "",
  });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (isSignUp) {
      if (form.password !== form.confirmPassword) {
        setError("كلمة المرور غير متطابقة"); setLoading(false); return;
      }
      if (form.password.length < 6) {
        setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل"); setLoading(false); return;
      }
      if (form.username.length < 3) {
        setError("اسم المستخدم يجب أن يكون 3 أحرف على الأقل"); setLoading(false); return;
      }
    }

    const result = await signIn("credentials", {
      email: form.email,
      password: form.password,
      name: form.name,
      username: form.username,
      redirect: false,
    });

    setLoading(false);
    if (result?.error) {
      setError(result.error);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-8 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Aunt sex" className="w-20 h-20 rounded-2xl mx-auto mb-4 shadow-glow object-cover" />
          <h1 className="text-3xl font-bold neon-text">{isSignUp ? "انضم إلى المتعة" : "مرحباً بعودتك"}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {isSignUp ? "أنشئ حسابك مجاناً واستمتع بأفضل المحتوى الحصري" : "سجل دخولك لمشاهدة ومشاركة الفيديوهات الساخنة"}
          </p>
        </div>

        <div className="card-adult p-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-4 text-sm flex items-center gap-2">
              <span>⚠</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input type="text" value={form.name} onChange={(e) => updateField("name", e.target.value)}
                    placeholder="الاسم الكامل *" required
                    className="input-field pr-10" />
                </div>
                <div className="relative">
                  <AtSign className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input type="text" value={form.username} onChange={(e) => updateField("username", e.target.value)}
                    placeholder="اسم المستخدم *" required minLength={3}
                    className="input-field pr-10" />
                </div>
              </>
            )}

            <div className="relative">
              <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)}
                placeholder="البريد الإلكتروني *" required
                className="input-field pr-10" />
            </div>

            <div className="relative">
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input type={showPw ? "text" : "password"} value={form.password} onChange={(e) => updateField("password", e.target.value)}
                placeholder={isSignUp ? "كلمة المرور * (6 أحرف)" : "كلمة المرور *"} required minLength={isSignUp ? 6 : 1}
                className="input-field pr-10 pl-10" />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {isSignUp && (
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input type={showPw ? "text" : "password"} value={form.confirmPassword} onChange={(e) => updateField("confirmPassword", e.target.value)}
                  placeholder="تأكيد كلمة المرور *" required
                  className="input-field pr-10" />
              </div>
            )}

            <button type="submit" disabled={loading}
              className="glow-button w-full flex items-center justify-center gap-2 text-base disabled:opacity-60">
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Heart className="w-5 h-5" />
              )}
              {isSignUp ? "انضم مجاناً" : "تسجيل الدخول"}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-brand-accent/20 text-center">
            <p className="text-gray-400 text-sm">
              {isSignUp ? "لديك حساب؟" : "ليس لديك حساب؟"}{" "}
              <button onClick={() => { setIsSignUp(!isSignUp); setError(""); }}
                className="text-brand-accent font-semibold hover:underline">
                {isSignUp ? "تسجيل الدخول" : "أنشئ حساب مجاني الآن"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
