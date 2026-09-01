// Pure client-side achievement computation.
// Derives mat-time milestones, weekly streaks, and competition medals
// directly from the user's own JournalEntry + Competition records,
// so no backend sync function or persisted Achievement entity is needed.

export const MAT_TIERS = [10, 25, 50, 100, 250, 500];
export const STREAK_TIERS = [2, 4, 8, 12, 26, 52];

function weekStartISO(dateStr) {
  const d = new Date(dateStr + "T00:00:00Z");
  const day = d.getUTCDay(); // 0 Sun .. 6 Sat
  const diff = day === 0 ? 6 : day - 1; // days back to Monday
  return new Date(d.getTime() - diff * 86400000).toISOString().slice(0, 10);
}

export function computeAchievements(entries, competitions) {
  const myEntries = (entries || []).filter(
    (e) => e.training_date && Number(e.duration_minutes) > 0
  );
  const myComps = competitions || [];
  const result = [];

  // --- Mat-time milestones ---
  const sortedByDate = [...myEntries].sort(
    (a, b) => new Date(a.training_date) - new Date(b.training_date)
  );
  const totalHours = myEntries.reduce((s, e) => s + (Number(e.duration_minutes) || 0), 0) / 60;
  for (const tier of MAT_TIERS) {
    if (totalHours >= tier) {
      let cum = 0;
      let crossed = null;
      for (const e of sortedByDate) {
        cum += Number(e.duration_minutes) || 0;
        if (cum >= tier * 60) { crossed = e.training_date; break; }
      }
      result.push({
        kind: "mat_hours",
        title: `${tier} Hours of Mat Time`,
        description: `Logged ${tier} total hours on the mat.`,
        icon: "🥋",
        threshold: tier,
        earned_date: crossed || new Date().toISOString().slice(0, 10),
      });
    }
  }

  // --- Weekly streak milestones ---
  const weeks = [...new Set(myEntries.map((e) => weekStartISO(e.training_date)))].sort();
  let bestRun = 0;
  let bestRunStart = null;
  let runLen = 0;
  let runStart = null;
  for (let i = 0; i < weeks.length; i++) {
    if (i === 0) { runLen = 1; runStart = weeks[i]; }
    else {
      const gapDays = Math.round(
        (new Date(weeks[i] + "T00:00:00Z").getTime() - new Date(weeks[i - 1] + "T00:00:00Z").getTime()) / 86400000
      );
      if (gapDays === 7) runLen++; else { runLen = 1; runStart = weeks[i]; }
    }
    if (runLen > bestRun) { bestRun = runLen; bestRunStart = runStart; }
  }
  for (const tier of STREAK_TIERS) {
    if (bestRun >= tier) {
      const earnedMs = new Date(bestRunStart + "T00:00:00Z").getTime() + (tier - 1) * 7 * 86400000;
      result.push({
        kind: "streak",
        title: `${tier}-Week Streak`,
        description: `Trained every week for ${tier} straight weeks.`,
        icon: "🔥",
        threshold: tier,
        earned_date: new Date(earnedMs).toISOString().slice(0, 10),
      });
    }
  }

  // --- Competition medals ---
  for (const c of myComps) {
    if (c.placing && c.medal_shape) {
      const placingLabel = c.placing.charAt(0).toUpperCase() + c.placing.slice(1);
      result.push({
        kind: "competition_medal",
        title: `${placingLabel} · ${c.name}`,
        description: `Placed ${c.placing} at ${c.name}.`,
        earned_date: c.event_date || new Date().toISOString().slice(0, 10),
        competition_id: c.id,
        competition_name: c.name,
        placing: c.placing,
        medal_shape: c.medal_shape,
      });
    }
  }

  return result.sort((a, b) => new Date(b.earned_date) - new Date(a.earned_date));
}