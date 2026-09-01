import React, { useState } from "react";
import { X, Plus, Trash2, Loader2, Check } from "lucide-react";

/**
 * Admin editor for the yearly quote cycle. Manages a list of up to 52
 * { text, author } quotes that the feed rotates through week by week.
 */
export default function QuoteCycleEditor({ initial = [], max = 52, onCancel, onSave }) {
  const [rows, setRows] = useState(() =>
    initial && initial.length
      ? initial.map((q) => ({ text: q.text || "", author: q.author || "" }))
      : [{ text: "", author: "" }]
  );
  const [saving, setSaving] = useState(false);

  const update = (i, field, val) =>
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [field]: val } : r)));
  const add = () => setRows((prev) => (prev.length >= max ? prev : [...prev, { text: "", author: "" }]));
  const remove = (i) => setRows((prev) => prev.filter((_, idx) => idx !== i));

  const valid = rows.filter((r) => r.text.trim() && r.author.trim());

  const save = async () => {
    if (valid.length === 0) return;
    setSaving(true);
    try {
      await onSave(valid);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glass-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-semibold text-rose-600 uppercase tracking-wide">
          Yearly quote cycle · {valid.length}/{max}
        </div>
        <button onClick={onCancel} className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:bg-foreground/5 no-select">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <p className="text-[11px] text-muted-foreground -mt-1">
        Each quote shows for one week, then cycles back after the year ends.
      </p>

      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
        {rows.map((r, i) => (
          <div key={i} className="rounded-xl bg-foreground/5 p-2.5 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold text-muted-foreground w-5 shrink-0">{i + 1}</span>
              <textarea
                value={r.text}
                onChange={(e) => update(i, "text", e.target.value)}
                placeholder="Quote text…"
                rows={2}
                className="flex-1 bg-transparent rounded-lg px-2 py-1.5 text-sm text-foreground outline-none resize-none"
              />
              <button
                onClick={() => remove(i)}
                disabled={rows.length === 1}
                className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 no-select disabled:opacity-30 shrink-0"
                aria-label="Remove quote"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <input
              value={r.author}
              onChange={(e) => update(i, "author", e.target.value)}
              placeholder="Author"
              className="w-full bg-transparent rounded-lg px-2 py-1.5 text-xs text-foreground outline-none"
            />
          </div>
        ))}
      </div>

      <button
        onClick={add}
        disabled={rows.length >= max}
        className="w-full py-2 rounded-xl border border-dashed border-foreground/20 text-xs font-medium text-muted-foreground flex items-center justify-center gap-1.5 no-select hover:bg-foreground/5 disabled:opacity-40"
      >
        <Plus className="w-3.5 h-3.5" /> Add quote
      </button>

      <button
        onClick={save}
        disabled={saving || valid.length === 0}
        className="w-full py-2 rounded-xl bg-rose-600 text-white text-sm font-medium flex items-center justify-center gap-1.5 no-select disabled:opacity-50"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
        Publish {valid.length} quote(s)
      </button>
    </div>
  );
}