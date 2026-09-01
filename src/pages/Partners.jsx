import React, { useEffect, useState, useMemo } from "react";
import BackButton from "@/components/BackButton";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Plus, Trash2, Save, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Partners() {
  const { toast } = useToast();
  const [entries, setEntries] = useState([]);
  const [noteRecords, setNoteRecords] = useState([]);
  const [meId, setMeId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editDrafts, setEditDrafts] = useState({});
  const [savingKey, setSavingKey] = useState(null);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [savingNew, setSavingNew] = useState(false);
  const [rolls, setRolls] = useState([]);

  useEffect(() => {
    base44.auth.me().then((u) => setMeId(u?.id || null)).catch(() => {});
    Promise.all([
      base44.entities.JournalEntry.list("-training_date", 200),
      base44.entities.PartnerNote.list("-updated_date", 200),
      base44.entities.Roll.list("-training_date", 500),
    ])
      .then(([e, n, r]) => { setEntries(e || []); setNoteRecords(n || []); setRolls(r || []); })
      .finally(() => setLoading(false));
  }, []);

  const notesByName = useMemo(() => {
    const m = {};
    noteRecords.forEach((r) => { m[(r.name || "").toLowerCase()] = r; });
    return m;
  }, [noteRecords]);

  const rollByPartner = useMemo(() => {
    const m = {};
    rolls.forEach((r) => {
      const key = (r.partner_name || "").toLowerCase();
      if (!m[key]) m[key] = { submitted: 0, tapped: 0, total: 0 };
      m[key].total++;
      if (r.outcome === "submitted") m[key].submitted++;
      if (r.outcome === "tapped") m[key].tapped++;
    });
    return m;
  }, [rolls]);

  const partners = useMemo(() => {
    const map = {};
    const list = meId ? entries.filter((e) => e.created_by_id === meId) : entries;
    list.forEach((e) => {
      if (!e.partners) return;
      String(e.partners).split(",").map((s) => s.trim()).filter(Boolean).forEach((name) => {
        const key = name.toLowerCase();
        if (!map[key]) map[key] = { key, name, count: 0, lastDate: null };
        map[key].count++;
        const d = e.training_date ? new Date(e.training_date) : null;
        if (d && (!map[key].lastDate || d > map[key].lastDate)) map[key].lastDate = d;
      });
    });
    noteRecords.forEach((r) => {
      const key = (r.name || "").toLowerCase();
      if (!map[key]) map[key] = { key, name: r.name, count: 0, lastDate: null };
    });
    return Object.values(map).sort((a, b) => {
      const an = notesByName[a.key] ? 1 : 0;
      const bn = notesByName[b.key] ? 1 : 0;
      if (bn !== an) return bn - an;
      return b.count - a.count;
    });
  }, [entries, meId, noteRecords, notesByName]);

  const saveNote = async (p) => {
    const existing = notesByName[p.key];
    const draft = (editDrafts[p.key] ?? existing?.notes ?? "").trim();
    setSavingKey(p.key);
    try {
      if (!draft) {
        if (existing) {
          await base44.entities.PartnerNote.delete(existing.id);
          setNoteRecords((prev) => prev.filter((r) => r.id !== existing.id));
        }
      } else if (existing) {
        const updated = await base44.entities.PartnerNote.update(existing.id, { notes: draft });
        setNoteRecords((prev) => prev.map((r) => (r.id === existing.id ? updated : r)));
      } else {
        const created = await base44.entities.PartnerNote.create({ name: p.name, notes: draft });
        setNoteRecords((prev) => [...prev, created]);
      }
      setEditDrafts((prev) => { const n = { ...prev }; delete n[p.key]; return n; });
    } catch {
      toast({ title: "Could not save note", variant: "destructive" });
    } finally {
      setSavingKey(null);
    }
  };

  const deleteNote = async (p) => {
    const existing = notesByName[p.key];
    if (!existing) return;
    setSavingKey(p.key);
    try {
      await base44.entities.PartnerNote.delete(existing.id);
      setNoteRecords((prev) => prev.filter((r) => r.id !== existing.id));
      setEditDrafts((prev) => { const n = { ...prev }; delete n[p.key]; return n; });
    } catch {
      toast({ title: "Could not delete note", variant: "destructive" });
    } finally {
      setSavingKey(null);
    }
  };

  const addOpponent = async () => {
    const name = newName.trim();
    if (!name) { toast({ title: "Enter a name", variant: "destructive" }); return; }
    setSavingNew(true);
    try {
      const created = await base44.entities.PartnerNote.create({ name, notes: newNotes.trim() });
      setNoteRecords((prev) => [...prev, created]);
      setNewName(""); setNewNotes(""); setAdding(false);
    } catch {
      toast({ title: "Could not add opponent", variant: "destructive" });
    } finally {
      setSavingNew(false);
    }
  };

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-sky-50 via-white to-slate-100" />
      <main className="app-main px-3">
        <div className="mx-auto max-w-2xl space-y-4">
          <BackButton to="/journal" label="Back to Journal" />
          <div className="flex items-start justify-between gap-2">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Opponent Notes</h1>
              <p className="text-sm text-muted-foreground mt-1">Scout and remember the people you roll with</p>
            </div>
            <button onClick={() => setAdding((v) => !v)} className={cn("flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-full no-select shrink-0", adding ? "bg-foreground text-background" : "bg-rose-600 text-white")}>
              <Plus className="w-4 h-4" /> Add opponent
            </button>
          </div>

          {adding && (
            <div className="glass-card p-4 space-y-3">
              <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Opponent name" className="w-full text-sm text-foreground bg-foreground/5 rounded-xl px-3 py-2 outline-none" />
              <textarea value={newNotes} onChange={(e) => setNewNotes(e.target.value)} placeholder="Notes on their game, habits, go-to moves, what worked…" rows={3} className="w-full text-sm text-foreground bg-foreground/5 rounded-xl px-3 py-2 outline-none resize-none" />
              <div className="flex items-center gap-2">
                <button onClick={addOpponent} disabled={savingNew} className="flex-1 py-2 rounded-xl bg-rose-600 text-white text-sm font-medium flex items-center justify-center gap-2 no-select disabled:opacity-60">
                  {savingNew ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add
                </button>
                <button onClick={() => { setAdding(false); setNewName(""); setNewNotes(""); }} className="px-3 py-2 rounded-xl bg-foreground/5 text-sm text-muted-foreground no-select">Cancel</button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : partners.length === 0 ? (
            <div className="glass-card p-10 text-center">
              <ClipboardList className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No opponents tracked yet.</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Add who you're scouting, or log a session with partners.</p>
              <button onClick={() => setAdding(true)} className="inline-flex items-center gap-1.5 text-sm font-medium text-rose-600 mt-3 no-select"><Plus className="w-4 h-4" /> Add your first opponent</button>
            </div>
          ) : (
            <div className="space-y-2">
              {partners.map((p) => {
                const existing = notesByName[p.key];
                const draft = editDrafts[p.key] ?? existing?.notes ?? "";
                const dirty = (existing?.notes ?? "") !== draft;
                const saving = savingKey === p.key;
                return (
                  <div key={p.key} className="glass-card p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white text-sm font-semibold shrink-0">
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-foreground">{p.name}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {p.count > 0 ? `${p.count} session${p.count !== 1 ? "s" : ""}${p.lastDate ? ` · last ${new Date(p.lastDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}` : ""}` : "Manual entry"}
                        </div>
                        {rollByPartner[p.key]?.total > 0 && (
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            <span className="text-emerald-600 font-medium">{rollByPartner[p.key].submitted}</span>–<span className="text-rose-600 font-medium">{rollByPartner[p.key].tapped}</span> rolls
                          </div>
                        )}
                      </div>
                      {existing && (
                        <button onClick={() => deleteNote(p)} disabled={saving} className="w-11 h-11 rounded-full flex items-center justify-center text-muted-foreground hover:bg-rose-500/10 hover:text-rose-600 no-select disabled:opacity-50" aria-label="Delete note">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <textarea
                      value={draft}
                      onChange={(e) => setEditDrafts((prev) => ({ ...prev, [p.key]: e.target.value }))}
                      placeholder="Notes on their game, habits, go-to moves, what worked…"
                      rows={3}
                      className="w-full text-sm text-foreground bg-foreground/5 rounded-xl px-3 py-2 outline-none resize-none"
                    />
                    {dirty && (
                      <div className="flex items-center gap-2">
                        <button onClick={() => saveNote(p)} disabled={saving} className="text-xs font-medium px-3 py-1.5 rounded-full bg-rose-600 text-white flex items-center gap-1.5 no-select disabled:opacity-60">
                          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save notes
                        </button>
                        <button onClick={() => setEditDrafts((prev) => { const n = { ...prev }; delete n[p.key]; return n; })} disabled={saving} className="text-xs text-muted-foreground px-2 py-1.5 no-select">Discard</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}