"use client";
import { useState } from "react";

export default function VideoDescription({
  description,
}: {
  description: string;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-brand-panel p-4 rounded-lg mt-4">
      <p className={`text-sm text-gray-300 ${expanded ? "" : "line-clamp-3"}`}>
        {description}
      </p>
      {description.length > 150 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-brand-accent text-xs mt-1"
        >
          {expanded ? "عرض أقل" : "عرض المزيد"}
        </button>
      )}
    </div>
  );
}
