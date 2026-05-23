"use client";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { MessageCircle, Send, Users, Hash, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface ChatMsg {
  id: string;
  text: string;
  createdAt: string;
  user: { id: string; name: string; image: string; labels?: string };
}

interface Group {
  id: string;
  name: string;
  description: string;
  _count: { messages: number };
}

const LABEL_COLORS: Record<string, string> = {
  "فحل": "bg-green-600/30 text-green-400 border-green-500/30",
  "سالب": "bg-pink-600/30 text-pink-400 border-pink-500/30",
  "ديوث": "bg-yellow-600/30 text-yellow-400 border-yellow-500/30",
  "عمة": "bg-purple-600/30 text-purple-400 border-purple-500/30",
  "كلب": "bg-orange-600/30 text-orange-400 border-orange-500/30",
  "شرموطة": "bg-red-600/30 text-red-400 border-red-500/30",
  "قحبة": "bg-red-700/30 text-red-300 border-red-500/30",
};

export default function ChatPage() {
  const { user, isAuthenticated } = useAuth();
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeGroup, setActiveGroup] = useState("general");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/chat/groups").then((r) => r.json()).then(setGroups).catch(() => {});
  }, []);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/chat?limit=50&groupId=${activeGroup}`);
      const data = await res.json();
      setMessages(data);
    } catch {}
  };

  useEffect(() => { fetchMessages(); const t = setInterval(fetchMessages, 3000); return () => clearInterval(t); }, [activeGroup]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim(), groupId: activeGroup }),
      });
      const msg = await res.json();
      if (msg.id) {
        setMessages((prev) => [...prev, msg]);
        setText("");
      }
    } catch {}
    setSending(false);
  };

  const activeGroupName = groups.find((g) => g.id === activeGroup)?.name || activeGroup;

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-100px)] flex gap-4">
      <div className="hidden md:flex flex-col w-56 shrink-0">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-brand-accent" />
          <h2 className="font-bold">المجموعات</h2>
        </div>
        <div className="flex-1 space-y-1 overflow-y-auto">
          {groups.map((g) => (
            <button key={g.id} onClick={() => setActiveGroup(g.id)}
              className={`w-full text-right px-3 py-2.5 rounded-lg text-sm transition flex items-center gap-2 ${
                activeGroup === g.id ? "bg-brand-accent/20 text-brand-accent border border-brand-accent/30" : "text-gray-400 hover:bg-brand-hover hover:text-white border border-transparent"
              }`}>
              <Hash className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate flex-1">{g.name}</span>
              <span className="text-[10px] text-gray-600">{g._count.messages}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center gap-2 mb-4">
          <MessageCircle className="w-6 h-6 text-brand-accent shrink-0" />
          <h1 className="text-2xl font-bold truncate">
            <span className="md:hidden"><Hash className="w-4 h-4 inline" /> </span>
            {activeGroupName}
          </h1>
          <span className="text-xs text-gray-500 hidden sm:inline">— دردش مع المتابعين</span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 mb-4 bg-brand-card/50 rounded-xl p-4 border border-brand-border/50">
          {messages.length === 0 && (
            <div className="text-center py-10 text-gray-500">لا توجد رسائل بعد... كن أول من يكتب!</div>
          )}
          {messages.map((msg) => {
            const labels: string[] = (() => { try { return JSON.parse(msg.user.labels || "[]"); } catch { return []; } })();
            return (
              <div key={msg.id} className="flex items-start gap-2.5 animate-fade-in">
                <Link href={`/user/${msg.user.id}`} className="shrink-0">
                  <div className="w-8 h-8 rounded-full bg-brand-accent/20 flex items-center justify-center text-sm font-bold text-brand-accent overflow-hidden hover:ring-2 ring-brand-accent/50 transition">
                    {msg.user.image ? <Image src={msg.user.image} alt="" width={32} height={32} className="object-cover" /> : (msg.user.name?.[0] || "U")}
                  </div>
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Link href={`/user/${msg.user.id}`} className="text-sm font-semibold text-brand-accent hover:underline">{msg.user.name}</Link>
                    {labels.map((l) => (
                      <span key={l} className={`text-[10px] px-1.5 py-0.5 rounded border ${LABEL_COLORS[l] || "bg-gray-600/30 text-gray-400 border-gray-500/30"}`}>{l}</span>
                    ))}
                  </div>
                  <p className="text-sm text-gray-200 break-words">{msg.text}</p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSend} className="flex gap-3">
          <input
            value={text} onChange={(e) => setText(e.target.value)}
            placeholder={isAuthenticated ? "اكتب رسالتك..." : "سجل دخولك للدردشة..."}
            disabled={!isAuthenticated}
            maxLength={500}
            className="input-field flex-1 disabled:opacity-50"
          />
          <button type="submit" disabled={!isAuthenticated || !text.trim() || sending}
            className="glow-button px-6 disabled:opacity-50 flex items-center gap-2">
            <Send className="w-4 h-4" /> إرسال
          </button>
        </form>
      </div>
    </div>
  );
}
