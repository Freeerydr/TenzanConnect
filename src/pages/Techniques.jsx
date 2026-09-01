import React, { useEffect, useState } from "react";
import BackButton from "@/components/BackButton";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Trash2, Loader2, Dumbbell } from "lucide-react";
import { cn } from "@/lib/utils";

const statuses = ["learning", "drilling", "hitting", "mastered"];
const statusStyle = {
  learning: "bg-sky-500/15 text-sky-700",
  drilling: "bg-amber-500/15 text-amber-700",
  hitting: "bg-violet-500/15 text-violet-700",
  mastered: "bg-emerald-500/15 text-emerald-700",
};
const categories = ["guard", "passing", "submissions", "escapes", "takedowns", "defense", "other"];

export default function Techniques() {
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("other");
  const [status, setStatus] = useState("learning");

  useEffect(() => {
    base44.entities.Technique.list("-updated_date", 200)
      .then(setItems)
      .finally(() => setLoading(false));
  }, []);

  const add = async () => {
    if (!name.trim()) return;
    try {
      const t = await base44.entities.Technique.create({ name: name.trim(), category, status });
      setItems((prev) => [t, ...prev]);
      setName("");
      setCategory("other");
      setStatus("learning");
      setAdding(false);
    } catch {
      toast({ title: "Could not add technique", variant: "destructive" });
    }
  };

  const cycle = async (t) => {
    const idx = statuses.indexOf(t.status);
    const next = statuses[(idx + 1) % statuses.length];
    const prevStatus = t.status;
    setItems((prev) => prev.map((x) => (x.id === t.id ? { ...x, status: next } : x)));
    try {
      await base44.entities.Technique.update(t.id, { status: next });
    } catch {
      setItems((prev) => prev.map((x) => (x.id === t.id ? { ...x, status: prevStatus } : x)));
      toast({ title: "Could not update technique", variant: "destructive" });
    }
  };

  const remove = async (t) => {
    setItems((prev) => prev.filter((x) => x.id !== t.id));
    try {
      await base44.entities.Technique.delete(t.id);
    } catch {
      setItems((prev) => [...prev, t]);
      toast({ title: "Could not delete technique", variant: "destructive" });
    }
  };

  const grouped = statuses.map((s) => ({ status: s, items: items.filter((i) => i.status === s) }));

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-rose-50 via-white to-slate-100" />
      <main className="app-main px-3">
        <div className="mx-auto max-w-2xl space-y-4">
          <BackButton to="/journal" label="Back to Journal" />
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Technique Tracker</h1>
              <p className="text-sm text-muted-foreground mt-1">Track moves from learning to mastered</p>
            </div>
            <button onClick={() => setAdding((v) => !v)} className="w-11 h-11 rounded-full bg-rose-600 text-white flex items-center justify-center no-select">
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {adding && (
            <div className="glass-card p-4 space-y-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Technique — e.g. 'Kimura from closed guard'"
                className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
              />
              <div>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5">Category</div>
                <div className="flex gap-2 flex-wrap">
                  {categories.map((c) => (
                    <button
                      key={c}
                      onClick={() => setCategory(c)}
                      className={cn("text-[10px] px-2 py-1 rounded-full capitalize", category === c ? "bg-foreground text-background" : "bg-foreground/5 text-muted-foreground")}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5">Status</div>
                <div className="flex gap-2 flex-wrap">
                  {statuses.map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatus(s)}
                      className={cn("text-[10px] px-2 py-1 rounded-full capitalize", status === s ? "bg-foreground text-background" : "bg-foreground/5 text-muted-foreground")}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={add} className="w-full py-2.5 rounded-xl bg-rose-600 text-white text-sm font-medium no-select">Add technique</button>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : items.length === 0 ? (
            <div className="glass-card p-10 text-center">
              <Dumbbell className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No techniques yet. Add the moves you're working on.</p>
            </div>
          ) : (
            grouped.map((g) => g.items.length > 0 && (
              <div key={g.status} className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground capitalize">{g.status} ({g.items.length})</div>
                {g.items.map((t) => (
                  <div key={t.id} className="glass-card p-3 flex items-center gap-3">
                    <button onClick={() => cycle(t)} className={cn("text-[10px] font-semibold px-2 py-1 rounded-full capitalize no-select shrink-0", statusStyle[t.status])}>
                      {t.status}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">{t.name}</div>
                      <div className="text-[10px] text-muted-foreground capitalize">{t.category}</div>
                    </div>
                    <button onClick={() => remove(t)} className="w-11 h-11 rounded-full flex items-center justify-center text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 no-select shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ))
          )}
          {!loading && items.length > 0 && (
            <p className="text-[11px] text-muted-foreground/70 text-center">Tap a status badge to advance it.</p>
          )}
        </div>
      </main>
    </div>
  );
}