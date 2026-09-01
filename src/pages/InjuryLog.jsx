import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import BackButton from "@/components/BackButton";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Trash2, Loader2, HeartPulse, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

const severities = [
  { value: "minor", label: "Minor", color: "bg-emerald-500/15 text-emerald-700" },
  { value: "moderate", label: "Moderate", color: "bg-amber-500/15 text-amber-700" },
  { value: "major", label: "Major", color: "bg-rose-500/15 text-rose-700" },
];

const statuses = [
  { value: "active", label: "Active", color: "bg-rose-500/15 text-rose-700" },
  { value: "recovering", label: "Recovering", color: "bg-amber-500/15 text-amber-700" },
  { value: "recovered", label: "Recovered", color: "bg-emerald-500/15 text-emerald-700" },
];

const empty = { title: "", injury_date: "", body_part: "", severity: "minor", status: "active", treatment: "", expected_return: "", notes: "" };

export default function InjuryLog() {
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(empty);

  useEffect(() => {
    base44.entities.Injury.list("-injury_date", 100)
      .then(setItems)
      .finally(() => setLoading(false));
  }, []);

  const add = async () => {
    if (!form.title.trim() || !form.injury_date) {
      toast({ title: "Title and date are required", variant: "destructive" });
      return;
    }
    try {
      const i = await base44.entities.Injury.create({
        title: form.title.trim(),
        injury_date: form.injury_date,
        body_part: form.body_part.trim() || null,
        severity: form.severity,
        status: form.status,
        treatment: form.treatment.trim() || null,
        expected_return: form.expected_return || null,
        notes: form.notes.trim() || null,
      });
      setItems((prev) => [i, ...prev]);
      setForm(empty);
      setAdding(false);
    } catch {
      toast({ title: "Could not add injury log", variant: "destructive" });
    }
  };

  const setStatus = async (it, status) => {
    const patch = { status };
    if (status === "recovered" && !it.resolved_date) patch.resolved_date = new Date().toISOString().slice(0, 10);
    try {
      const updated = await base44.entities.Injury.update(it.id, patch);
      setItems((prev) => prev.map((x) => (x.id === it.id ? updated : x)));
    } catch {}
  };

  const remove = async (it) => {
    try {
      await base44.entities.Injury.delete(it.id);
      setItems((prev) => prev.filter((x) => x.id !== it.id));
    } catch {}
  };

  const daysFrom = (d) => {
    if (!d) return null;
    return Math.floor((new Date(new Date().toDateString()) - new Date(d)) / 86400000);
  };

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-rose-50 via-white to-slate-100" />
      <main className="app-main px-3">
        <div className="mx-auto max-w-2xl space-y-4">
          <BackButton to="/journal" label="Back to Journal" />
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Injury & Recovery</h1>
              <p className="text-sm text-muted-foreground mt-1">Log tweaks and setbacks, track recovery, and know when to ease back</p>
            </div>
            <button onClick={() => setAdding((v) => !v)} className="w-11 h-11 rounded-full bg-rose-600 text-white flex items-center justify-center no-select">
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {adding && (
            <div className="glass-card p-4 space-y-3">
              <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="What happened — e.g. 'Right shoulder tweak'" className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none" />
              <div className="flex gap-2 flex-wrap">
                <input type="date" value={form.injury_date} onChange={(e) => setForm((f) => ({ ...f, injury_date: e.target.value }))} className="text-xs text-muted-foreground bg-foreground/5 rounded-full px-3 py-1.5 outline-none" />
                <input value={form.body_part} onChange={(e) => setForm((f) => ({ ...f, body_part: e.target.value }))} placeholder="Body part" className="flex-1 min-w-[120px] text-sm text-foreground bg-foreground/5 rounded-full px-3 py-1.5 outline-none" />
              </div>
              <div className="space-y-1.5">
                <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Severity</div>
                <div className="flex gap-1.5 no-select">
                  {severities.map((s) => (
                    <button key={s.value} onClick={() => setForm((f) => ({ ...f, severity: s.value }))} className={cn("text-[10px] px-2 py-1 rounded-full", form.severity === s.value ? s.color : "bg-foreground/5 text-muted-foreground")}>{s.label}</button>
                  ))}
                </div>
              </div>
              <input value={form.treatment} onChange={(e) => setForm((f) => ({ ...f, treatment: e.target.value }))} placeholder="Treatment — rest, ice, PT, drilling only…" className="w-full text-sm text-foreground bg-foreground/5 rounded-xl px-3 py-2 outline-none" />
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground">Expected return</span>
                <input type="date" value={form.expected_return} onChange={(e) => setForm((f) => ({ ...f, expected_return: e.target.value }))} className="text-xs text-muted-foreground bg-foreground/5 rounded-full px-3 py-1 outline-none" />
              </div>
              <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Recovery notes — how it feels, what to avoid" rows={2} className="w-full text-sm text-foreground bg-foreground/5 rounded-xl px-3 py-2 resize-none outline-none" />
              <button onClick={add} className="w-full py-2.5 rounded-xl bg-rose-600 text-white text-sm font-medium no-select">Add to log</button>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : items.length === 0 ? (
            <div className="glass-card p-10 text-center">
              <HeartPulse className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No injuries logged. Stay healthy on the mats.</p>
            </div>
          ) : (
            items.map((it) => {
              const sev = severities.find((s) => s.value === it.severity) || severities[0];
              const since = daysFrom(it.injury_date);
              const toReturn = it.expected_return ? Math.ceil((new Date(it.expected_return) - new Date(new Date().toDateString())) / 86400000) : null;
              return (
                <div key={it.id} className="glass-card p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">{it.title}</span>
                        <span className={cn("text-[10px] px-2 py-0.5 rounded-full", sev.color)}>{sev.label}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap mt-1 text-[11px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1"><Activity className="w-3 h-3" />{new Date(it.injury_date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}{since != null && ` · ${since}d ago`}</span>
                        {it.body_part && <span>· {it.body_part}</span>}
                      </div>
                    </div>
                    <button onClick={() => remove(it)} className="w-11 h-11 rounded-full flex items-center justify-center text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 no-select shrink-0"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  <div className="flex gap-1.5 flex-wrap no-select">
                    {statuses.map((s) => (
                      <button key={s.value} onClick={() => setStatus(it, s.value)} className={cn("text-[10px] px-2 py-1 rounded-full", it.status === s.value ? s.color : "bg-foreground/5 text-muted-foreground")}>{s.label}</button>
                    ))}
                  </div>
                  {it.treatment && (
                    <div>
                      <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-0.5">Treatment</div>
                      <p className="text-sm text-foreground">{it.treatment}</p>
                    </div>
                  )}
                  {it.expected_return && it.status !== "recovered" && (
                    <div className="text-[11px] text-muted-foreground">
                      Expected return: {new Date(it.expected_return).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      {toReturn != null && (toReturn >= 0 ? ` · ${toReturn}d to go` : ` · ${Math.abs(toReturn)}d overdue`)}
                    </div>
                  )}
                  {it.status === "recovered" && it.resolved_date && (
                    <div className="text-[11px] text-emerald-700">Recovered {new Date(it.resolved_date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</div>
                  )}
                  {it.notes && <p className="text-sm text-muted-foreground whitespace-pre-wrap">{it.notes}</p>}
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}