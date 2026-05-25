import Link from "next/link";
import { Heart, Upload, UserPlus } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function EmptyState() {
  const session = await getServerSession(authOptions);
  const isAuthenticated = !!session;

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="text-center max-w-lg px-4">
        <div className="w-20 h-20 bg-gradient-to-br from-brand-accent/25 to-brand-accent-pink/25 rounded-full flex items-center justify-center mx-auto mb-6 shadow-glow ring-2 ring-brand-accent/20">
          <Heart className="w-10 h-10 text-brand-accent animate-pulse" />
        </div>
        <h1 className="text-3xl font-extrabold mb-3.5 neon-text">لسه فاضي… بس أنا مستنياك</h1>
        <p className="text-gray-300 text-lg mb-8 max-w-md mx-auto leading-relaxed">
          {isAuthenticated
            ? "يا وحش، مفيش سكس للحين — بس تقدر ترفع أول فيديو وتفتح النار. ورّيني طيز أو نيك يخليني أقولك: يا سلااام!"
            : "الموقع فاضي شوية، بس مش هيفضل كده. سجّل وارفع سكس، وخلينا نملى المكان نيك وشرموطة سوا."}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {isAuthenticated ? (
            <Link href="/upload" className="glow-button flex items-center justify-center gap-2 text-lg px-8 py-4">
              <Upload className="w-5 h-5" />
              ارفع سكس دلوقتي
            </Link>
          ) : (
            <>
              <Link href="/auth/signin" className="glow-button flex items-center justify-center gap-2 text-lg px-8 py-4">
                <UserPlus className="w-5 h-5" />
                تعال سجّل يا نزوح
              </Link>
              <Link
                href="/auth/signin"
                className="flex items-center justify-center gap-2 text-lg px-8 py-4 rounded-xl border border-brand-border text-gray-300 hover:bg-brand-hover hover:border-brand-accent/40 transition-all hover:scale-[1.02]"
              >
                عندي حساب — ادخل
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
