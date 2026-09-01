import React, { useEffect, useState } from "react";
import BackButton from "@/components/BackButton";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Trash2, Loader2, Trophy, MapPin, Calendar, Scale } from "lucide-react";
import { cn } from "@/lib/utils";
import SheetSelect from "@/components/SheetSelect";
import WeightLogCard from "@/components/WeightLogCard";
import MedalBadge from "@/components/MedalBadge";

const statuses = [
  { value: "planning", label: "Planning", color: "bg-slate-500/15 text-slate-700" },
  { value: "registered", label: "Registered", color: "bg-sky-500/15 text-sky-700" },
  { value: "training", label: "Training", color: "bg-amber-500/15 text-amber-700" },
  { value: "completed", label: "Completed", color: "bg-emerald-500/15 text-emerald-700" },
];

const empty = { name: "", event_date: "", location: "", weight_class: "", status: "planning", focus_areas: "", result: "", placing: "", medal_shape: "medal", notes: "" };

export default function CompetitionPrep() {
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(empty);
  useEffect(() => {
    base44.entities.Competition.list("event_date", 100)
      .then(setItems)
      .finally(() => setLoading(false));
  }, []);

  const add = async () => {
    if (!form.name.trim() || !form.event_date) {
      toast({ title: "Name and date are required", variant: "destructive" });
      return;
    }
    try {
      const c = await base44.entities.Competition.create({
        name: form.name.trim(),
        event_date: form.event_date,
        location: form.location.trim() || null,
        weight_class: form.weight_class.trim() || null,
        status: form.status,
        focus_areas: form.focus_areas.trim() || null,
        result: form.result.trim() || null,
        placing: form.placing || null,
        medal_shape: form.medal_shape || null,
        notes: form.notes.trim() || null,
      });
      setItems((prev) => [c, ...prev]);
      setForm(empty);
      setAdding(false);
    } catch {
      toast({ title: "Could not add competition", variant: "destructive" });
    }
  };

  const setStatus = async (c, status) => {
    try {
      const updated = await base44.entities.Competition.update(c.id, { status });
      setItems((prev) => prev.map((x) => (x.id === c.id ? updated : x)));
    } catch {}
  };

  const remove = async (c) => {
    try {
      await base44.entities.Competition.delete(c.id);
      setItems((prev) => prev.filter((x) => x.id !== c.id));
    } catch {}
  };

  const daysTo = (d) => Math.ceil((new Date(d) - new Date(new Date().toDateString())) / 86400000);

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-amber-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-black" />
      <main className="app-main px-3">
        <div className="mx-auto max-w-2xl space-y-4">
          <BackButton to="/journal" label="Back to Journal" />
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Competition Prep</h1>
              <p className="text-sm text-muted-foreground mt-1">Plan your tournaments and track your game plan</p>
            </div>
            <button onClick={() => setAdding((v) => !v)} className="w-11 h-11 rounded-full bg-rose-600 text-white flex items-center justify-center no-select">
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {adding && (
            <div className="glass-card p-4 space-y-3">
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Competition name — e.g. 'IBJJF Seattle Open'" className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none" />
              <div className="flex gap-2 flex-wrap">
                <input type="date" value={form.event_date} onChange={(e) => setForm((f) => ({ ...f, event_date: e.target.value }))} className="text-xs text-muted-foreground bg-foreground/5 rounded-full px-3 py-1.5 outline-none" />
                <input value={form.weight_class} onChange={(e) => setForm((f) => ({ ...f, weight_class: e.target.value }))} placeholder="Weight class" className="flex-1 min-w-[120px] text-sm text-foreground bg-foreground/5 rounded-full px-3 py-1.5 outline-none" />
              </div>
              <input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} placeholder="Location" className="w-full text-sm text-foreground bg-foreground/5 rounded-xl px-3 py-2 outline-none" />
              <div className="flex gap-1.5 flex-wrap no-select">
                {statuses.map((s) => (
                  <button key={s.value} onClick={() => setForm((f) => ({ ...f, status: s.value }))} className={cn("text-[10px] px-2 py-1 rounded-full", form.status === s.value ? s.color : "bg-foreground/5 text-muted-foreground")}>{s.label}</button>
                ))}
              </div>
              <textarea value={form.focus_areas} onChange={(e) => setForm((f) => ({ ...f, focus_areas: e.target.value }))} placeholder="Focus areas & game plan — guards to play, submissions to hit, conditioning" rows={2} className="w-full text-sm text-foreground bg-foreground/5 rounded-xl px-3 py-2 resize-none outline-none" />
              <input value={form.result} onChange={(e) => setForm((f) => ({ ...f, result: e.target.value }))} placeholder="Result (once completed) — e.g. 'Gold, middleweight'" className="w-full text-sm text-foreground bg-foreground/5 rounded-xl px-3 py-2 outline-none" />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Placing</div>
                  <div className="flex gap-1 no-select">
                    {["", "gold", "silver", "bronze"].map((p) => (
                      <button key={p} onClick={() => setForm((f) => ({ ...f, placing: p }))} className={cn("flex-1 text-[10px] py-1.5 rounded-full capitalize", form.placing === p ? "bg-foreground text-background" : "bg-foreground/5 text-muted-foreground")}>{p || "—"}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Medal shape</div>
                  <SheetSelect
                    value={form.medal_shape}
                    onChange={(v) => setForm((f) => ({ ...f, medal_shape: v }))}
                    options={["medal", "star", "lotus", "laurel", "shield", "flame"].map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))}
                    placeholder="Medal shape"
                    triggerClassName="h-auto w-full text-xs text-foreground bg-foreground/5 rounded-full px-3 py-1.5 capitalize border-none shadow-none"
                  />
                </div>
              </div>
              <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Notes" rows={2} className="w-full text-sm text-foreground bg-foreground/5 rounded-xl px-3 py-2 resize-none outline-none" />
              <button onClick={add} className="w-full py-2.5 rounded-xl bg-rose-600 text-white text-sm font-medium no-select">Add competition</button>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : items.length === 0 ? (
            <div className="glass-card p-10 text-center">
              <Trophy className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No competitions tracked yet. Add one to start prepping.</p>
            </div>
          ) : (
            items.map((c) => {
              const d = daysTo(c.event_date);
              const done = c.status === "completed";
              return (
                <div key={c.id} className="glass-card p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-foreground">{c.name}</div>
                      <div className="flex items-center gap-2 flex-wrap mt-1 text-[11px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1"><Calendar className="w-3 h-3" />{c.event_date ? new Date(c.event_date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "Date unknown"}</span>
                        {!done && d >= 0 && <span className="font-medium text-rose-600">{d === 0 ? "Today!" : `${d} days out`}</span>}
                        {c.location && <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" />{c.location}</span>}
                        {c.weight_class && <span className="inline-flex items-center gap-1"><Scale className="w-3 h-3" />{c.weight_class}</span>}
                      </div>
                    </div>
                    <button onClick={() => remove(c)} className="w-11 h-11 rounded-full flex items-center justify-center text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 no-select shrink-0"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  <div className="flex gap-1.5 flex-wrap no-select">
                    {statuses.map((s) => (
                      <button key={s.value} onClick={() => setStatus(c, s.value)} className={cn("text-[10px] px-2 py-1 rounded-full", c.status === s.value ? s.color : "bg-foreground/5 text-muted-foreground")}>{s.label}</button>
                    ))}
                  </div>
                  {c.focus_areas && (
                    <div>
                      <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Game plan</div>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{c.focus_areas}</p>
                    </div>
                  )}
                  {c.placing ? (
                    <div className="flex items-center gap-2">
                      <MedalBadge placing={c.placing} shape={c.medal_shape || "medal"} size={28} />
                      <span className="text-sm font-medium text-emerald-700 capitalize">{c.placing}{c.result ? ` · ${c.result}` : ""}</span>
                    </div>
                  ) : (
                    c.result && <div className="text-sm font-medium text-emerald-700">Result: {c.result}</div>
                  )}
                  {c.notes && <p className="text-sm text-muted-foreground whitespace-pre-wrap">{c.notes}</p>}
                </div>
              );
            })
          )}

          <WeightLogCard />
        </div>
      </main>
    </div>
  );
}