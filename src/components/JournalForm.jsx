import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { addPendingEntry } from "@/lib/offlineJournal";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const intensities = ["light", "moderate", "hard", "competition"];
const moods = [
  { value: "great", emoji: "🤩" },
  { value: "good", emoji: "🙂" },
  { value: "neutral", emoji: "😐" },
  { value: "tough", emoji: "😤" },
  { value: "frustrated", emoji: "😣" },
];

export default function JournalForm({ existing }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    title: existing?.title || "",
    notes: existing?.notes || "",
    techniques: existing?.techniques || "",
    partners: existing?.partners || "",
    intensity: existing?.intensity || "moderate",
    duration_minutes: existing?.duration_minutes ?? "",
    mood: existing?.mood || "good",
    training_date: existing?.training_date || new Date().toISOString().slice(0, 10),
    ai_feedback: existing?.ai_feedback || "",
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.title.trim() || !form.notes.trim() || !form.training_date) {
      toast({ title: "Title, notes, and date are required", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const payload = {
        ...form,
        duration_minutes: form.duration_minutes === "" ? null : Number(form.duration_minutes),
      };
      if (!existing?.id && typeof navigator !== "undefined" && !navigator.onLine) {
        addPendingEntry(payload);
        toast({ title: "Saved offline — will sync when you're back online" });
        navigate("/journal");
        return;
      }
      if (existing?.id) {
        await base44.entities.JournalEntry.update(existing.id, payload);
        toast({ title: "Session updated" });
      } else {
        await base44.entities.JournalEntry.create(payload);
        toast({ title: "Session logged" });
      }
      navigate("/journal");
    } catch {
      toast({ title: "Could not save session", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="glass-card p-4 space-y-3">
        <input
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="Session title — e.g. 'Guard retention focus'"
          className="w-full bg-transparent text-base font-semibold text-foreground placeholder:text-muted-foreground outline-none"
        />
        <input
          type="date"
          value={form.training_date}
          onChange={(e) => set("training_date", e.target.value)}
          className="text-xs text-muted-foreground bg-foreground/5 rounded-full px-3 py-1 outline-none"
        />
      </div>

      <div className="glass-card p-4 space-y-2">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Notes</label>
        <textarea
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="How did the session go? What worked, what didn't…"
          rows={5}
          className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none"
        />
      </div>

      <div className="glass-card p-4 space-y-3">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Techniques Drilled</label>
        <input
          value={form.techniques}
          onChange={(e) => set("techniques", e.target.value)}
          placeholder="e.g. spider guard, triangle entries, stand-up passes"
          className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
        />
      </div>

      <div className="glass-card p-4 space-y-2">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Sparring Partners</label>
        <input
          value={form.partners}
          onChange={(e) => set("partners", e.target.value)}
          placeholder="Who you rolled with — e.g. Mike, Sarah, Coach Dave"
          className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
        />
      </div>

      <div className="glass-card p-4 space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Intensity</label>
          <div className="flex gap-2 flex-wrap">
            {intensities.map((i) => (
              <button
                key={i}
                onClick={() => set("intensity", i)}
                className={cn(
                  "text-xs px-3 py-1.5 rounded-full capitalize font-medium transition-all",
                  form.intensity === i ? "bg-foreground text-background" : "bg-foreground/5 text-muted-foreground"
                )}
              >
                {i}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Mood</label>
          <div className="flex gap-2">
            {moods.map((m) => (
              <button
                key={m.value}
                onClick={() => set("mood", m.value)}
                className={cn(
                  "w-11 h-11 rounded-2xl flex items-center justify-center text-xl transition-all",
                  form.mood === m.value ? "bg-foreground/10 scale-110 ring-2 ring-foreground/20" : "bg-foreground/5"
                )}
              >
                {m.emoji}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Duration (minutes)</label>
          <input
            type="number"
            value={form.duration_minutes}
            onChange={(e) => set("duration_minutes", e.target.value)}
            placeholder="90"
            className="w-24 bg-foreground/5 rounded-full px-3 py-1.5 text-sm text-foreground outline-none"
          />
        </div>
      </div>

      {form.ai_feedback && (
        <div className="glass-card p-4 space-y-2 border-violet-300/40">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-violet-700">
            <Sparkles className="w-3.5 h-3.5" />
            GRACIE
          </div>
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{form.ai_feedback}</p>
        </div>
      )}

      <button
        onClick={submit}
        disabled={busy}
        className="w-full py-3.5 rounded-2xl bg-rose-600 text-white text-sm font-semibold disabled:opacity-40 hover:bg-rose-700 transition-colors"
      >
        {busy ? "Saving…" : existing?.id ? "Update Session" : "Log Session"}
      </button>
    </div>
  );
}