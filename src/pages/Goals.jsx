import React, { useEffect, useState } from "react";
import BackButton from "@/components/BackButton";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Trash2, Check, Loader2, Target } from "lucide-react";
import { cn } from "@/lib/utils";

const types = [
  { value: "session_count", label: "Sessions" },
  { value: "mat_hours", label: "Mat hours" },
  { value: "competition", label: "Competition" },
  { value: "custom", label: "Custom" },
];

function computeProgress(goal, entries) {
  if (goal.type === "session_count" || goal.type === "mat_hours") {
    const start = new Date(goal.created_date);
    const end = goal.deadline ? new Date(goal.deadline) : new Date(8640000000000000);
    const within = entries.filter((e) => {
      const d = e.training_date ? new Date(e.training_date) : null;
      return d && d >= start && d <= end;
    });
    if (goal.type === "session_count") return { current: within.length, target: goal.target || 0, unit: "sessions" };
    const mins = within.reduce((s, e) => s + (e.duration_minutes || 0), 0);
    return { current: Math.round((mins / 60) * 10) / 10, target: goal.target || 0, unit: "hours" };
  }
  if (goal.type === "custom") return { current: goal.current || 0, target: goal.target || 0, unit: "" };
  return null;
}

export default function Goals() {
  const { toast } = useToast();
  const [goals, setGoals] = useState([]);
  const [entries, setEntries] = useState([]);
  const [meId, setMeId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: "", type: "session_count", target: "", deadline: "" });

  useEffect(() => {
    base44.auth.me().then((u) => setMeId(u?.id || null)).catch(() => {});
    Promise.all([
      base44.entities.Goal.list("-created_date", 100),
      base44.entities.JournalEntry.list("-training_date", 200),
    ]).then(([g, e]) => { setGoals(g); setEntries(e); }).finally(() => setLoading(false));
  }, []);

  const myEntries = meId ? entries.filter((e) => e.created_by_id === meId) : entries;

  const add = async () => {
    if (!form.title.trim()) return;
    try {
      const g = await base44.entities.Goal.create({
        title: form.title.trim(),
        type: form.type,
        target: form.target === "" ? null : Number(form.target),
        deadline: form.deadline || null,
        completed: false,
        current: 0,
      });
      setGoals((prev) => [g, ...prev]);
      setForm({ title: "", type: "session_count", target: "", deadline: "" });
      setAdding(false);
    } catch {
      toast({ title: "Could not add goal", variant: "destructive" });
    }
  };

  const toggleComplete = async (g) => {
    const next = !g.completed;
    setGoals((prev) => prev.map((x) => (x.id === g.id ? { ...x, completed: next } : x)));
    try {
      await base44.entities.Goal.update(g.id, { completed: next });
    } catch {
      setGoals((prev) => prev.map((x) => (x.id === g.id ? { ...x, completed: g.completed } : x)));
      toast({ title: "Could not update goal", variant: "destructive" });
    }
  };

  const increment = async (g) => {
    const cur = (g.current || 0) + 1;
    const prevCur = g.current || 0;
    setGoals((prev) => prev.map((x) => (x.id === g.id ? { ...x, current: cur } : x)));
    try {
      await base44.entities.Goal.update(g.id, { current: cur });
    } catch {
      setGoals((prev) => prev.map((x) => (x.id === g.id ? { ...x, current: prevCur } : x)));
      toast({ title: "Could not update progress", variant: "destructive" });
    }
  };

  const remove = async (g) => {
    try {
      await base44.entities.Goal.delete(g.id);
      setGoals((prev) => prev.filter((x) => x.id !== g.id));
    } catch {}
  };

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-amber-50 via-white to-slate-100" />
      <main className="app-main px-3">
        <div className="mx-auto max-w-2xl space-y-4">
          <BackButton to="/journal" label="Back to Journal" />
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Goals</h1>
              <p className="text-sm text-muted-foreground mt-1">Set targets and track your progress</p>
            </div>
            <button onClick={() => setAdding((v) => !v)} className="w-11 h-11 rounded-full bg-rose-600 text-white flex items-center justify-center no-select">
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {adding && (
            <div className="glass-card p-4 space-y-3">
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Goal — e.g. '5 open-guard sessions this month'"
                className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
              />
              <div className="flex gap-2 flex-wrap">
                {types.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setForm((f) => ({ ...f, type: t.value }))}
                    className={cn("text-[10px] px-2 py-1 rounded-full", form.type === t.value ? "bg-foreground text-background" : "bg-foreground/5 text-muted-foreground")}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              {form.type !== "competition" && (
                <input
                  type="number"
                  value={form.target}
                  onChange={(e) => setForm((f) => ({ ...f, target: e.target.value }))}
                  placeholder="Target number"
                  className="w-32 bg-foreground/5 rounded-full px-3 py-1.5 text-sm text-foreground outline-none"
                />
              )}
              <input
                type="date"
                value={form.deadline}
                onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
                className="text-xs text-muted-foreground bg-foreground/5 rounded-full px-3 py-1 outline-none"
              />
              <button onClick={add} className="w-full py-2.5 rounded-xl bg-rose-600 text-white text-sm font-medium no-select">Add goal</button>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : goals.length === 0 ? (
            <div className="glass-card p-10 text-center">
              <Target className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No goals yet. Set something to work toward.</p>
            </div>
          ) : (
            goals.map((g) => {
              const p = computeProgress(g, myEntries);
              const pct = p && p.target > 0 ? Math.min(100, Math.round((p.current / p.target) * 100)) : 0;
              return (
                <div key={g.id} className={cn("glass-card p-4 space-y-3", g.completed && "opacity-60")}>
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleComplete(g)}
                      className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 no-select mt-0.5", g.completed ? "bg-emerald-500 border-emerald-500" : "border-foreground/30")}
                    >
                      {g.completed && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className={cn("text-sm font-medium text-foreground", g.completed && "line-through")}>{g.title}</div>
                      <div className="text-[10px] text-muted-foreground capitalize mt-0.5">
                        {g.type.replace("_", " ")}{g.deadline ? ` · by ${new Date(g.deadline).toLocaleDateString(undefined, { month: "short", day: "numeric" })}` : ""}
                      </div>
                    </div>
                    <button onClick={() => remove(g)} className="w-11 h-11 rounded-full flex items-center justify-center text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 no-select shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  {p ? (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>{p.current} / {p.target} {p.unit}</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-foreground/5 overflow-hidden">
                        <div className="h-full bg-rose-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      {g.type === "custom" && (
                        <button onClick={() => increment(g)} className="text-[11px] font-medium text-rose-600 no-select">+1 progress</button>
                      )}
                    </div>
                  ) : g.type === "competition" && g.deadline ? (
                    <CompetitionCountdown deadline={g.deadline} />
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}

function CompetitionCountdown({ deadline }) {
  const days = Math.ceil((new Date(deadline) - new Date()) / 86400000);
  return (
    <div className="text-[11px] text-muted-foreground">
      {days > 0 ? `${days} days to go` : days === 0 ? "Today!" : `${Math.abs(days)} days ago`}
    </div>
  );
}