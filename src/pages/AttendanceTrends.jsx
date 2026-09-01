import React, { useEffect, useMemo, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Loader2 } from "lucide-react";
import BackButton from "@/components/BackButton";
import { base44 } from "@/api/base44Client";
import { localDateStr, toDateStr } from "@/lib/localDate";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const COLORS = ["#f97316", "#6366f1", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#0ea5e9"];

export default function AttendanceTrends() {
  const [records, setRecords] = useState(null);

  useEffect(() => {
    base44.entities.Attendance.list("-session_date", 1000)
      .then((r) => setRecords(r || []))
      .catch(() => setRecords([]));
  }, []);

  const data = useMemo(() => {
    if (!records) return [];
    const today = new Date();
    const buckets = Array(7).fill(0);
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = localDateStr(d);
      const count = records.filter((r) => toDateStr(r.session_date) === key).length;
      buckets[d.getDay()] += count;
    }
    return DAYS.map((name, i) => ({ name, value: buckets[i], dow: i }))
      .filter((d) => d.dow !== 0 && d.dow !== 5 && d.value > 0);
  }, [records]);

  const total = data.reduce((s, d) => s + d.value, 0);
  const busiest = data.reduce((b, d) => (d.value > b.value ? d : b), { value: -1 });

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-amber-50 via-white to-slate-100" />
      <main className="app-main px-3">
        <div className="mx-auto max-w-2xl space-y-4">
          <BackButton to="/admin/attendance" label="Back to Attendance" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Attendance Trends</h1>
            <p className="text-sm text-muted-foreground mt-1">Busiest practice nights over the last 30 days</p>
          </div>

          {records === null ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : total === 0 ? (
            <div className="glass-card p-10 text-center">
              <p className="text-sm text-muted-foreground">No attendance recorded in the last 30 days.</p>
            </div>
          ) : (
            <>
              <div className="glass-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-foreground">Check-ins by night</div>
                    <div className="text-[11px] text-muted-foreground">{total} total check-ins</div>
                  </div>
                  {busiest.value >= 0 && (
                    <div className="text-right">
                      <div className="text-[11px] text-muted-foreground">Busiest night</div>
                      <div className="text-sm font-semibold" style={{ color: COLORS[busiest.dow] }}>
                        {busiest.name} · {busiest.value}
                      </div>
                    </div>
                  )}
                </div>

                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={90}
                        paddingAngle={2}
                      >
                        {data.map((d) => (
                          <Cell key={d.dow} fill={COLORS[d.dow]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "rgba(255,255,255,0.95)",
                          border: "1px solid rgba(0,0,0,0.08)",
                          borderRadius: "0.75rem",
                          fontSize: "12px",
                        }}
                        />
                      <Legend
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: "11px" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass-card p-4 space-y-2">
                <div className="text-sm font-semibold text-foreground">Nightly breakdown</div>
                <div className="space-y-1.5">
                  {data
                    .slice()
                    .sort((a, b) => b.value - a.value)
                    .map((d) => (
                      <div key={d.dow} className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[d.dow] }} />
                        <span className="text-sm text-foreground flex-1">{d.name}</span>
                        <span className="text-sm font-medium text-foreground">{d.value}</span>
                        <span className="text-[11px] text-muted-foreground w-12 text-right">
                          {Math.round((d.value / total) * 100)}%
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}