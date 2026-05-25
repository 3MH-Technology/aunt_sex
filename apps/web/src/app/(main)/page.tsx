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
  const videoCount = await db.video.count({ where: { status: "APPROVED" } });

  if (videoCount === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-8 pb-20">
      <HeroSection />

      <section>
        <h2 className="section-title"><span className="text-brand-accent">●</span> الكل بيفرك عليهم دلوقتي</h2>
        <Suspense fallback={<VideoSkeletonGrid count={6} />}>
          <TrendingNow />
        </Suspense>
      </section>

      <section>
        <h2 className="section-title"><span className="text-brand-accent">●</span> سكس لسه نازل — نار 🔥</h2>
        <Suspense fallback={<VideoSkeletonGrid count={6} />}>
          <RecentlyAdded />
        </Suspense>
      </section>

      <section>
        <h2 className="section-title"><span className="text-brand-accent">●</span> أحلى نيك اخترتهولك</h2>
        <Suspense fallback={<VideoSkeletonGrid count={6} />}>
          <TopRated />
        </Suspense>
      </section>

      <section>
        <h2 className="section-title"><span className="text-brand-accent">●</span> كمّل تفرج يا كبير</h2>
        <Suspense fallback={<VideoSkeletonGrid count={4} />}>
          <ContinueWatching />
        </Suspense>
      </section>
    </div>
  );
}
