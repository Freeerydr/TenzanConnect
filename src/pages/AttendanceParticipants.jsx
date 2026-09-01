import React, { useEffect, useMemo, useState } from "react";
import { Loader2, TrendingUp } from "lucide-react";
import BackButton from "@/components/BackButton";
import { base44 } from "@/api/base44Client";
import { toDateStr } from "@/lib/localDate";
import { cn } from "@/lib/utils";

const CLASS_ORDER = ["Kids", "Adult", "Both"];
const CLASS_LABELS = { Kids: "Kids class", Adult: "Adult class", Both: "Both classes" };
const CLASS_BADGE = {
  Kids: "bg-amber-500/15 text-amber-700",
  Adult: "bg-blue-500/15 text-blue-700",
  Both: "bg-violet-500/15 text-violet-700",
};
const CLASS_BAR = { Kids: "bg-amber-500", Adult: "bg-blue-500", Both: "bg-violet-500" };
const CLASS_TEXT = { Kids: "text-amber-600", Adult: "text-blue-600", Both: "text-violet-600" };

export default function AttendanceParticipants() {
  const [records, setRecords] = useState(null);
  const [profiles, setProfiles] = useState([]);

  useEffect(() => {
    base44.entities.Attendance.list("-session_date", 2000)
      .then((r) => setRecords(r || []))
      .catch(() => setRecords([]));
    base44.entities.Profile.list("-created_date", 200).then(setProfiles).catch(() => {});
  }, []);

  const data = useMemo(() => {
    if (!records) return null;
    const profileNameByUser = {};
    profiles.forEach((p) => { if (p.user_id && p.user_name) profileNameByUser[p.user_id] = p.user_name; });

    // Total classes held per class = distinct dates that class was held
    const datesByClass = { Kids: new Set(), Adult: new Set(), Both: new Set() };
    records.forEach((r) => {
      const c = r.class_name && CLASS_ORDER.includes(r.class_name) ? r.class_name : "Adult";
      const d = toDateStr(r.session_date);
      if (d) datesByClass[c].add(d);
    });
    const totalByClass = {
      Kids: datesByClass.Kids.size,
      Adult: datesByClass.Adult.size,
      Both: datesByClass.Both.size,
    };

    // Aggregate per participant
    const participants = {};
    records.forEach((r) => {
      const c = r.class_name && CLASS_ORDER.includes(r.class_name) ? r.class_name : "Adult";
      const key = r.user_id ? ("u:" + r.user_id) : ("w:" + r.user_name);
      if (!participants[key]) {
        const name = r.user_id
          ? (profileNameByUser[r.user_id] || r.user_name || "Member")
          : (r.user_name || "Walk-in");
        participants[key] = { name, counts: { Kids: 0, Adult: 0, Both: 0 }, isWalkin: !r.user_id };
      }
      participants[key].counts[c] += 1;
    });

    // Assign each participant to their most-attended class
    const byClass = { Kids: [], Adult: [], Both: [] };
    Object.entries(participants).forEach(([key, p]) => {
      let primary = "Adult";
      let max = -1;
      CLASS_ORDER.forEach((c) => {
        if (p.counts[c] > max) { max = p.counts[c]; primary = c; }
      });
      const total = totalByClass[primary] || 0;
      const attended = p.counts[primary];
      const pct = total > 0 ? Math.round((attended / total) * 100) : 0;
      byClass[primary].push({ key, name: p.name, attended, total, pct, isWalkin: p.isWalkin });
    });
    CLASS_ORDER.forEach((c) => byClass[c].sort((a, b) => b.pct - a.pct));

    return { totalByClass, byClass };
  }, [records, profiles]);

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-amber-50 via-white to-slate-100" />
      <main className="app-main px-3">
        <div className="mx-auto max-w-2xl space-y-4">
          <BackButton to="/admin/attendance" label="Back to Attendance" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Participation Trends</h1>
            <p className="text-sm text-muted-foreground mt-1">Lifetime attendance rate by class</p>
          </div>

          {data === null ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="glass-card p-4 grid grid-cols-3 gap-2">
                {CLASS_ORDER.map((c) => (
                  <div key={c} className="text-center">
                    <div className={cn("text-xs font-semibold", CLASS_TEXT[c])}>{CLASS_LABELS[c]}</div>
                    <div className="text-lg font-bold text-foreground">{data.totalByClass[c]}</div>
                    <div className="text-[10px] text-muted-foreground">classes held</div>
                  </div>
                ))}
              </div>

              {CLASS_ORDER.map((c) => {
                const list = data.byClass[c];
                if (!list.length) return null;
                return (
                  <div key={c} className="space-y-2">
                    <div className="flex items-center gap-2 px-1 pt-1">
                      <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", CLASS_BADGE[c])}>
                        {CLASS_LABELS[c]}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {list.length} participant{list.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    {list.map((p) => (
                      <div key={p.key} className="glass-card p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-500 to-slate-700 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                            {(p.name || "?").charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-foreground truncate">{p.name}</div>
                            <div className="text-[10px] text-muted-foreground">
                              {p.attended} of {p.total} classes{p.isWalkin ? " · walk-in" : ""}
                            </div>
                          </div>
                          <div className={cn("text-sm font-bold", CLASS_TEXT[c])}>{p.pct}%</div>
                        </div>
                        <div className="h-2 rounded-full bg-foreground/10 overflow-hidden">
                          <div className={cn("h-full rounded-full", CLASS_BAR[c])} style={{ width: `${p.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}

              {CLASS_ORDER.every((c) => data.byClass[c].length === 0) && (
                <div className="glass-card p-10 text-center">
                  <TrendingUp className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No attendance records yet.</p>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}