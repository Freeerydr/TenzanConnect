import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Quote, Pencil } from "lucide-react";
import QuoteCycleEditor from "@/components/QuoteCycleEditor";

// Pick the active week's quote: week 0 = Jan 1–7, cycling through the list.
function weekOfYear() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((now - start) / 86400000);
  return Math.floor(dayOfYear / 7);
}

export default function QuoteOfWeekCard({ isAdmin }) {
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const load = () => {
    setLoading(true);
    base44.entities.QuoteOfTheWeek.list("-created_date", 1)
      .then((list) => setQuote(list[0] || null))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const save = async (quotes) => {
    const created = await base44.entities.QuoteOfTheWeek.create({
      quotes,
      text: quotes[0].text,
      author: quotes[0].author,
    });
    setQuote(created);
    setEditing(false);
  };

  if (loading) return null;

  if (editing) {
    return (
      <QuoteCycleEditor
        initial={quote?.quotes || []}
        onCancel={() => setEditing(false)}
        onSave={save}
      />
    );
  }

  const cycle = (quote?.quotes || []).filter((q) => q.text && q.author);
  const current = cycle.length
    ? cycle[weekOfYear() % cycle.length]
    : quote?.text && quote?.author
      ? { text: quote.text, author: quote.author }
      : null;

  if (!current) {
    if (!isAdmin) return null;
    return (
      <div className="glass-card p-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-rose-500/15 flex items-center justify-center shrink-0">
          <Quote className="w-4 h-4 text-rose-600" />
        </div>
        <div className="flex-1">
          <div className="text-[10px] font-semibold text-rose-600 uppercase tracking-wide">Quote of the Week</div>
          <p className="text-xs text-muted-foreground">No quote set yet.</p>
        </div>
        <button onClick={() => setEditing(true)} className="text-xs font-medium px-3 py-1.5 rounded-full bg-rose-600 text-white flex items-center gap-1 no-select">
          <Pencil className="w-3 h-3" /> Add
        </button>
      </div>
    );
  }

  return (
    <div className="glass-card p-4 relative overflow-hidden">
      <div className="absolute -top-3 -left-1 text-rose-500/10 text-7xl font-serif leading-none select-none pointer-events-none">&ldquo;</div>
      <div className="relative flex gap-3">
        <div className="w-8 h-8 rounded-full bg-rose-500/15 flex items-center justify-center shrink-0">
          <Quote className="w-4 h-4 text-rose-600" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-semibold text-rose-600 uppercase tracking-wide mb-1">Quote of the Week</div>
          <p className="text-sm text-foreground leading-relaxed italic">{current.text}</p>
          <div className="text-xs font-medium text-muted-foreground mt-1.5">— {current.author}</div>
        </div>
        {isAdmin && (
          <button onClick={() => setEditing(true)} className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:bg-foreground/5 no-select shrink-0" aria-label="Edit quotes">
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}