"use client";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Image from "next/image";
import { Send } from "lucide-react";

interface Comment {
  id: string;
  text: string;
  createdAt: string;
  user: { name: string; avatar: string };
}

export default function CommentSection({
  videoId,
  initialComments,
}: {
  videoId: string;
  initialComments: Comment[];
}) {
  const { user, isAuthenticated } = useAuth();
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [text, setText] = useState("");

  const addComment = async () => {
    if (!text.trim()) return;
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId, text }),
      });
      if (!res.ok) return;
      const saved = await res.json();
      const newComment: Comment = {
        id: saved.id,
        text: saved.text,
        createdAt: saved.createdAt,
        user: { name: user?.name || "مستخدم", avatar: user?.image || "" },
      };
      setComments([newComment, ...comments]);
      setText("");
    } catch {
      // silent
    }
  };

  return (
    <div className="mt-8">
      <h3 className="text-lg font-bold mb-4">التعليقات ({comments.length})</h3>
      {isAuthenticated && (
        <div className="flex gap-3 mb-6">
          {user?.image ? (
            <Image src={user.image} width={40} height={40} className="rounded-full" alt="avatar" />
          ) : (
            <div className="w-10 h-10 bg-brand-accent rounded-full flex items-center justify-center text-sm font-bold shrink-0">
              {user?.name?.[0] || "U"}
            </div>
          )}
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="أضف تعليقاً..."
              className="flex-1 bg-brand-panel border border-brand-border rounded-lg px-4 py-2 text-sm"
            />
            <button onClick={addComment} className="glow-button px-3">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      <div className="space-y-4">
        {comments.map((c) => (
          <div key={c.id} className="flex gap-3">
            {c.user.avatar ? (
              <Image src={c.user.avatar} width={36} height={36} className="rounded-full" alt="user" />
            ) : (
              <div className="w-9 h-9 bg-brand-hover rounded-full flex items-center justify-center text-xs shrink-0">
                {c.user.name[0]}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">{c.user.name}</span>
                <span className="text-xs text-gray-500">{c.createdAt}</span>
              </div>
              <p className="text-sm text-gray-300 mt-1">{c.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
