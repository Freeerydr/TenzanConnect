import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/AuthContext";
import PostCard from "@/components/PostCard";
import PostComposer from "@/components/PostComposer";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import QuoteOfWeekCard from "@/components/QuoteOfWeekCard";
import PullToRefresh from "@/components/PullToRefresh";
import InviteFriend from "@/components/InviteFriend";
import PrivateWithKeith from "@/components/PrivateWithKeith";
import SelfCheckIn from "@/components/SelfCheckIn";
import DaysSinceTrained from "@/components/DaysSinceTrained";
import { Loader2, CalendarDays, Users, ClipboardCheck, MessageCircle } from "lucide-react";

export default function Home() {
  const { user: me } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState(() => {
    try { return JSON.parse(localStorage.getItem("tenzan:feed:posts") || "[]"); } catch { return []; }
  });
  const [loading, setLoading] = useState(() => {
    try { return JSON.parse(localStorage.getItem("tenzan:feed:posts") || "[]").length === 0; } catch { return true; }
  });
  const [cutoff, setCutoff] = useState(() => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const load = useCallback(async () => {
    try {
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const list = await base44.entities.Post.filter({ created_date: { $gte: since } }, "-created_date", 200);
      setPosts(list);
      setCutoff(since);
      const older = await base44.entities.Post.filter({ created_date: { $lt: since } }, "-created_date", 1);
      setHasMore(older.length > 0);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const end = cutoff;
      const start = new Date(new Date(end).getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
      const block = await base44.entities.Post.filter({ created_date: { $gte: start, $lt: end } }, "-created_date", 200);
      setPosts((prev) => [...prev, ...block]);
      setCutoff(start);
      const older = await base44.entities.Post.filter({ created_date: { $lt: start } }, "-created_date", 1);
      setHasMore(older.length > 0);
    } catch {
      toast({ title: "Could not load more posts", variant: "destructive" });
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => { load(); }, [load]);

  // Persist the feed so it survives refreshes and restores instantly.
  useEffect(() => {
    try { localStorage.setItem("tenzan:feed:posts", JSON.stringify(posts)); } catch {}
  }, [posts]);

  // Live-update the feed so announcements removed elsewhere (e.g. when an
  // admin deletes its linked event) disappear without a manual refresh.
  useEffect(() => {
    const unsubscribe = base44.entities.Post.subscribe((event) => {
      const { type, data } = event || {};
      if (!data) return;
      setPosts((prev) => {
        if (type === "create") return prev.some((p) => p.id === data.id) ? prev : [data, ...prev];
        if (type === "update") return prev.map((p) => (p.id === data.id ? data : p));
        if (type === "delete") return prev.filter((p) => p.id !== data.id);
        return prev;
      });
    });
    return unsubscribe;
  }, []);

  const handleRefresh = async () => {
    try { await load(); } finally {}
  };

  const handlePosted = (p) => {
    if (p._removeId) {
      setPosts((prev) => prev.filter((x) => x.id !== p._removeId));
      return;
    }
    if (p._replaceId) {
      setPosts((prev) => {
        const idx = prev.findIndex((x) => x.id === p._replaceId);
        if (idx === -1) return prev;
        const copy = [...prev];
        const { _replaceId, ...rest } = p;
        copy[idx] = rest;
        return copy;
      });
      return;
    }
    setPosts((prev) => [p, ...prev]);
  };

  const announcements = posts.filter((p) => p.is_announcement);
  const regular = posts.filter((p) => !p.is_announcement);
  const sevenAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  return (
    <main className="app-main px-3">
      <div className="mx-auto max-w-2xl space-y-5">
        <QuoteOfWeekCard isAdmin={me?.role === "admin"} />

        <div className="flex gap-2 no-select">
          <Link to="/events" className="glass-card p-2.5 flex-1 flex flex-col items-center gap-1.5 hover:bg-foreground/5 transition-colors">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-emerald-600 bg-emerald-500/10"><CalendarDays className="w-4 h-4" /></div>
            <span className="text-[10px] font-medium text-foreground">Events</span>
          </Link>
          <Link to="/members" className="glass-card p-2.5 flex-1 flex flex-col items-center gap-1.5 hover:bg-foreground/5 transition-colors">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-indigo-600 bg-indigo-500/10"><Users className="w-4 h-4" /></div>
            <span className="text-[10px] font-medium text-foreground">Members</span>
          </Link>
          <Link to="/study-groups" className="glass-card p-2.5 flex-1 flex flex-col items-center gap-1.5 hover:bg-foreground/5 transition-colors">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-violet-600 bg-violet-500/10"><MessageCircle className="w-4 h-4" /></div>
            <span className="text-[10px] font-medium text-foreground">Groups</span>
          </Link>
          {me?.role === "admin" && (
            <Link to="/admin/attendance" className="glass-card p-2.5 flex-1 flex flex-col items-center gap-1.5 hover:bg-foreground/5 transition-colors">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-amber-600 bg-amber-500/10"><ClipboardCheck className="w-4 h-4" /></div>
              <span className="text-[10px] font-medium text-foreground">Attendance</span>
            </Link>
          )}
        </div>

        <DaysSinceTrained />
        <SelfCheckIn />

        <PostComposer onPosted={handlePosted} />

        <div className="flex gap-2 no-select">
          <div className="flex-1 min-w-0"><InviteFriend /></div>
          <div className="flex-1 min-w-0"><PrivateWithKeith /></div>
        </div>

        <PullToRefresh onRefresh={handleRefresh}>
          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {announcements.length > 0 && (
                  <div className="space-y-2">
                    {announcements.map((a) => <AnnouncementBanner key={a.id} post={a} />)}
                  </div>
                )}
                {regular.length === 0 ? (
                  <div className="glass-card p-8 text-center">
                    <p className="text-sm text-muted-foreground">No messages yet. Start the conversation.</p>
                  </div>
                ) : (
                  <>
                    {regular.flatMap((p, i) => {
                      const isOlder = new Date(p.created_date) < sevenAgo;
                      const prevOlder = i > 0 && new Date(regular[i - 1].created_date) < sevenAgo;
                      const nodes = [];
                      if (isOlder && !prevOlder) {
                        nodes.push(
                          <div key="older-divider" className="flex items-center gap-2 pt-2">
                            <div className="flex-1 h-px bg-foreground/10" />
                            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Older posts</span>
                            <div className="flex-1 h-px bg-foreground/10" />
                          </div>
                        );
                      }
                      nodes.push(<PostCard key={p.id} post={p} isMine={me != null && p.created_by_id === me.id} me={me} onDelete={(pid) => setPosts((prev) => prev.filter((x) => x.id !== pid))} />);
                      return nodes;
                    })}
                    {hasMore ? (
                      <button onClick={loadMore} disabled={loadingMore} className="w-full glass-card p-3 mt-2 flex items-center justify-center gap-2 text-sm font-medium text-foreground hover:bg-foreground/5 transition-colors no-select disabled:opacity-60">
                        {loadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : "Load more"}
                      </button>
                    ) : (
                      <p className="text-center text-xs text-muted-foreground py-4">No more posts</p>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </PullToRefresh>
      </div>
    </main>
  );
}