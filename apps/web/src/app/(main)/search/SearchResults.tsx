"use client";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import dynamic from "next/dynamic";
import { VideoSkeletonGrid } from "@/components/video/VideoSkeleton";

const SearchVideoGrid = dynamic(() => import("./SearchVideoGrid"), {
  ssr: false,
});

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  return (
    <div className="pt-4">
      <h1 className="text-2xl font-bold mb-2">
        نتائج البحث عن: &quot;{query}&quot;
      </h1>
      <p className="text-gray-500 text-sm mb-6">أفضل النتائج المتاحة</p>
      <Suspense fallback={<VideoSkeletonGrid count={8} />}>
        <SearchVideoGrid query={query} />
      </Suspense>
    </div>
  );
}

export default function SearchResults() {
  return (
    <Suspense fallback={<VideoSkeletonGrid count={8} />}>
      <SearchContent />
    </Suspense>
  );
}
