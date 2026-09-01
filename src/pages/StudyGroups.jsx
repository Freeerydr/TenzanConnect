import React, { useEffect, useState } from "react";
import BackButton from "@/components/BackButton";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, ArrowLeft, Send, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProfileNames } from "@/hooks/useProfileNames";

const GROUPS = [
  { value: "guard", label: "Guard", description: "Open, closed, half, spider — playing off your back" },
  { value: "passing", label: "Passing", description: "Knee cut, toreando, leg drag — getting around the legs" },
  { value: "submissions", label: "Submissions", description: "Armbars, chokes, leg locks — finishing holds" },
  { value: "escapes", label: "Escapes", description: "Side control, mount, back — getting out" },
  { value: "takedowns", label: "Takedowns", description: "Single, double, pulls — getting it to the ground" },
  { value: "defense", label: "Defense", description: "Defending passes and submissions — surviving" },
  { value: "other", label: "Other", description: "Anything else on the mats" },
];

export default function StudyGroups() {
  const { toast } = useToast();
  const [me, setMe] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const { nameFor } = useProfileNames();

  useEffect(() => {
    base44.auth.me().then(setMe).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selected) { setMessages([]); return; }
    setLoading(true);
    base44.entities.GroupMessage.filter({ group_id: selected }, "created_date", 500)
      .then(setMessages)
      .catch(() => setMessages([]))
      .finally(() => setLoading(false));
  }, [selected]);

  const send = async () => {
    if (!text.trim() || !selected) return;
    const content = text.trim();
    setText("");
    setBusy(true);
    try {
      const m = await base44.entities.GroupMessage.create({
        group_id: selected,
        content,
        author_name: me?.full_name || me?.email || "Member",
      });
      setMessages((prev) => [...prev, m]);
    } catch {
      toast({ title: "Could not post message", variant: "destructive" });
      setText(content);
    } finally {
      setBusy(false);
    }
  };

  const current = GROUPS.find((g) => g.value === selected);

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-violet-50 via-white to-slate-100" />
      <main className="app-main px-3">
        <div className="mx-auto max-w-2xl space-y-4">
          {selected ? (
            <>
              <button onClick={() => setSelected(null)} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground no-select">
                <ArrowLeft className="w-4 h-4" /> All positions
              </button>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold tracking-tight text-foreground">{current.label}</h1>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 uppercase tracking-wide">Beta</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{current.description}</p>
              </div>

              <div className="glass-card p-3 space-y-2 min-h-[40vh]">
                {loading ? (
                  <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
                ) : messages.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground/70 py-8">No messages yet. Start the discussion.</p>
                ) : (
                  messages.map((m) => {
                    const mine = me && m.created_by_id === me.id;
                    return (
                      <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                        <div className={cn("max-w-[80%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap", mine ? "rounded-tr-md bg-rose-600 text-white" : "rounded-tl-md bg-foreground/5 text-foreground")}>
                          {!mine && <div className="text-[10px] font-semibold text-muted-foreground mb-0.5">{nameFor(m.created_by_id, m.author_name)}</div>}
                          {m.content}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="glass-card p-2.5 flex items-end gap-2 sticky bottom-4">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                  placeholder="Type a message…"
                  rows={1}
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none max-h-32 py-1.5"
                />
                <button onClick={send} disabled={busy || !text.trim()} className="w-11 h-11 rounded-full flex items-center justify-center bg-rose-600 text-white disabled:opacity-40 hover:bg-rose-700 transition-colors no-select shrink-0">
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </>
          ) : (
            <>
              <BackButton to="/" label="Back to Feed" />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight text-foreground">Groups</h1>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 uppercase tracking-wide">Beta</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">Pick a position and trade ideas with the crew</p>
              </div>

              <div className="space-y-2.5">
                {GROUPS.map((g) => (
                  <button key={g.value} onClick={() => setSelected(g.value)} className="glass-card p-4 w-full text-left flex items-start gap-3 hover:bg-foreground/5 transition-colors no-select cursor-pointer">
                    <div className="w-10 h-10 rounded-full bg-violet-500/15 flex items-center justify-center shrink-0">
                      <MessageCircle className="w-5 h-5 text-violet-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">{g.label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{g.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}