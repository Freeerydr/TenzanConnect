import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { BarChart3, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PollWidget({ postId, options, meId }) {
  const { toast } = useToast();
  const [votes, setVotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(null);

  useEffect(() => {
    let active = true;
    base44.entities.PollVote.filter({ post_id: postId }, "created_date", 500)
      .then((v) => { if (active) setVotes(v || []); })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [postId]);

  const opts = Array.isArray(options) ? options.filter((o) => o && o.trim()) : [];
  const counts = opts.map((_, i) => votes.filter((v) => v.option_index === i).length);
  const total = votes.length;
  const myVote = votes.find((v) => v.created_by_id === meId);

  const vote = async (i) => {
    if (!meId || voting !== null) return;
    if (myVote && myVote.option_index === i) return;
    setVoting(i);
    try {
      if (myVote) {
        const updated = await base44.entities.PollVote.update(myVote.id, { option_index: i });
        setVotes((prev) => prev.map((v) => (v.id === myVote.id ? updated : v)));
      } else {
        const created = await base44.entities.PollVote.create({ post_id: postId, option_index: i });
        setVotes((prev) => [...prev, created]);
      }
    } catch {
      toast({ title: "Could not register vote", variant: "destructive" });
    } finally {
      setVoting(null);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
        <BarChart3 className="w-3.5 h-3.5" />
        Poll · {total} {total === 1 ? "vote" : "votes"}
      </div>
      <div className="space-y-1.5">
        {opts.map((opt, i) => {
          const c = counts[i];
          const pct = total > 0 ? Math.round((c / total) * 100) : 0;
          const mine = myVote?.option_index === i;
          return (
            <button
              key={i}
              onClick={() => vote(i)}
              disabled={loading || voting !== null}
              className={cn(
                "relative w-full text-left px-3 py-2 rounded-xl border text-sm overflow-hidden transition-colors no-select",
                mine
                  ? "border-rose-400 bg-rose-500/10 text-foreground"
                  : "border-foreground/10 bg-foreground/5 text-foreground hover:bg-foreground/10"
              )}
            >
              {total > 0 && (
                <span className="absolute inset-y-0 left-0 bg-rose-500/15" style={{ width: `${pct}%` }} />
              )}
              <span className="relative flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5">
                  {mine && <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />}
                  {opt}
                </span>
                <span className="text-[11px] text-muted-foreground tabular-nums">{total > 0 ? `${pct}%` : "—"}</span>
              </span>
            </button>
          );
        })}
      </div>
      {loading && (
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Loader2 className="w-3 h-3 animate-spin" /> Loading votes…
        </div>
      )}
    </div>
  );
}