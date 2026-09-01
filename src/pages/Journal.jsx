import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import JournalEntryCard from "@/components/JournalEntryCard";
import JournalStats from "@/components/JournalStats";
import PullToRefresh from "@/components/PullToRefresh";
import { getPendingEntries, removePendingEntry, pendingCount } from "@/lib/offlineJournal";
import { Loader2, Plus, BookOpen, Target, Users, Dumbbell, WifiOff, Trophy, HeartPulse, Activity, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const MOOD_EMOJIS = { great: "🤩", good: "🙂", neutral: "😐", tough: "😤", frustrated: "😣" };

const hubCards = [
  { to: "/journal/techniques", label: "Techniques", icon: Dumbbell },
  { to: "/journal/goals", label: "Goals", icon: Target },
  { to: "/journal/partners", label: "Partners", icon: Users },
  { to: "/journal/competitions", label: "Comps", icon: Trophy },
  { to: "/journal/injuries", label: "Recovery", icon: HeartPulse },
  { to: "/journal/rolls", label: "Rolls", icon: Activity },
];

export default function Journal() {
  const { toast } = useToast();
  const { user } = useAuth();
  const meId = user?.id || null;
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(0);
  const [trainingDays, setTrainingDays] = useState([]);
  const [query, setQuery] = useState("");
  const [moodFilter, setMoodFilter] = useState("");

  const load = useCallback(async () => {
    try {
      const list = await base44.entities.JournalEntry.list("-training_date", 50);
      setEntries(list);
    } finally {
      setLoading(false);
    }
  }, []);

  const syncOffline = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.onLine) return;
    const list = getPendingEntries();
    if (list.length === 0) { setPending(0); return; }
    let synced = 0;
    for (const e of list) {
      const { _pendingId, ...payload } = e;
      try {
        await base44.entities.JournalEntry.create({
          ...payload,
          duration_minutes: payload.duration_minutes === "" || payload.duration_minutes == null ? null : Number(payload.duration_minutes),
        });
        removePendingEntry(_pendingId);
        synced++;
      } catch {}
    }
    setPending(pendingCount());
    if (synced > 0) {
      toast({ title: `Synced ${synced} offline entr${synced === 1 ? "y" : "ies"}` });
      load();
    }
  }, [load, toast]);

  useEffect(() => {
    setPending(pendingCount());
    load();
    syncOffline();
    const onOnline = () => syncOffline();
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [load, syncOffline]);

  useEffect(() => {
    if (!meId) return;
    base44.entities.Profile.filter({ user_id: meId })
      .then((p) => setTrainingDays(p?.[0]?.training_days || []))
      .catch(() => {});
  }, [meId]);

  const handleRefresh = async () => {
    try { await syncOffline(); await load(); } finally {}
  };

  const myEntries = meId ? entries.filter((e) => e.created_by_id === meId) : entries;

  const filtered = entries.filter((e) => {
    if (moodFilter && e.mood !== moodFilter) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    const hay = [e.title, e.notes, e.techniques, e.partners].filter(Boolean).join(" ").toLowerCase();
    return hay.includes(q);
  });

  return (
    <main className="app-main px-3">
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Training Journal</h1>
            <p className="text-sm text-muted-foreground mt-1">Track every roll</p>
          </div>
          <Link
            to="/journal/new"
            className="sm:hidden flex items-center justify-center w-11 h-11 rounded-full bg-rose-600 text-white shadow-lg shadow-rose-500/30 no-select"
          >
            <Plus className="w-5 h-5" />
          </Link>
        </div>

        {/* Hub cards */}
        <div className="grid grid-cols-6 gap-2 no-select">
          {hubCards.map((c) => {
            const Icon = c.icon;
            return (
              <Link
                key={c.to}
                to={c.to}
                className="glass-card p-2.5 flex flex-col items-center gap-1.5 hover:bg-foreground/5 transition-colors col-span-2"
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-rose-500/10 text-rose-600">
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-medium text-foreground text-center leading-tight">{c.label}</span>
              </Link>
            );
          })}
        </div>

        <JournalStats entries={myEntries} trainingDays={trainingDays} />

        <Link
          to="/journal/new"
          className="hidden sm:flex glass-card p-4 items-center justify-center gap-2 text-sm font-medium text-rose-600 hover:bg-rose-500/5 transition-colors no-select"
        >
          <Plus className="w-4 h-4" />
          Log a new session
        </Link>

        {pending > 0 && (
          <div className="glass-card p-3 flex items-center gap-2 text-sm">
            <WifiOff className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="flex-1 text-foreground">{pending} offline entr{pending === 1 ? "y" : "ies"} waiting to sync</span>
            <button onClick={syncOffline} disabled={typeof navigator !== "undefined" && !navigator.onLine} className="text-xs font-medium text-rose-600 disabled:opacity-40 no-select">Sync now</button>
          </div>
        )}

        {entries.length > 0 && (
          <div className="space-y-2">
            <div className="glass-card p-2.5 flex items-center gap-2">
              <Search className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search title, notes, technique, or partner"
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
              />
              {query && (
                <button onClick={() => setQuery("")} className="text-xs text-muted-foreground no-select">Clear</button>
              )}
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto no-select pb-1">
              <button onClick={() => setMoodFilter("")} className={cn("text-xs px-2.5 py-1 rounded-full whitespace-nowrap", !moodFilter ? "bg-foreground text-background" : "bg-foreground/5 text-muted-foreground")}>All</button>
              {Object.entries(MOOD_EMOJIS).map(([m, emoji]) => (
                <button key={m} onClick={() => setMoodFilter((prev) => (prev === m ? "" : m))} className={cn("text-xs px-2.5 py-1 rounded-full whitespace-nowrap flex items-center gap-1", moodFilter === m ? "bg-foreground text-background" : "bg-foreground/5 text-muted-foreground")}>
                  <span>{emoji}</span><span className="capitalize">{m}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <PullToRefresh onRefresh={handleRefresh}>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : entries.length === 0 ? (
            <div className="glass-card p-10 text-center space-y-3">
              <BookOpen className="w-10 h-10 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">No sessions logged yet. Start journaling your training.</p>
              <Link to="/journal/new" className="inline-flex items-center gap-1.5 text-sm font-medium text-rose-600 no-select">
                <Plus className="w-4 h-4" /> Log your first session
              </Link>
            </div>
          ) : filtered.length === 0 ? (
            <div className="glass-card p-8 text-center space-y-2">
              <p className="text-sm text-muted-foreground">No sessions match your search.</p>
              <button onClick={() => { setQuery(""); setMoodFilter(""); }} className="text-sm font-medium text-rose-600 no-select">Clear filters</button>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((e) => <JournalEntryCard key={e.id} entry={e} />)}
            </div>
          )}
        </PullToRefresh>
      </div>
    </main>
  );
}