export function VideoSkeleton() {
  return (
    <div className="video-card animate-pulse">
      <div className="aspect-video bg-brand-hover rounded-t-xl" />
      <div className="p-3 flex gap-3">
        <div className="w-9 h-9 bg-brand-hover rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-brand-hover rounded w-3/4" />
          <div className="h-3 bg-brand-hover rounded w-1/2" />
        </div>
      </div>
    </div>
  );
}

export function VideoSkeletonGrid({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <VideoSkeleton key={i} />
      ))}
    </div>
  );
}
