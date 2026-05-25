"use client";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { MessageCircle, Send, Users, Hash, X } from "lucide-react";
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

import { USER_LABEL_COLORS } from "@/config/user-labels";

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

  useEffect(() => {
    fetchMessages();
    const t = setInterval(fetchMessages, 3000);
    return () => clearInterval(t);
  }, [activeGroup]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

      {/* قائمة الغرف */}
      <div className="hidden md:flex flex-col w-64 shrink-0">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-brand-accent" />
          <h2 className="font-extrabold text-white">شات سكس — اتكلم يا وحش</h2>
        </div>
        <div className="flex-1 space-y-1.5 overflow-y-auto">
          {groups.map((g) => (
            <button
              key={g.id}
              onClick={() => setActiveGroup(g.id)}
              className={`w-full text-right px-3.5 py-3 rounded-xl text-sm transition flex items-center gap-2 ${
                activeGroup === g.id
                  ? "bg-gradient-to-r from-brand-accent/20 to-brand-accent-pink/5 text-brand-accent border border-brand-accent/40 font-bold shadow-[inset_0_0_8px_rgba(255,45,85,0.08)]"
                  : "text-gray-400 hover:bg-brand-hover hover:text-white border border-transparent hover:border-brand-border/30"
              }`}
            >
              <Hash className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate flex-1">{g.name}</span>
              <span className="text-[10px] bg-brand-panel border border-brand-border/40 text-gray-500 px-1.5 py-0.5 rounded-full">
                {g._count.messages}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* نافذة الدردشة */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 rounded-xl bg-brand-accent/15 flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-brand-accent" />
          </div>
          <h1 className="text-xl font-extrabold truncate">
            <span className="md:hidden"><Hash className="w-4 h-4 inline" /> </span>
            {activeGroupName}
          </h1>
          <span className="text-xs text-gray-500 hidden sm:inline bg-brand-panel border border-brand-border/30 px-2.5 py-1 rounded-full">
            اكتب اللي في قلبك… أنا سامعة
          </span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-3 mb-4 bg-brand-card/40 rounded-2xl p-4 border border-brand-border/40 shadow-inner">
          {messages.length === 0 && (
            <div className="text-center py-14 text-gray-500">
              <MessageCircle className="w-10 h-10 mx-auto mb-3 text-gray-700" />
              <p className="text-sm font-medium">الغرفة هادية للحين…</p>
              <p className="text-xs text-gray-600 mt-1">الغرفة فاضية… اكتب كلام يشعل النار يا نزوح!</p>
            </div>
          )}
          {messages.map((msg) => {
            const labels: string[] = (() => {
              try { return JSON.parse(msg.user.labels || "[]"); }
              catch { return []; }
            })();
            return (
              <div key={msg.id} className="flex items-start gap-2.5 animate-fade-in">
                <Link href={`/user/${msg.user.id}`} className="shrink-0">
                  <div className="w-9 h-9 rounded-full bg-brand-accent/20 flex items-center justify-center text-sm font-extrabold text-brand-accent overflow-hidden hover:ring-2 ring-brand-accent/60 transition shadow-soft">
                    {msg.user.image
                      ? <Image src={msg.user.image} alt="" width={36} height={36} className="object-cover" />
                      : (msg.user.name?.[0] || "U")}
                  </div>
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap mb-1">
                    <Link href={`/user/${msg.user.id}`} className="text-xs font-bold text-brand-accent hover:underline">
                      {msg.user.name}
                    </Link>
                    {labels.map((l) => (
                      <span
                        key={l}
                        className={`text-[9px] px-1.5 py-0.5 rounded-full border font-bold ${USER_LABEL_COLORS[l] || "bg-gray-600/30 text-gray-400 border-gray-500/30"}`}
                      >
                        {l}
                      </span>
                    ))}
                  </div>
                  <div className="bg-brand-panel text-gray-200 border border-brand-border/40 rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-sm break-words">
                    {msg.text}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="flex gap-2.5">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={isAuthenticated ? "اكتب اللي عايزه… كلام سكس، نيك، أي حاجة" : "سجّل وادخل الشات… مستنياك"}
            disabled={!isAuthenticated}
            maxLength={500}
            className="input-field flex-1 disabled:opacity-50 rounded-full px-5"
          />
          <button
            type="submit"
            disabled={!isAuthenticated || !text.trim() || sending}
            className="glow-button px-5 py-2.5 disabled:opacity-50 flex items-center gap-2 rounded-full"
          >
            {sending
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <Send className="w-4 h-4" />}
            أرسل
          </button>
        </form>
      </div>
    </div>
  );
}
