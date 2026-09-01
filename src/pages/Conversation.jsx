import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import BackButton from "@/components/BackButton";
import { useToast } from "@/components/ui/use-toast";
import { Send, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProfileNames } from "@/hooks/useProfileNames";

export default function Conversation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [me, setMe] = useState(null);
  const [convo, setConvo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const scrollRef = useRef(null);

  const deleteMessage = async (m) => {
    if (!window.confirm("Delete this message?")) return;
    setDeletingId(m.id);
    try {
      await base44.entities.Message.delete(m.id);
      setMessages((prev) => prev.filter((x) => x.id !== m.id));
    } catch {
      toast({ title: "Could not delete message", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };
  const { nameFor } = useProfileNames();

  useEffect(() => {
    base44.auth.me().then(setMe).catch(() => {});
    Promise.all([
      base44.entities.Conversation.get(id),
      base44.entities.Message.filter({ conversation_id: id }, "created_date", 500),
    ])
      .then(([c, m]) => { setConvo(c); setMessages(m || []); })
      .catch(() => setConvo(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, loading]);

  const otherName = (() => {
    if (!me || !convo) return "Conversation";
    const idx = (convo.participant_ids || []).findIndex((pid) => pid !== me.id);
    const otherId = convo.participant_ids?.[idx];
    return nameFor(otherId, convo.participant_names?.[idx] || "Unknown");
  })();

  const send = async () => {
    if (!text.trim() || !me || !convo) return;
    const content = text.trim();
    setText("");
    setBusy(true);
    try {
      const msg = await base44.entities.Message.create({
        conversation_id: id,
        content,
        sender_id: me.id,
        sender_name: me.full_name || me.email || "Unknown",
        participant_ids: convo.participant_ids || [],
      });
      setMessages((prev) => [...prev, msg]);
      await base44.entities.Conversation.update(id, {
        last_message: content.slice(0, 80),
        last_message_date: new Date().toISOString(),
      });
    } catch {
      toast({ title: "Could not send message", variant: "destructive" });
      setText(content);
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!convo) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <p className="text-sm text-muted-foreground">Conversation not found.</p>
        <Link to="/messages" className="text-sm text-rose-600 font-medium">Back to messages</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-sky-50 via-white to-slate-100" />

      <main className="app-main px-3">
        <div className="mx-auto max-w-2xl flex flex-col" style={{ minHeight: "calc(100vh - var(--safe-top) - var(--safe-bottom) - 6rem)" }}>
          <BackButton to="/messages" label="Back to Messages" className="py-2" />

          <div className="flex items-center gap-2.5 pb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white text-sm font-semibold">
              {otherName?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="text-base font-semibold text-foreground">{otherName}</div>
              <div className="text-[11px] text-muted-foreground">Direct message</div>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 glass-card p-3 space-y-2 overflow-y-auto overscroll-y-contain" style={{ minHeight: "40vh" }}>
            {messages.length === 0 && (
              <p className="text-center text-sm text-muted-foreground/70 py-8">No messages yet. Say hi 👋</p>
            )}
            {messages.map((m) => {
              const mine = me && m.sender_id === me.id;
              return (
                <div key={m.id} className={cn("flex flex-col gap-0.5", mine ? "items-end" : "items-start")}>
                  <div
                    className={cn(
                      "max-w-[80%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap",
                      mine
                        ? "rounded-tr-md bg-rose-600 text-white"
                        : "rounded-tl-md bg-foreground/5 text-foreground"
                    )}
                  >
                    {m.content}
                  </div>
                  {mine && (
                    <button
                      onClick={() => deleteMessage(m)}
                      disabled={deletingId === m.id}
                      className="text-muted-foreground/50 hover:text-rose-500 no-select disabled:opacity-50 px-1"
                      aria-label="Delete message"
                    >
                      {deletingId === m.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="glass-card p-2.5 flex items-end gap-2 mt-3 sticky bottom-4">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Type a message…"
              rows={1}
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none max-h-32 py-1.5"
            />
            <button
              onClick={send}
              disabled={busy || !text.trim()}
              className="w-11 h-11 rounded-full flex items-center justify-center bg-rose-600 text-white disabled:opacity-40 hover:bg-rose-700 transition-colors no-select shrink-0"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}