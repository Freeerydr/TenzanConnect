import React, { useEffect, useState } from "react";
import BackButton from "@/components/BackButton";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, ClipboardCheck, Check, UserPlus, X, Trash2, CalendarCheck, MapPin, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { localDateStr, toDateStr } from "@/lib/localDate";
import WeeklyAttendanceSummary from "@/components/WeeklyAttendanceSummary";
import SheetSelect from "@/components/SheetSelect";

export default function Attendance() {
  const { toast } = useToast();
  const [me, setMe] = useState(null);
  const [users, setUsers] = useState([]);
  const [records, setRecords] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(localDateStr());
  const [walkinName, setWalkinName] = useState("");
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState(null);
  const [checkIns, setCheckIns] = useState([]);
  const [linking, setLinking] = useState(false);
  const [linkTarget, setLinkTarget] = useState({});
  const [linkBusy, setLinkBusy] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setMe).catch(() => {});
    Promise.all([
      base44.entities.User.list("-full_name", 200).catch(() => null),
      base44.entities.Attendance.list("-session_date", 500).catch(() => []),
      base44.entities.Profile.list("-created_date", 200).catch(() => []),
      base44.entities.CheckIn.list("-created_date", 500).catch(() => []),
    ]).then(([us, r, p, ci]) => {
      const profileList = p || [];
      let userList = us || [];
      if (userList.length === 0) {
        // User.list unavailable for this admin token — fall back to profiles so
        // the roster still populates. Profile.user_id is the real app user id.
        userList = profileList
          .filter((pr) => pr.user_id && pr.user_name)
          .map((pr) => ({ id: pr.user_id, full_name: pr.user_name, email: "" }));
      }
      setUsers(userList);
      setRecords(r || []);
      setProfiles(profileList);
      setCheckIns(ci || []);
    }).finally(() => setLoading(false));
  }, []);

  const isAdmin = me?.role === "admin";

  const dayRecords = records.filter((r) => r.session_date === date);
  const presentIds = new Set(dayRecords.filter((r) => r.user_id).map((r) => r.user_id));
  const walkins = dayRecords.filter((r) => !r.user_id);
  const presentCount = presentIds.size + walkins.length;

  // Prefer the member's profile display name over the account full_name/email
  const profileNameByUser = {};
  profiles.forEach((p) => { if (p.user_id && p.user_name) profileNameByUser[p.user_id] = p.user_name; });
  const displayName = (u) => profileNameByUser[u.id] || u.full_name || u.email || "Member";

  const toggle = async (u) => {
    const existing = records.find((r) => r.user_id === u.id && r.session_date === date);
    if (existing) {
      setRecords((prev) => prev.filter((x) => x.id !== existing.id));
      try {
        await base44.entities.Attendance.delete(existing.id);
      } catch {
        setRecords((prev) => [...prev, existing]);
        toast({ title: "Could not update attendance", variant: "destructive" });
      }
    } else {
      const tempId = "temp-" + Date.now();
      const optimistic = { id: tempId, user_id: u.id, user_name: displayName(u), session_date: date, class_name: "Adult" };
      setRecords((prev) => [...prev, optimistic]);
      try {
        const rec = await base44.entities.Attendance.create({ user_id: u.id, user_name: optimistic.user_name, session_date: date, class_name: "Adult" });
        setRecords((prev) => prev.map((x) => (x.id === tempId ? rec : x)));
      } catch {
        setRecords((prev) => prev.filter((x) => x.id !== tempId));
        toast({ title: "Could not record attendance", variant: "destructive" });
      }
    }
  };

  const titleCase = (s) => s.trim().split(/\s+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");

  const cycleClassForRec = async (rec) => {
    if (!rec) return;
    const order = ["Adult", "Kids", "Both"];
    const cur = order.includes(rec.class_name) ? rec.class_name : "Adult";
    const next = order[(order.indexOf(cur) + 1) % order.length];
    setRecords((prev) => prev.map((r) => (r.id === rec.id ? { ...r, class_name: next } : r)));
    try {
      await base44.entities.Attendance.update(rec.id, { class_name: next });
    } catch {
      setRecords((prev) => prev.map((r) => (r.id === rec.id ? { ...r, class_name: rec.class_name } : r)));
      toast({ title: "Could not update class", variant: "destructive" });
    }
  };

  const addWalkin = async () => {
    const name = titleCase(walkinName.trim());
    if (!name) { toast({ title: "Enter a name", variant: "destructive" }); return; }
    setAdding(true);
    try {
      const rec = await base44.entities.Attendance.create({ user_name: name, session_date: date, class_name: "Adult" });
      setRecords((prev) => [...prev, rec]);
      setWalkinName("");
    } catch {
      toast({ title: "Could not add walk-in", variant: "destructive" });
    } finally {
      setAdding(false);
    }
  };

  const removeRecord = async (rec) => {
    setRecords((prev) => prev.filter((x) => x.id !== rec.id));
    try {
      await base44.entities.Attendance.delete(rec.id);
    } catch {
      setRecords((prev) => [...prev, rec]);
      toast({ title: "Could not remove", variant: "destructive" });
    }
  };

  const transferWalkin = async (w) => {
    const memberId = linkTarget[w.key];
    const member = users.find((u) => u.id === memberId);
    if (!member) return;
    setLinkBusy(w.key);
    try {
      const ids = records
        .filter((r) => !r.user_id && (r.user_name || "").trim().toLowerCase() === w.key)
        .map((r) => r.id);
      await base44.entities.Attendance.bulkUpdate(ids.map((id) => ({ id, user_id: memberId, user_name: displayName(member) })));
      setRecords((prev) => prev.map((r) => (ids.includes(r.id) ? { ...r, user_id: memberId, user_name: displayName(member) } : r)));
      setLinkTarget((p) => { const n = { ...p }; delete n[w.key]; return n; });
      toast({ title: `Linked ${ids.length} record(s) to ${displayName(member)}` });
    } catch (e) {
      toast({ title: "Could not link records", description: e?.message || "Try again", variant: "destructive" });
    } finally {
      setLinkBusy(null);
    }
  };

  const removeMember = async (u) => {
    const name = displayName(u);
    if (!window.confirm(`Remove ${name} from the app? Their account access is revoked; their existing posts and journal entries are kept but become inaccessible.`)) return;
    setRemoving(u.id);
    try {
      await base44.entities.User.delete(u.id);
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
      setRecords((prev) => prev.filter((r) => r.user_id !== u.id));
      toast({ title: `${name} removed` });
    } catch (e) {
      toast({ title: "Could not remove member", description: e?.message || "Try again", variant: "destructive" });
    } finally { setRemoving(null); }
  };

  const counts = {};
  records.forEach((r) => { if (r.user_id) counts[r.user_id] = (counts[r.user_id] || 0) + 1; });

  const DOW = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const DAY_LABELS = { sun: "Sunday", mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday", fri: "Friday", sat: "Saturday" };
  const dayKey = DOW[new Date(date + "T00:00:00").getDay()];
  const PRACTICE_DAYS = ["mon", "tue", "wed", "thu", "sat"];
  const isPracticeDay = PRACTICE_DAYS.includes(dayKey);
  const trainingByUser = {};
  profiles.forEach((p) => {
    if (!p.user_id) return;
    const existing = trainingByUser[p.user_id];
    if (!existing || (p.training_days && p.training_days.length > 0)) {
      trainingByUser[p.user_id] = p.training_days || [];
    }
  });
  const dayCheckIns = checkIns.filter((c) => toDateStr(c.check_in_date) === date);
  const checkedInIds = new Set(dayCheckIns.filter((c) => c.user_id).map((c) => c.user_id));
  const presentUsers = users.filter((u) => presentIds.has(u.id));
  const checkedInUsers = users.filter((u) => checkedInIds.has(u.id) && !presentIds.has(u.id));
  const planned = users.filter((u) => (trainingByUser[u.id] || []).includes(dayKey) && !checkedInIds.has(u.id) && !presentIds.has(u.id));
  const others = users.filter((u) => !(trainingByUser[u.id] || []).includes(dayKey) && !checkedInIds.has(u.id) && !presentIds.has(u.id));

  const CLASS_ORDER = ["Kids", "Adult", "Both"];
  const CLASS_LABELS = { Kids: "Kids class", Adult: "Adult class", Both: "Both classes" };
  const presentMembersByClass = { Kids: [], Adult: [], Both: [] };
  presentUsers.forEach((u) => {
    const rec = dayRecords.find((r) => r.user_id === u.id);
    const c = rec?.class_name && CLASS_ORDER.includes(rec.class_name) ? rec.class_name : "Adult";
    presentMembersByClass[c].push(u);
  });
  const walkinsByClass = { Kids: [], Adult: [], Both: [] };
  walkins.forEach((w) => {
    const c = w.class_name && CLASS_ORDER.includes(w.class_name) ? w.class_name : "Adult";
    walkinsByClass[c].push(w);
  });

  const walkinList = (() => {
    const groups = {};
    records.forEach((r) => {
      if (r.user_id) return;
      const key = (r.user_name || "").trim().toLowerCase();
      if (!key) return;
      if (!groups[key]) groups[key] = { key, name: r.user_name.trim(), count: 0 };
      groups[key].count += 1;
    });
    return Object.values(groups).sort((a, b) => b.count - a.count);
  })();

  const classStyle = (c) =>
    c === "Kids" ? "bg-amber-500/15 text-amber-700"
    : c === "Both" ? "bg-violet-500/15 text-violet-700"
    : "bg-blue-500/15 text-blue-700";

  const renderMember = (u) => {
    const present = presentIds.has(u.id);
    const rec = present ? dayRecords.find((r) => r.user_id === u.id) : null;
    const classLabel = rec?.class_name && ["Kids", "Adult", "Both"].includes(rec.class_name) ? rec.class_name : "Adult";
    return (
      <div key={u.id} onClick={() => toggle(u)} className="glass-card p-3 w-full flex items-center gap-3 hover:bg-foreground/5 transition-colors no-select text-left cursor-pointer">
        <div className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0", present ? "bg-emerald-500 border-emerald-500" : "border-foreground/30")}>
          {present && <Check className="w-3.5 h-3.5 text-white" />}
        </div>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-500 to-slate-700 flex items-center justify-center text-white text-xs font-semibold">
          {(displayName(u) || "?").charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-foreground truncate">{displayName(u)}</div>
          <div className="text-[10px] text-muted-foreground">{counts[u.id] || 0} sessions total</div>
        </div>
        {present && (
          <button
            onClick={(e) => { e.stopPropagation(); cycleClassForRec(rec); }}
            className={cn("text-[10px] font-semibold px-2 py-1 rounded-full no-select shrink-0", classStyle(classLabel))}
            aria-label={`Class: ${classLabel}. Tap to change.`}
          >
            {classLabel}
          </button>
        )}
        <button onClick={(e) => { e.stopPropagation(); removeMember(u); }} disabled={removing === u.id} className="w-11 h-11 rounded-full flex items-center justify-center text-muted-foreground hover:bg-rose-500/10 hover:text-rose-600 no-select disabled:opacity-50" aria-label="Remove member from app">
          {removing === u.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
        </button>
      </div>
    );
  };

  const renderWalkin = (w) => {
    const wLabel = w.class_name && ["Kids", "Adult", "Both"].includes(w.class_name) ? w.class_name : "Adult";
    const wName = titleCase(w.user_name || "");
    return (
      <div key={w.id} className="glass-card p-3 flex items-center gap-3">
        <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
          <Check className="w-3.5 h-3.5 text-white" />
        </div>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-xs font-semibold">
          {wName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-foreground truncate">{wName}</div>
          <div className="text-[10px] text-muted-foreground">Walk-in</div>
        </div>
        <button
          onClick={() => cycleClassForRec(w)}
          className={cn("text-[10px] font-semibold px-2 py-1 rounded-full no-select shrink-0", classStyle(wLabel))}
          aria-label={`Class: ${wLabel}. Tap to change.`}
        >
          {wLabel}
        </button>
        <button onClick={() => removeRecord(w)} className="w-11 h-11 rounded-full flex items-center justify-center text-muted-foreground hover:bg-foreground/5 no-select" aria-label="Remove">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  };

  if (!loading && me && !isAdmin) {
    return (
      <div className="min-h-screen relative">
        <div className="fixed inset-0 -z-10 bg-gradient-to-b from-amber-50 via-white to-slate-100" />
        <main className="app-main px-3">
          <div className="mx-auto max-w-2xl glass-card p-10 text-center">
            <p className="text-sm text-muted-foreground">Admins only. Talk to a coach if you need access.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-amber-50 via-white to-slate-100" />
      <main className="app-main px-3">
        <div className="mx-auto max-w-2xl space-y-4">
          <BackButton to="/" label="Back to Feed" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Attendance</h1>
            <p className="text-sm text-muted-foreground mt-1">Record who showed up to class</p>
          </div>

          <WeeklyAttendanceSummary records={records} users={users} />

          <div className="flex items-stretch gap-2">
            <div className="glass-card p-3 flex items-center gap-2 flex-1">
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="text-xs text-muted-foreground bg-foreground/5 rounded-full px-3 py-1.5 outline-none" />
              <span className="text-xs text-muted-foreground ml-auto">{presentCount} present</span>
            </div>
            <button onClick={() => setLinking((v) => !v)} className={cn("glass-card px-3 flex items-center justify-center gap-1.5 text-xs font-medium no-select flex-1", linking ? "bg-foreground text-background" : "text-foreground")}>
              <Link2 className="w-4 h-4" /> Link walk-ins
            </button>
          </div>

          {linking && (
            <div className="glass-card p-4 space-y-3">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Link walk-in records to a member</div>
              <div className="text-[11px] text-muted-foreground -mt-1">Transfers all past attendance for a walk-in name to the selected member.</div>
              {walkinList.length === 0 ? (
                <p className="text-xs text-muted-foreground">No walk-in records to link.</p>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {walkinList.map((w) => (
                    <div key={w.key} className="flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">{w.name}</div>
                        <div className="text-[10px] text-muted-foreground">{w.count} record(s)</div>
                      </div>
                      <SheetSelect
                        value={linkTarget[w.key] || ""}
                        onChange={(v) => setLinkTarget((p) => ({ ...p, [w.key]: v }))}
                        options={users.map((u) => ({ value: u.id, label: displayName(u) }))}
                        placeholder="Select member…"
                        triggerClassName="w-40 text-sm text-foreground bg-foreground/5 rounded-xl px-3 py-2 border-none shadow-none"
                      />
                      <button
                        onClick={() => transferWalkin(w)}
                        disabled={!linkTarget[w.key] || linkBusy === w.key}
                        className="text-xs font-medium px-3 py-2 rounded-full bg-rose-600 text-white flex items-center gap-1 no-select disabled:opacity-50"
                      >
                        {linkBusy === w.key ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5" />}
                        Link
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="glass-card p-3 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-500/15 flex items-center justify-center shrink-0">
              <UserPlus className="w-4 h-4 text-amber-600" />
            </div>
            <input
              value={walkinName}
              onChange={(e) => setWalkinName(e.target.value)}
              placeholder="Add a new face (name)"
              className="flex-1 text-sm text-foreground bg-foreground/5 rounded-xl px-3 py-2 outline-none"
              onKeyDown={(e) => { if (e.key === "Enter") addWalkin(); }}
            />
            <button onClick={addWalkin} disabled={adding} className="text-xs font-medium px-3 py-2 rounded-full bg-rose-600 text-white flex items-center gap-1 no-select disabled:opacity-60">
              {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Add"}
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="space-y-2">
              {users.length === 0 && walkins.length === 0 ? (
                <div className="glass-card p-8 text-center">
                  <ClipboardCheck className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No members yet. Add new faces above.</p>
                </div>
              ) : (
                <>
                  {users.length === 0 && (
                    <div className="text-xs text-muted-foreground px-1">No app members yet — add walk-ins above.</div>
                  )}
                  {(presentUsers.length > 0 || walkins.length > 0) && (
                    <div className="space-y-2">
                      <div className="text-[11px] uppercase tracking-wide text-emerald-600 px-1 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Present tonight · {presentUsers.length + walkins.length}
                      </div>
                      {CLASS_ORDER.map((c) => {
                        const members = presentMembersByClass[c];
                        const wins = walkinsByClass[c];
                        if (!members.length && !wins.length) return null;
                        return (
                          <div key={c} className="space-y-2">
                            <div className="flex items-center gap-2 px-1 pt-1">
                              <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", classStyle(c))}>
                                {CLASS_LABELS[c]}
                              </span>
                              <span className="text-[10px] text-muted-foreground">{members.length + wins.length}</span>
                            </div>
                            {members.map(renderMember)}
                            {wins.map(renderWalkin)}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {checkedInUsers.length > 0 && (
                    <>
                      <div className="text-[11px] uppercase tracking-wide text-rose-600 px-1 pt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> Checked in tonight
                      </div>
                      {checkedInUsers.map(renderMember)}
                    </>
                  )}
                  {isPracticeDay && planned.length > 0 && (
                    <>
                      <div className="text-[11px] uppercase tracking-wide text-emerald-600 px-1 pt-1 flex items-center gap-1">
                        <CalendarCheck className="w-3 h-3" /> Planning to train · {DAY_LABELS[dayKey]}
                      </div>
                      {planned.map(renderMember)}
                    </>
                  )}
                  {isPracticeDay && others.length > 0 && (
                    <>
                      <div className="text-[11px] uppercase tracking-wide text-muted-foreground px-1 pt-3 mt-2 border-t border-foreground/10">
                        Not planning · {DAY_LABELS[dayKey]}
                      </div>
                      {others.map(renderMember)}
                    </>
                  )}
                  {!isPracticeDay && (
                    <div className="text-[11px] text-muted-foreground px-1 pt-2">No practice on {DAY_LABELS[dayKey]}s.</div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}