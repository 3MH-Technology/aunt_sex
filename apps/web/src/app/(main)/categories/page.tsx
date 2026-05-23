import { db } from "@/lib/db";
import Link from "next/link";
import { Hash } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const videos = await db.video.findMany({ select: { tags: true } });

  const tagCount = new Map<string, number>();
  videos.forEach((v: { tags: string }) => {
    const tags = JSON.parse(v.tags) as string[];
    tags.forEach((tag) => {
      tagCount.set(tag, (tagCount.get(tag) || 0) + 1);
    });
  });

  const categories = [...tagCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2 flex items-center gap-2"><Hash className="w-6 h-6 text-brand-accent" /> التصنيفات الإباحية</h1>
      <p className="text-gray-500 text-sm mb-6">تصفح المحتوى حسب الفئة التي تثيرك</p>
      {categories.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map(([tag, count]) => (
            <Link
              key={tag}
              href={`/search?q=${encodeURIComponent(tag)}`}
              className="card-adult p-4 rounded-lg hover:border-brand-accent/40 transition group"
            >
              <span className="text-lg font-bold group-hover:text-brand-accent transition-colors">#{tag}</span>
              <p className="text-gray-400 text-sm mt-1">{count} فيديو</p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-400">
          <Hash className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>لا توجد تصنيفات بعد — ارفع فيديوهات لإنشاء تصنيفات</p>
        </div>
      )}
    </div>
  );
}
