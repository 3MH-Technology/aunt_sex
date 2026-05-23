import { db } from "@/lib/db";
import { Suspense } from "react";
export const dynamic = "force-dynamic";
import HeroSection from "@/components/home/HeroSection";
import TrendingNow from "@/components/home/TrendingNow";
import RecentlyAdded from "@/components/home/RecentlyAdded";
import TopRated from "@/components/home/TopRated";
import ContinueWatching from "@/components/home/ContinueWatching";
import { VideoSkeletonGrid } from "@/components/video/VideoSkeleton";
import EmptyState from "@/components/home/EmptyState";

export default async function HomePage() {
  const videoCount = await db.video.count();

  if (videoCount === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-8 pb-20">
      <HeroSection />

      <section>
        <h2 className="section-title"><span className="text-brand-accent">●</span> الأكثر مشاهدة</h2>
        <Suspense fallback={<VideoSkeletonGrid count={6} />}>
          <TrendingNow />
        </Suspense>
      </section>

      <section>
        <h2 className="section-title"><span className="text-brand-accent">●</span> أضيفت حديثاً — ساخن جداً</h2>
        <Suspense fallback={<VideoSkeletonGrid count={6} />}>
          <RecentlyAdded />
        </Suspense>
      </section>

      <section>
        <h2 className="section-title"><span className="text-brand-accent">●</span> الأعلى تقييماً — المختار بعناية</h2>
        <Suspense fallback={<VideoSkeletonGrid count={6} />}>
          <TopRated />
        </Suspense>
      </section>

      <section>
        <h2 className="section-title"><span className="text-brand-accent">●</span> متابعة المشاهدة</h2>
        <Suspense fallback={<VideoSkeletonGrid count={4} />}>
          <ContinueWatching />
        </Suspense>
      </section>
    </div>
  );
}
