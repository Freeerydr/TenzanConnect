import React from "react";

const KIND_STYLE = {
  mat_hours: "bg-sky-500/15",
  streak: "bg-orange-500/15",
};

export default function AchievementBadge({ achievement }) {
  const bg = KIND_STYLE[achievement.kind] || "bg-foreground/5";
  return (
    <div className="glass-card p-2.5 flex items-center gap-2.5">
      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-lg shrink-0 ${bg}`}>
        {achievement.icon || "🏅"}
      </div>
      <div className="min-w-0">
        <div className="text-xs font-semibold text-foreground leading-tight">{achievement.title}</div>
        <div className="text-[10px] text-muted-foreground">
          {new Date(achievement.earned_date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
        </div>
      </div>
    </div>
  );
}