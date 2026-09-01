import React from "react";
import { Link } from "react-router-dom";
import { Clock, Flame, Smile, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const intensityMap = {
  light: "bg-emerald-500/15 text-emerald-700",
  moderate: "bg-sky-500/15 text-sky-700",
  hard: "bg-orange-500/15 text-orange-700",
  competition: "bg-rose-500/15 text-rose-700",
};

const moodMap = {
  great: "🤩",
  good: "🙂",
  neutral: "😐",
  tough: "😤",
  frustrated: "😣",
};

export default function JournalEntryCard({ entry }) {
  return (
    <Link to={`/journal/${entry.id}`} className="block">
      <div className="glass-card p-4 space-y-2.5 hover:scale-[1.01] transition-transform">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">{entry.title}</h3>
            <div className="text-xs text-muted-foreground mt-0.5">
              {new Date(entry.training_date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
            </div>
          </div>
          <span className="text-lg leading-none">{moodMap[entry.mood]}</span>
        </div>

        <p className="text-xs text-muted-foreground line-clamp-2">{entry.notes}</p>

        <div className="flex items-center gap-2 flex-wrap">
          {entry.duration_minutes != null && (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Clock className="w-3 h-3" />
              {entry.duration_minutes}m
            </span>
          )}
          {entry.intensity && (
            <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full capitalize flex items-center gap-1", intensityMap[entry.intensity])}>
              <Flame className="w-2.5 h-2.5" />
              {entry.intensity}
            </span>
          )}
          {entry.ai_feedback && (
            <span className="flex items-center gap-1 text-[10px] text-violet-600 font-medium">
              <Sparkles className="w-2.5 h-2.5" />
              Gracie reviewed
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}