import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import AchievementBadge from "@/components/AchievementBadge";
import MedalBadge from "@/components/MedalBadge";
import { computeAchievements } from "@/lib/achievements";
import { Loader2, Award } from "lucide-react";

// Achievements are private: derived client-side from the viewer's own
// journal entries and competitions. Only rendered on the viewer's own profile.
export default function AchievementsSection({ isMe }) {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!isMe) { setLoading(false); return; }
    (async () => {
      try {
        const [entries, comps] = await Promise.all([
          base44.entities.JournalEntry.list("-training_date", 1000),
          base44.entities.Competition.list("-event_date", 200),
        ]);
        if (!cancelled) setAchievements(computeAchievements(entries, comps));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isMe]);

  if (!isMe) return null;

  const medals = achievements.filter((a) => a.kind === "competition_medal");
  const standard = achievements.filter((a) => a.kind !== "competition_medal");

  return (
    <div className="glass-card p-4 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-amber-500/15 flex items-center justify-center">
          <Award className="w-4 h-4 text-amber-600" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground">Achievements</h2>
          <p className="text-[11px] text-muted-foreground">Mat-time milestones, streaks, and competition medals</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : achievements.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-3">No badges earned yet.</p>
      ) : (
        <>
          {medals.length > 0 && (
            <div>
              <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-2">Competition Medals</div>
              <div className="flex flex-wrap gap-3">
                {medals.map((m) => (
                  <div key={m.competition_id} className="flex flex-col items-center text-center w-24">
                    <MedalBadge placing={m.placing} shape={m.medal_shape} size={56} />
                    <div className="text-[10px] font-medium text-foreground mt-1 line-clamp-2 leading-tight">{m.competition_name}</div>
                    <div className="text-[9px] text-muted-foreground">
                      {new Date(m.earned_date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {standard.length > 0 && (
            <div>
              <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-2">Milestones</div>
              <div className="grid grid-cols-2 gap-2">
                {standard.map((a, i) => <AchievementBadge key={i} achievement={a} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}