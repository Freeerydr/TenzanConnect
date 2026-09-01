import React, { useEffect, useState } from "react";
import BackButton from "@/components/BackButton";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Plus, CalendarDays, MapPin, Users as UsersIcon, Check, Loader2, Trash2 } from "lucide-react";

export default function Events() {
  const { toast } = useToast();
  const [me, setMe] = useState(null);
  const [events, setEvents] = useState([]);
  const [rsvps, setRsvps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", event_date: "", location: "", capacity: "" });

  useEffect(() => {
    base44.auth.me().then(setMe).catch(() => {});
    Promise.all([
      base44.entities.Event.list("event_date", 50),
      base44.entities.EventRSVP.list("-created_date", 500),
    ]).then(([e, r]) => { setEvents(e || []); setRsvps(r || []); }).finally(() => setLoading(false));
  }, []);

  const isAdmin = me?.role === "admin";

  const rsvpsByEvent = {};
  rsvps.forEach((r) => { (rsvpsByEvent[r.event_id] ||= []).push(r); });

  const addEvent = async () => {
    if (!form.title.trim() || !form.event_date) { toast({ title: "Title and date are required", variant: "destructive" }); return; }
    try {
      const e = await base44.entities.Event.create({
        title: form.title.trim(),
        description: form.description,
        event_date: new Date(form.event_date).toISOString(),
        location: form.location,
        capacity: form.capacity === "" ? null : Number(form.capacity),
      });
      // Announce the new event in the community feed
      try {
        const when = new Date(e.event_date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
        await base44.entities.Post.create({
          content: `📅 New event: ${e.title}${when ? " · " + when : ""}${e.location ? " · " + e.location : ""}`,
          author_name: me?.full_name || me?.email || "Tenzan",
          category: "event",
          is_announcement: true,
          event_id: e.id,
        });
      } catch {}
      setEvents((prev) => [...prev, e].sort((a, b) => new Date(a.event_date) - new Date(b.event_date)));
      setForm({ title: "", description: "", event_date: "", location: "", capacity: "" });
      setAdding(false);
    } catch { toast({ title: "Could not create event", variant: "destructive" }); }
  };

  const removeEvent = async (e) => {
    try {
      await base44.entities.Event.delete(e.id);
      setEvents((prev) => prev.filter((x) => x.id !== e.id));
      // Remove the linked feed announcement (and its comments)
      try {
        const posts = await base44.entities.Post.filter({ event_id: e.id });
        await Promise.all((posts || []).map(async (p) => {
          try {
            const comments = await base44.entities.Comment.filter({ post_id: p.id });
            await Promise.all((comments || []).map((c) => base44.entities.Comment.delete(c.id)));
          } catch {}
          return base44.entities.Post.delete(p.id);
        }));
      } catch {}
    } catch {}
  };

  const signup = async (e) => {
    try {
      const r = await base44.entities.EventRSVP.create({ event_id: e.id, attendee_name: me?.full_name || me?.email || "Member" });
      setRsvps((prev) => [...prev, r]);
    } catch { toast({ title: "Could not sign up", variant: "destructive" }); }
  };
  const cancel = async (r) => {
    try { await base44.entities.EventRSVP.delete(r.id); setRsvps((prev) => prev.filter((x) => x.id !== r.id)); } catch {}
  };

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-emerald-50 via-white to-slate-100" />
      <main className="app-main px-3">
        <div className="mx-auto max-w-2xl space-y-4">
          <BackButton to="/" label="Back to Feed" />
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Events & Seminars</h1>
              <p className="text-sm text-muted-foreground mt-1">Learn about upcoming dojo events</p>
            </div>
            {isAdmin && (
              <button onClick={() => setAdding((v) => !v)} className="w-11 h-11 rounded-full bg-rose-600 text-white flex items-center justify-center no-select">
                <Plus className="w-5 h-5" />
              </button>
            )}
          </div>

          {isAdmin && adding && (
            <div className="glass-card p-4 space-y-3">
              <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Event title — e.g. 'Open Mat Seminar'" className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none" />
              <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Description" rows={2} className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none" />
              <div className="flex gap-2 flex-wrap">
                <input type="datetime-local" value={form.event_date} onChange={(e) => setForm((f) => ({ ...f, event_date: e.target.value }))} className="text-xs text-muted-foreground bg-foreground/5 rounded-full px-3 py-1.5 outline-none" />
                <input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} placeholder="Location" className="flex-1 min-w-[120px] text-xs text-foreground bg-foreground/5 rounded-full px-3 py-1.5 outline-none" />
              </div>
              <input type="number" value={form.capacity} onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))} placeholder="Capacity (optional)" className="w-44 text-xs text-foreground bg-foreground/5 rounded-full px-3 py-1.5 outline-none" />
              <button onClick={addEvent} className="w-full py-2.5 rounded-xl bg-rose-600 text-white text-sm font-medium no-select">Create event</button>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : events.length === 0 ? (
            <div className="glass-card p-10 text-center">
              <CalendarDays className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No events scheduled.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((e) => {
                const list = rsvpsByEvent[e.id] || [];
                const mine = list.find((r) => r.created_by_id === me?.id);
                const full = e.capacity != null && list.length >= e.capacity;
                return (
                  <div key={e.id} className="glass-card p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-foreground">{e.title}</h3>
                        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
                          <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{new Date(e.event_date).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
                          {e.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{e.location}</span>}
                        </div>
                      </div>
                      {isAdmin && <button onClick={() => removeEvent(e)} className="w-11 h-11 rounded-full flex items-center justify-center text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 no-select shrink-0"><Trash2 className="w-4 h-4" /></button>}
                    </div>
                    {e.description && <p className="text-sm text-foreground/80">{e.description}</p>}
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><UsersIcon className="w-3.5 h-3.5" />{list.length}{e.capacity ? ` / ${e.capacity}` : ""} going</span>
                      {mine ? (
                        <button onClick={() => cancel(mine)} className="text-xs font-medium px-3 py-1.5 rounded-full bg-emerald-500/15 text-emerald-700 no-select flex items-center gap-1"><Check className="w-3 h-3" />You're in</button>
                      ) : full ? (
                        <span className="text-xs text-muted-foreground">Full</span>
                      ) : (
                        <button onClick={() => signup(e)} className="text-xs font-medium px-3 py-1.5 rounded-full bg-rose-600 text-white no-select">Learn about</button>
                      )}
                    </div>
                    {list.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {list.map((r) => (
                          <span key={r.id} className="text-[10px] bg-foreground/5 text-muted-foreground px-2 py-0.5 rounded-full">{r.attendee_name}</span>
                        ))}
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