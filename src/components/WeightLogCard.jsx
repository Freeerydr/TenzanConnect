import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Plus, Loader2, Scale, TrendingDown, TrendingUp, Minus } from "lucide-react";

export default function WeightLogCard() {
  const { toast } = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ weight: "", log_date: new Date().toISOString().slice(0, 10), notes: "" });

  useEffect(() => {
    base44.entities.WeightLog.list("-log_date", 60).then(setLogs).finally(() => setLoading(false));
  }, []);

  const add = async () => {
    if (!form.weight || !form.log_date) {
      toast({ title: "Weight and date are required", variant: "destructive" });
      return;
    }
    try {
      const w = await base44.entities.WeightLog.create({
        weight: Number(form.weight),
        log_date: form.log_date,
        notes: form.notes.trim() || null,
      });
      setLogs((prev) => [w, ...prev]);
      setForm({ weight: "", log_date: new Date().toISOString().slice(0, 10), notes: "" });
      setAdding(false);
    } catch {
      toast({ title: "Could not log weight", variant: "destructive" });
    }
  };

  const remove = async (w) => {
    try {
      await base44.entities.WeightLog.delete(w.id);
      setLogs((prev) => prev.filter((x) => x.id !== w.id));
    } catch {}
  };

  const sorted = [...logs].sort((a, b) => new Date(a.log_date) - new Date(b.log_date));
  const chartData = sorted.map((w) => ({
    date: new Date(w.log_date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    weight: w.weight,
  }));
  const latest = logs[0];
  const first = sorted[0];
  const delta = latest && first && latest.id !== first.id ? Number((latest.weight - first.weight).toFixed(1)) : 0;
  const TrendIcon = delta < 0 ? TrendingDown : delta > 0 ? TrendingUp : Minus;
  const trendColor = delta < 0 ? "text-emerald-600" : delta > 0 ? "text-rose-600" : "text-muted-foreground";

  return (
    <div className="glass-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-emerald-500/15 flex items-center justify-center">
            <Scale className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Weight & Fitness Log</h2>
            <p className="text-[11px] text-muted-foreground">Track your weight cut and conditioning</p>
          </div>
        </div>
        <button onClick={() => setAdding((v) => !v)} className="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center no-select">
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {adding && (
        <div className="space-y-2 p-3 rounded-xl bg-foreground/5">
          <div className="flex gap-2 flex-wrap">
            <input type="number" step="0.1" value={form.weight} onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value }))} placeholder="Weight (lbs)" className="w-28 text-sm text-foreground bg-background rounded-full px-3 py-1.5 outline-none" />
            <input type="date" value={form.log_date} onChange={(e) => setForm((f) => ({ ...f, log_date: e.target.value }))} className="text-xs text-muted-foreground bg-background rounded-full px-3 py-1.5 outline-none" />
          </div>
          <input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Conditioning notes — e.g. 'morning, post-roll'" className="w-full text-sm text-foreground bg-background rounded-xl px-3 py-2 outline-none" />
          <button onClick={add} className="w-full py-2 rounded-xl bg-rose-600 text-white text-sm font-medium no-select">Log entry</button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : logs.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">No weight entries yet. Log one to start tracking your cut.</p>
      ) : (
        <>
          <div className="flex items-center gap-5">
            <div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Latest</div>
              <div className="text-xl font-bold text-foreground">{latest.weight}<span className="text-xs font-normal text-muted-foreground ml-1">lbs</span></div>
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Trend</div>
              <div className={`flex items-center gap-1 text-sm font-semibold ${trendColor}`}>
                <TrendIcon className="w-3.5 h-3.5" />{delta > 0 ? "+" : ""}{delta} lbs
              </div>
            </div>
          </div>
          {chartData.length > 1 && (
            <div className="h-40 -ml-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                  <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} width={36} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12, border: "1px solid hsl(var(--border))" }} />
                  <Line type="monotone" dataKey="weight" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: "#10b981" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {logs.map((w) => (
              <div key={w.id} className="flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg bg-foreground/5">
                <span className="font-semibold text-foreground tabular-nums">{w.weight} lbs</span>
                <span className="text-muted-foreground">{new Date(w.log_date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                {w.notes && <span className="text-muted-foreground truncate flex-1">· {w.notes}</span>}
                <button onClick={() => remove(w)} className="text-muted-foreground hover:text-rose-500 no-select ml-auto">✕</button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}