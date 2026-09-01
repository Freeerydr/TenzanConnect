import React, { useEffect, useState, useMemo } from "react";
import BackButton from "@/components/BackButton";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Trash2, Loader2, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

const positions = ["guard", "passing", "submissions", "escapes", "takedowns", "defense", "other"];
const outcomes = [
  { value: "submitted", label: "Submitted", style: "bg-emerald-500/15 text-emerald-700" },
  { value: "tapped", label: "Tapped", style: "bg-rose-500/15 text-rose-700" },
  { value: "sweep", label: "Sweep", style: "bg-sky-500/15 text-sky-700" },
  { value: "pass", label: "Pass", style: "bg-violet-500/15 text-violet-700" },
  { value: "advantage", label: "Advantage", style: "bg-amber-500/15 text-amber-700" },
  { value: "neutral", label: "Neutral", style: "bg-foreground/5 text-muted-foreground" },
];

const empty = { training_date: new Date().toISOString().slice(0, 10), partner_name: "", position: "guard", submission: "", outcome: "neutral", notes: "" };

export default function RollLog() {
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(empty);

  useEffect(() => {
    base44.entities.Roll.list("-training_date", 500)
      .then(setItems)
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const submitted = items.filter((r) => r.outcome === "submitted").length;
    const tapped = items.filter((r) => r.outcome === "tapped").length;
    const decided = submitted + tapped;
    const tapRate = decided > 0 ? Math.round((submitted / decided) * 100) : null;
    return { total: items.length, submitted, tapped, tapRate };
  }, [items]);

  const add = async () => {
    if (!form.partner_name.trim() || !form.training_date) {
      toast({ title: "Partner and date are required", variant: "destructive" });
      return;
    }
    try {
      const r = await base44.entities.Roll.create({
        training_date: form.training_date,
        partner_name: form.partner_name.trim(),
        position: form.position,
        submission: form.submission.trim() || null,
        outcome: form.outcome,
        notes: form.notes.trim() || null,
      });
      setItems((prev) => [r, ...prev]);
      setForm(empty);
      setAdding(false);
    } catch {
      toast({ title: "Could not log roll", variant: "destructive" });
    }
  };

  const remove = async (r) => {
    try {
      await base44.entities.Roll.delete(r.id);
      setItems((prev) => prev.filter((x) => x.id !== r.id));
    } catch {}
  };

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-rose-50 via-white to-slate-100" />
      <main className="app-main px-3">
        <div className="mx-auto max-w-2xl space-y-4">
          <BackButton to="/journal" label="Back to Journal" />
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Roll Log</h1>
              <p className="text-sm text-muted-foreground mt-1">Track individual rounds and your tap rate</p>
            </div>
            <button onClick={() => setAdding((v) => !v)} className="w-11 h-11 rounded-full bg-rose-600 text-white flex items-center justify-center no-select">
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <div className="glass-card p-4 grid grid-cols-4 gap-2 text-center no-select">
            <Stat label="Rolls" value={stats.total} />
            <Stat label="Submitted" value={stats.submitted} color="text-emerald-600" />
            <Stat label="Tapped" value={stats.tapped} color="text-rose-600" />
            <Stat label="Tap rate" value={stats.tapRate == null ? "—" : `${stats.tapRate}%`} color="text-violet-600" />
          </div>

          {adding && (
            <div className="glass-card p-4 space-y-3">
              <div className="flex gap-2 flex-wrap">
                <input type="date" value={form.training_date} onChange={(e) => setForm((f) => ({ ...f, training_date: e.target.value }))} className="text-xs text-muted-foreground bg-foreground/5 rounded-full px-3 py-1.5 outline-none" />
                <input value={form.partner_name} onChange={(e) => setForm((f) => ({ ...f, partner_name: e.target.value }))} placeholder="Partner name" className="flex-1 min-w-[140px] text-sm text-foreground bg-foreground/5 rounded-xl px-3 py-2 outline-none" />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5">Position</div>
                <div className="flex gap-1.5 flex-wrap">
                  {positions.map((p) => (
                    <button key={p} onClick={() => setForm((f) => ({ ...f, position: p }))} className={cn("text-[10px] px-2 py-1 rounded-full capitalize", form.position === p ? "bg-foreground text-background" : "bg-foreground/5 text-muted-foreground")}>{p}</button>
                  ))}
                </div>
              </div>
              <input value={form.submission} onChange={(e) => setForm((f) => ({ ...f, submission: e.target.value }))} placeholder="Submission — e.g. 'armbar from guard' (optional)" className="w-full text-sm text-foreground bg-foreground/5 rounded-xl px-3 py-2 outline-none" />
              <div>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5">Outcome</div>
                <div className="flex gap-1.5 flex-wrap">
                  {outcomes.map((o) => (
                    <button key={o.value} onClick={() => setForm((f) => ({ ...f, outcome: o.value }))} className={cn("text-[10px] px-2 py-1 rounded-full capitalize", form.outcome === o.value ? o.style : "bg-foreground/5 text-muted-foreground")}>{o.label}</button>
                  ))}
                </div>
              </div>
              <input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Notes (optional)" className="w-full text-sm text-foreground bg-foreground/5 rounded-xl px-3 py-2 outline-none" />
              <button onClick={add} className="w-full py-2.5 rounded-xl bg-rose-600 text-white text-sm font-medium no-select">Log roll</button>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : items.length === 0 ? (
            <div className="glass-card p-10 text-center">
              <Activity className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No rolls logged yet. Add a round to start tracking your tap rate.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((r) => {
                const o = outcomes.find((x) => x.value === r.outcome) || outcomes[5];
                return (
                  <div key={r.id} className="glass-card p-3.5 flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-foreground truncate">{r.partner_name}</span>
                        <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full capitalize", o.style)}>{o.label}</span>
                        <span className="text-[10px] text-muted-foreground capitalize">{r.position}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {new Date(r.training_date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        {r.submission && ` · ${r.submission}`}
                      </div>
                      {r.notes && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.notes}</p>}
                    </div>
                    <button onClick={() => remove(r)} className="w-11 h-11 rounded-full flex items-center justify-center text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 no-select shrink-0"><Trash2 className="w-4 h-4" /></button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div className="flex flex-col items-center">
      <div className={cn("text-xl font-bold text-foreground", color)}>{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}