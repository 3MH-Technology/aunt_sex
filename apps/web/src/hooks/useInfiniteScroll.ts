"use client";
import { useEffect, useRef, useCallback } from "react";

export function useInfiniteScroll(
  loadMore: () => void,
  hasMore: boolean,
  isLoading: boolean
) {
  const observerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hasMore || isLoading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.5 }
    );
    const el = observerRef.current;
    if (el) observer.observe(el);
    return () => {
      if (el) observer.unobserve(el);
    };
  }, [hasMore, isLoading, loadMore]);

  return observerRef;
}
