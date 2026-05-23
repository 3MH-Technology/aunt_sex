"use client";
import { useState } from "react";
import Image from "next/image";

interface HoverPreviewProps {
  thumbnail: string;
  previewGif?: string;
}

export function useHoverPreview({ thumbnail, previewGif }: HoverPreviewProps) {
  const [isHovering, setIsHovering] = useState(false);
  const src = isHovering && previewGif ? previewGif : thumbnail;
  return { src, setIsHovering };
}
