import React, { useMemo } from "react";
import { Flame, Clock, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

const DOW_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

function startOfWeek(d) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = (day + 6) % 7; // Monday-based
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - diff);
  return date;
}

export default function JournalStats({ entries, trainingDays }) {
  const stats = useMemo(() => {
    const plannedSet = new Set(trainingDays || []);
    const plannedDows = new Set([...plannedSet].map((d) => DOW_KEYS.indexOf(d)));
    const plannedCount = plannedSet.size;

    const dates = entries
      .map((e) => (e.training_date ? new Date(e.training_date) : null))
      .filter(Boolean);
    const totalMinutes = entries.reduce((s, e) => s + (e.duration_minutes || 0), 0);
    const totalHours = Math.round(totalMinutes / 60);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const daysThisMonth = new Set(
      dates.filter((d) => d >= monthStart).map((d) => {
        const k = new Date(d);
        k.setHours(0, 0, 0, 0);
        return k.getTime();
      })
    ).size;

    // Distinct training days per week — a session on a non-training day still counts as a day trained
    const distinctByWeek = {};
    dates.forEach((d) => {
      const k = new Date(d);
      k.setHours(0, 0, 0, 0);
      const wkey = startOfWeek(k).getTime();
      (distinctByWeek[wkey] = distinctByWeek[wkey] || new Set()).add(k.getTime());
    });

    const weekMetTarget = (wkey, isCurrent) => {
      const distinct = (distinctByWeek[wkey] || new Set()).size;
      if (plannedCount === 0) return distinct > 0;
      if (isCurrent) {
        // On track: trained at least as many days as planned days that have already passed this week
        const todayDow = new Date().getDay();
        let required = 0;
        plannedDows.forEach((dow) => { if (dow < todayDow) required++; });
        return distinct >= required;
      }
      return distinct >= plannedCount;
    };

    let streak = 0;
    if (dates.length > 0) {
      let cur = startOfWeek(new Date()).getTime();
      let isCurrent = true;
      while (weekMetTarget(cur, isCurrent)) {
        streak++;
        cur -= 7 * 24 * 60 * 60 * 1000;
        isCurrent = false;
      }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const countByDay = {};
    dates.forEach((d) => {
      const k = new Date(d);
      k.setHours(0, 0, 0, 0);
      countByDay[k.getTime()] = (countByDay[k.getTime()] || 0) + 1;
    });
    const wsStart = startOfWeek(today);
    const weeks = [];
    for (let w = 11; w >= 0; w--) {
      const weekStart = new Date(wsStart);
      weekStart.setDate(weekStart.getDate() - w * 7);
      const days = [];
      for (let dd = 0; dd < 7; dd++) {
        const day = new Date(weekStart);
        day.setDate(day.getDate() + dd);
        const key = day.getTime();
        days.push({ key, count: countByDay[key] || 0, future: day > today });
      }
      weeks.push(days);
    }

    return { totalHours, daysThisMonth, streak, weeks, totalSessions: entries.length, plannedDows };
  }, [entries, trainingDays]);

  const levelColor = (count) => {
    if (count === 0) return "bg-foreground/5";
    if (count === 1) return "bg-rose-500/40";
    if (count === 2) return "bg-rose-500/70";
    return "bg-rose-600";
  };

  return (
    <div className="glass-card p-4 space-y-4 no-select">
      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat icon={Flame} value={stats.streak} label="Week streak" color="text-rose-500" />
        <Stat icon={CalendarDays} value={stats.daysThisMonth} label="This month" color="text-sky-600" />
        <Stat icon={Clock} value={`${stats.totalHours}h`} label="Mat time" color="text-emerald-600" />
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-2">Last 12 weeks</div>
        <div className="flex gap-[3px] overflow-x-auto pb-1">
          {stats.weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((day) => {
                const dow = new Date(day.key).getDay();
                const planned = stats.plannedDows?.has(dow);
                return (
                  <div
                    key={day.key}
                    className={cn("w-3 h-3 rounded-[3px]", levelColor(day.count), day.future && "opacity-30", planned && "ring-1 ring-foreground/30")}
                    title={day.count ? `${day.count} session(s)` : ""}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, value, label, color }) {
  return (
    <div className="flex flex-col items-center">
      <Icon className={cn("w-4 h-4 mb-1", color)} />
      <div className="text-xl font-bold text-foreground">{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}