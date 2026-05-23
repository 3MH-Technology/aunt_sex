"use client";
import { useEffect, useRef, useState } from "react";

export function useVideoPlayer(options: {
  src: string;
  poster: string;
  onReady?: (player: any) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let player: any = null;

    async function initPlayer() {
      if (!videoRef.current) return;
      try {
        const videojs = (await import("video.js")).default;

        player = videojs(videoRef.current, {
          controls: true,
          autoplay: false,
          preload: "auto",
          fluid: true,
          playbackRates: [0.5, 1, 1.25, 1.5, 2],
          sources: [{ src: options.src, type: "video/mp4" }],
          poster: options.poster,
          html5: {
            nativeAudioTracks: false,
            nativeVideoTracks: false,
          },
          errorDisplay: true,
          techOrder: ["html5"],
        });

        player.on("error", () => setError(true));
        player.one("loadeddata", () => setError(false));

        playerRef.current = player;
        if (options.onReady) options.onReady(player);
      } catch {
        setError(true);
      }
    }

    initPlayer();

    return () => {
      if (player) try { player.dispose(); } catch {}
    };
  }, [options.src, options.poster]);

  return { videoRef, playerRef, error };
}
