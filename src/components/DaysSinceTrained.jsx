import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { cn } from "@/lib/utils";
import { localDateStr } from "@/lib/localDate";

export default function DaysSinceTrained() {
  const { user: me } = useAuth();
  const [days, setDays] = useState(null);
  const [lastDate, setLastDate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!me) { setLoading(false); return; }
    (async () => {
      try {
        const list = await base44.entities.Attendance.filter({ user_id: me.id }, "-session_date", 50);
        const today = localDateStr();
        const past = (list || [])
          .map((r) => r.session_date)
          .filter(Boolean)
          .filter((d) => d <= today)
          .sort()
          .reverse();
        if (past.length === 0) {
          setDays(null);
        } else {
          const latest = past[0];
          const diff = Math.round((new Date(today + "T00:00:00") - new Date(latest + "T00:00:00")) / 86400000);
          setDays(diff);
          setLastDate(latest);
        }
      } catch {
        setDays(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [me?.id]);

  const toneClass =
    days == null ? "text-muted-foreground"
    : days <= 6 ? "text-emerald-600"
    : days <= 13 ? "text-amber-600"
    : "text-rose-600";

  const subtitle = loading
    ? "Checking your attendance…"
    : days === null
    ? "No classes logged yet — check in to start tracking"
    : days === 0
    ? "Thanks for rolling today :)"
    : days === 1
    ? "Last trained yesterday"
    : lastDate
    ? `Last trained ${new Date(lastDate + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" })}${days >= 4 ? " — time to get back on the mat" : ""}`
    : "";

  return (
    <div className="glass-card p-5 text-center">
      <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Days since you trained</div>
      <div className={cn("text-6xl font-bold tracking-tight mt-1 leading-none", toneClass)}>
        {loading ? "…" : days === null ? "—" : days}
      </div>
      <div className="text-xs text-muted-foreground mt-2">{subtitle}</div>
    </div>
  );
}