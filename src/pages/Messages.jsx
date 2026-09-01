import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { MessageCircle, Loader2, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProfileNames } from "@/hooks/useProfileNames";
import MatTapGame from "@/components/MatTapGame";

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function Messages() {
  const { user: me } = useAuth();
  const { nameFor } = useProfileNames();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [convos, setConvos] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(null);
  const [readMap, setReadMap] = useState(() => {
    try { return JSON.parse(localStorage.getItem("tenzan:msgRead") || "{}"); } catch { return {}; }
  });

  const isUnread = (c) => c.last_message_date && (!readMap[c.id] || new Date(c.last_message_date) > new Date(readMap[c.id]));
  const markRead = (c) => {
    const next = { ...readMap, [c.id]: new Date().toISOString() };
    setReadMap(next);
    try { localStorage.setItem("tenzan:msgRead", JSON.stringify(next)); } catch {}
  };

  useEffect(() => {
    Promise.all([
      base44.entities.Conversation.list("-last_message_date", 100).catch(() => []),
      base44.entities.Profile.list("-created_date", 200).catch(() => []),
    ]).then(([c, p]) => {
      setConvos(c || []);
      setProfiles(p || []);
    }).finally(() => setLoading(false));
  }, []);

  const otherOf = (convo) => {
    if (!me) return { name: "Conversation", id: null };
    const idx = (convo.participant_ids || []).findIndex((pid) => pid !== me.id);
    const otherId = convo.participant_ids?.[idx];
    return { name: nameFor(otherId, convo.participant_names?.[idx] || "Unknown"), id: otherId };
  };

  const existingOtherIds = new Set(convos.map((c) => otherOf(c).id).filter(Boolean));
  const otherMembers = profiles.filter((p) => p.user_id && p.user_id !== me?.id && !existingOtherIds.has(p.user_id));

  const startChat = async (member) => {
    if (!me || !member.user_id) return;
    setStarting(member.user_id);
    try {
      const existing = convos.find((c) => c.participant_ids?.includes(member.user_id));
      if (existing) { navigate(`/messages/${existing.id}`); return; }
      const convo = await base44.entities.Conversation.create({
        participant_ids: [me.id, member.user_id],
        participant_names: [me?.full_name || me?.email || "You", member.user_name],
        last_message: "",
      });
      setConvos((prev) => [convo, ...prev]);
      navigate(`/messages/${convo.id}`);
    } catch {
      toast({ title: "Could not start chat", variant: "destructive" });
    } finally {
      setStarting(null);
    }
  };

  return (
    <main className="app-main px-3">
        <div className="mx-auto max-w-2xl space-y-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Messages</h1>
            <p className="text-sm text-muted-foreground mt-1">Direct chats with your training partners</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              {convos.length > 0 && (
                <div className="space-y-2">
                  {convos.map((c) => {
                    const other = otherOf(c);
                    return (
                      <Link
                        key={c.id}
                        to={`/messages/${c.id}`}
                        onClick={() => markRead(c)}
                        className="glass-card p-3.5 flex items-center gap-3 hover:bg-foreground/5 transition-colors no-select"
                      >
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white text-sm font-semibold shrink-0">
                          {other.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className={cn("text-sm truncate", isUnread(c) ? "font-bold text-foreground" : "font-semibold text-foreground")}>{other.name}</span>
                            <span className="text-[10px] text-muted-foreground shrink-0">{timeAgo(c.last_message_date)}</span>
                          </div>
                          <p className={cn("text-xs truncate mt-0.5", isUnread(c) ? "text-foreground font-medium" : "text-muted-foreground")}>
                            {c.last_message || "Start the conversation"}
                          </p>
                        </div>
                        {isUnread(c) && <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />}
                      </Link>
                    );
                  })}
                </div>
              )}

              {otherMembers.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground px-1 pt-1 flex items-center gap-1.5">
                    <UserPlus className="w-3 h-3" />
                    {convos.length > 0 ? "Start a new chat" : "Message a teammate"}
                  </div>
                  {otherMembers.map((m) => {
                    const name = nameFor(m.user_id, m.user_name);
                    return (
                      <button
                        key={m.user_id}
                        onClick={() => startChat(m)}
                        disabled={starting === m.user_id}
                        className="glass-card p-3.5 w-full flex items-center gap-3 hover:bg-foreground/5 transition-colors no-select disabled:opacity-60 text-left"
                      >
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-slate-500 to-slate-700 flex items-center justify-center text-white text-sm font-semibold shrink-0">
                          {name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-foreground truncate">{name}</div>
                          <p className="text-xs text-muted-foreground mt-0.5">Tap to start a chat</p>
                        </div>
                        {starting === m.user_id && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}

              {convos.length === 0 && otherMembers.length === 0 && (
                <div className="glass-card p-10 text-center space-y-3">
                  <MessageCircle className="w-10 h-10 text-muted-foreground mx-auto" />
                  <p className="text-sm text-muted-foreground">No teammates to message yet.</p>
                  <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-rose-600 no-select">
                    Browse the feed
                  </Link>
                </div>
              )}
            </div>
          )}
          <MatTapGame />
        </div>
    </main>
  );
}