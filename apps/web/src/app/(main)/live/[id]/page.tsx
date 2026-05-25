"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Radio, Eye, X, Send, Gift, Camera, Mic, MicOff, Video, VideoOff, User, MessageCircle, Heart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface StreamChatMsg {
  id: string;
  text: string;
  createdAt: string;
  user: { id: string; name: string; image: string; labels?: string };
}

interface GiftType {
  id: string;
  name: string;
  icon: string;
  price: number;
}

import { USER_LABEL_COLORS } from "@/config/user-labels";

const ADULT_LABEL_COLORS = USER_LABEL_COLORS;

export default function LiveStreamPage({ params }: { params: { id: string } }) {
  const { user: currentUser, isAuthenticated } = useAuth();
  const router = useRouter();
  const [stream, setStream] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<StreamChatMsg[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [giftTypes, setGiftTypes] = useState<GiftType[]>([]);
  const [showGifts, setShowGifts] = useState(false);
  const [sendingGift, setSendingGift] = useState(false);
  const [giftAnimation, setGiftAnimation] = useState<{ icon: string; sender: string; name: string } | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const isOwner = currentUser && stream && (currentUser as any).id === stream.userId;
  const canStream = isOwner && stream?.isLive;

  useEffect(() => {
    fetch(`/api/live/${params.id}`)
      .then((r) => r.json())
      .then((data) => { setStream(data); setLoading(false); })
      .catch(() => setLoading(false));
    fetch("/api/gifts").then((r) => r.json()).then(setGiftTypes).catch(() => {});
  }, [params.id]);

  useEffect(() => {
    if (!stream?.id) return;
    const fetchChat = async () => {
      try {
        const res = await fetch(`/api/chat?limit=50&groupId=stream-${stream.id}`);
        const data = await res.json();
        setMessages(data);
      } catch {}
    };
    fetchChat();
    const t = setInterval(fetchChat, 3000);
    return () => clearInterval(t);
  }, [stream?.id]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || sending || !stream) return;
    setSending(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim(), groupId: `stream-${stream.id}` }),
      });
      const msg = await res.json();
      if (msg.id) {
        setMessages((prev) => [...prev, msg]);
        setText("");
      }
    } catch {}
    setSending(false);
  };

  const ensureStreamGroup = async () => {
    if (!stream) return;
    await fetch("/api/chat/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: `stream-${stream.id}`, name: stream.title, streamId: stream.id }),
    }).catch(() => {});
  };

  useEffect(() => { if (stream) ensureStreamGroup(); }, [stream?.id]);

  const startBroadcast = async () => {
    try {
      setCameraError(null);
      const ms = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(ms);
      if (videoRef.current) videoRef.current.srcObject = ms;
      setVideoEnabled(true);
      setAudioEnabled(true);
      setIsBroadcasting(true);
    } catch (e: any) {
      const msg = e.name === "NotAllowedError" || e.name === "PermissionDeniedError"
        ? "تم رفض إذن الكاميرا. يرجى السماح في إعدادات المتصفح."
        : e.name === "NotFoundError"
        ? "لم يتم العثور على كاميرا."
        : e.name === "NotReadableError"
        ? "الكاميرا مستخدمة من قبل تطبيق آخر."
        : "تعذر الوصول إلى الكاميرا. جرب HTTPS أو تحقق من الإعدادات.";
      setCameraError(msg);
    }
  };

  const stopBroadcast = () => {
    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
      setLocalStream(null);
    }
    setVideoEnabled(false);
    setAudioEnabled(false);
    setIsBroadcasting(false);
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((t) => t.enabled = !videoEnabled);
      setVideoEnabled(!videoEnabled);
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((t) => t.enabled = !audioEnabled);
      setAudioEnabled(!audioEnabled);
    }
  };

  const sendGift = async (giftType: GiftType) => {
    if (!isAuthenticated || !stream || sendingGift || !currentUser) return;
    setSendingGift(true);
    try {
      const res = await fetch("/api/gifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: stream.userId, giftTypeId: giftType.id, streamId: stream.id }),
      });
      const data = await res.json();
      if (data.success) {
        setGiftAnimation({ icon: giftType.icon, sender: data.gift.sender, name: giftType.name });
        setTimeout(() => setGiftAnimation(null), 3000);
      } else {
        alert(data.error || "حدث خطأ");
      }
    } catch {}
    setSendingGift(false);
  };

  if (loading) return <div className="text-center py-20 text-gray-400">جاري التحميل...</div>;
  if (!stream) return <div className="text-center py-20 text-gray-400">البث غير موجود</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 min-w-0">
          <div className="rounded-xl overflow-hidden bg-black relative">
            <div className="aspect-video flex items-center justify-center bg-gradient-to-br from-brand-card to-black relative">
              {isBroadcasting && videoEnabled ? (
                <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
              ) : isBroadcasting && !videoEnabled ? (
                <div className="text-center">
                  <Camera className="w-16 h-16 text-gray-700 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">الكاميرا متوقفة</p>
                </div>
              ) : stream.user?.image ? (
                <Image src={stream.user.image} alt="" width={320} height={240} className="object-cover w-full h-full opacity-60" />
              ) : (
                <Radio className="w-20 h-20 text-gray-700" />
              )}
              {giftAnimation && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-bounce">
                  <div className="text-7xl">{giftAnimation.icon}</div>
                </div>
              )}
            </div>
            <div className="absolute top-3 right-3 bg-red-600 text-white text-sm px-3 py-1 rounded-full font-bold flex items-center gap-1.5 animate-pulse">
              <span className="w-2.5 h-2.5 bg-white rounded-full" /> LIVE
            </div>
            <div className="absolute top-3 left-3 bg-black/80 text-white text-sm px-3 py-1 rounded-full flex items-center gap-1.5">
              <Eye className="w-4 h-4" /> {stream.viewerCount}
            </div>
            {giftAnimation && (
              <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-500/90 to-pink-500/90 text-white px-4 py-2 rounded-full font-bold animate-slide-up text-sm whitespace-nowrap shadow-glow">
                {giftAnimation.sender} أرسل {giftAnimation.icon} {giftAnimation.name}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mt-3">
            <div>
              <h1 className="text-xl font-bold">{stream.title}</h1>
              <Link href={`/user/${stream.userId}`} className="text-gray-400 mt-1 flex items-center gap-2 hover:text-brand-accent">
                <div className="w-7 h-7 rounded-full bg-brand-accent/20 overflow-hidden flex items-center justify-center text-xs font-bold">
                  {stream.user?.image ? <Image src={stream.user.image} alt="" width={28} height={28} className="object-cover" /> : (stream.user?.name?.[0] || "U")}
                </div>
                {stream.user?.name}
              </Link>
            </div>
            {canStream && (
              <div className="flex gap-2 items-center">
                {cameraError && (
                  <div className="text-xs text-red-400 bg-red-500/10 px-3 py-1 rounded-lg border border-red-500/30">{cameraError}</div>
                )}
                {!isBroadcasting ? (
                  <button onClick={startBroadcast} className="glow-button flex items-center gap-2 px-4 py-2 text-sm">
                    <Camera className="w-4 h-4" /> بدء البث
                  </button>
                ) : (
                  <>
                    <button onClick={toggleVideo} className={`p-2 rounded-lg border ${videoEnabled ? "bg-brand-accent/20 border-brand-accent/30 text-brand-accent" : "bg-red-500/20 border-red-500/30 text-red-400"}`}>
                      {videoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                    </button>
                    <button onClick={toggleAudio} className={`p-2 rounded-lg border ${audioEnabled ? "bg-brand-accent/20 border-brand-accent/30 text-brand-accent" : "bg-red-500/20 border-red-500/30 text-red-400"}`}>
                      {audioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                    </button>
                    <button onClick={stopBroadcast} className="glow-button flex items-center gap-2 px-4 py-2 text-sm bg-red-600 hover:bg-red-700">
                      <X className="w-4 h-4" /> إنهاء
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="mt-4 flex gap-2">
            <button onClick={() => setShowGifts(!showGifts)} className="glow-button flex items-center gap-2 px-4 py-2 text-sm">
              <Gift className="w-4 h-4" /> هدايا
            </button>
          </div>

          {showGifts && (
            <div className="card-adult p-4 mt-2 grid grid-cols-5 sm:grid-cols-10 gap-2">
              {giftTypes.map((gift) => (
                <button key={gift.id} onClick={() => sendGift(gift)} disabled={!isAuthenticated || sendingGift}
                  className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-brand-hover border border-transparent hover:border-brand-accent/30 transition disabled:opacity-50">
                  <span className="text-2xl">{gift.icon}</span>
                  <span className="text-[10px] text-gray-400">{gift.price}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="w-full lg:w-80 flex flex-col h-[500px] lg:h-[calc(100vh-180px)]">
          <div className="flex items-center gap-2 mb-2">
            <MessageCircle className="w-4 h-4 text-brand-accent" />
            <span className="text-sm font-semibold">الدردشة</span>
            <span className="text-xs text-gray-600">({messages.length})</span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 mb-2 bg-brand-card/50 rounded-xl p-3 border border-brand-border/50">
            {messages.length === 0 && (
              <div className="text-center py-6 text-gray-500 text-sm">لا توجد رسائل</div>
            )}
            {messages.map((msg) => {
              const labels: string[] = (() => { try { return JSON.parse(msg.user.labels || "[]"); } catch { return []; } })();
              return (
                <div key={msg.id} className="flex items-start gap-2">
                  <Link href={`/user/${msg.user.id}`} className="shrink-0">
                    <div className="w-6 h-6 rounded-full bg-brand-accent/20 flex items-center justify-center text-[10px] font-bold text-brand-accent overflow-hidden hover:ring-1 ring-brand-accent/50">
                      {msg.user.image ? <Image src={msg.user.image} alt="" width={24} height={24} className="object-cover" /> : (msg.user.name?.[0] || "U")}
                    </div>
                  </Link>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1 flex-wrap">
                      <Link href={`/user/${msg.user.id}`} className="text-xs font-semibold text-brand-accent hover:underline">{msg.user.name}</Link>
                      {labels.slice(0, 1).map((l) => (
                        <span key={l} className={`text-[8px] px-1 py-px rounded border ${ADULT_LABEL_COLORS[l] || "bg-gray-600/30 text-gray-400 border-gray-500/30"}`}>{l}</span>
                      ))}
                    </div>
                    <p className="text-xs text-gray-300 break-words">{msg.text}</p>
                  </div>
                </div>
              );
            })}
            <div ref={chatBottomRef} />
          </div>
          <form onSubmit={handleSend} className="flex gap-2">
            <input value={text} onChange={(e) => setText(e.target.value)}
              placeholder={isAuthenticated ? "..." : "سجل دخولك"}
              disabled={!isAuthenticated} maxLength={500}
              className="input-field flex-1 text-sm disabled:opacity-50" />
            <button type="submit" disabled={!isAuthenticated || !text.trim() || sending}
              className="glow-button px-3 disabled:opacity-50">
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
