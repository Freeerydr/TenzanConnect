import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import BackButton from "@/components/BackButton";
import { useToast } from "@/components/ui/use-toast";
import { Pencil, Trash2, Clock, Flame, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const intensityMap = {
  light: "bg-emerald-500/15 text-emerald-700",
  moderate: "bg-sky-500/15 text-sky-700",
  hard: "bg-orange-500/15 text-orange-700",
  competition: "bg-rose-500/15 text-rose-700",
};
const moodMap = { great: "🤩", good: "🙂", neutral: "😐", tough: "😤", frustrated: "😣" };

export default function JournalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.JournalEntry.get(id)
      .then(setEntry)
      .finally(() => setLoading(false));
  }, [id]);

  const remove = async () => {
    try {
      await base44.entities.JournalEntry.delete(id);
      toast({ title: "Session deleted" });
      navigate("/journal");
    } catch {
      toast({ title: "Could not delete", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!entry) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <p className="text-sm text-muted-foreground">Session not found.</p>
        <Link to="/journal" className="text-sm text-rose-600 font-medium">Back to journal</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-violet-50 via-white to-slate-100" />

      <main className="app-main px-3">
        <div className="mx-auto max-w-2xl space-y-4">
          <BackButton to="/journal" label="Back to Journal" />

          <div className="glass-card p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold text-foreground">{entry.title}</h1>
                <div className="text-xs text-muted-foreground mt-1">
                  {new Date(entry.training_date).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
                </div>
              </div>
              <span className="text-3xl leading-none">{moodMap[entry.mood]}</span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {entry.duration_minutes != null && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground bg-foreground/5 px-2.5 py-1 rounded-full no-select">
                  <Clock className="w-3 h-3" /> {entry.duration_minutes} min
                </span>
              )}
              {entry.intensity && (
                <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full capitalize flex items-center gap-1 no-select", intensityMap[entry.intensity])}>
                  <Flame className="w-3 h-3" /> {entry.intensity}
                </span>
              )}
            </div>

            <div>
              <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Notes</div>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{entry.notes}</p>
            </div>

            {entry.techniques && (
              <div>
                <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Techniques</div>
                <p className="text-sm text-foreground">{entry.techniques}</p>
              </div>
            )}

            {entry.ai_feedback && (
              <div className="rounded-2xl p-4 bg-violet-50/60 border border-violet-200/50 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-violet-700 no-select">
                  <Sparkles className="w-3.5 h-3.5" /> GRACIE'S FEEDBACK
                </div>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{entry.ai_feedback}</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Link
              to={`/journal/${entry.id}/edit`}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl glass-card text-sm font-medium text-foreground hover:bg-foreground/5 no-select"
            >
              <Pencil className="w-4 h-4" /> Edit
            </Link>
            <button
              onClick={remove}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-rose-50 text-sm font-medium text-rose-600 hover:bg-rose-100 transition-colors no-select"
            >
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}