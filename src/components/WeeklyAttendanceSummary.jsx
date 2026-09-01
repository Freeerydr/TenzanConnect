import React from "react";
import { useNavigate } from "react-router-dom";
import { CalendarCheck, PieChart as PieIcon, TrendingUp } from "lucide-react";

export default function WeeklyAttendanceSummary({ records, users }) {
  const navigate = useNavigate();
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weekRecords = (records || []).filter((r) => r.session_date && new Date(r.session_date) >= weekAgo);

  const counts = {};
  weekRecords.forEach((r) => { if (r.user_id) counts[r.user_id] = (counts[r.user_id] || 0) + 1; });
  const walkins = weekRecords.filter((r) => !r.user_id);

  const userName = (uid) => {
    const u = (users || []).find((x) => x.id === uid);
    return u?.full_name || u?.email || weekRecords.find((r) => r.user_id === uid)?.user_name || "Member";
  };

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);

  return (
    <div className="glass-card p-4 space-y-2">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-amber-500/15 flex items-center justify-center shrink-0">
          <CalendarCheck className="w-4 h-4 text-amber-600" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-foreground">This week's attendance</div>
          <div className="text-[11px] text-muted-foreground">
            {weekRecords.length} check-ins · {Object.keys(counts).length} member(s){walkins.length ? ` · ${walkins.length} walk-in(s)` : ""}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <button
            onClick={() => navigate("/admin/attendance/participants")}
            className="flex items-center gap-1 text-[11px] font-medium text-blue-600 bg-blue-500/10 px-2.5 py-1.5 rounded-full no-select"
          >
            <TrendingUp className="w-3.5 h-3.5" /> Rates
          </button>
          <button
            onClick={() => navigate("/admin/attendance/trends")}
            className="flex items-center gap-1 text-[11px] font-medium text-amber-600 bg-amber-500/10 px-2.5 py-1.5 rounded-full no-select"
          >
            <PieIcon className="w-3.5 h-3.5" /> 30-day
          </button>
        </div>
      </div>
      {sorted.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {sorted.map(([uid, c]) => (
            <span key={uid} className="text-[10px] bg-foreground/5 text-muted-foreground px-2 py-0.5 rounded-full">
              {userName(uid)} · {c}
            </span>
          ))}
        </div>
      )}
      {weekRecords.length === 0 && (
        <p className="text-xs text-muted-foreground">No check-ins recorded this week.</p>
      )}
    </div>
  );
}