import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Check, MapPin, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { localDateStr, toDateStr } from "@/lib/localDate";

const todayStr = () => localDateStr();

export default function SelfCheckIn() {
  const { user: me } = useAuth();
  const { toast } = useToast();
  const [mine, setMine] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!me) { setLoading(false); return; }
    try {
      const list = await base44.entities.CheckIn.filter({ user_id: me.id }, "-created_date", 50);
      setMine(list || []);
    } catch {
      setMine([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [me?.id]);

  const today = todayStr();
  const checkedInToday = mine.some((r) => toDateStr(r.check_in_date) === today);

  // Check-in is a soft signal — it surfaces the member at the top of the
  // attendance list without marking them present. Only admins record attendance.
  const checkIn = async () => {
    if (!me) return;
    setBusy(true);
    try {
      await base44.entities.CheckIn.create({
        user_id: me.id,
        user_name: me.full_name || me.email || "Member",
        check_in_date: today,
      });
      toast({ title: "Checked in for tonight ✓" });
      await load();
    } catch {
      toast({ title: "Could not check in", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const uncheck = async () => {
    const todayRecord = mine.find((r) => toDateStr(r.check_in_date) === today);
    if (!todayRecord) return;
    setBusy(true);
    try {
      await base44.entities.CheckIn.delete(todayRecord.id);
      setMine((prev) => prev.filter((r) => r.id !== todayRecord.id));
      toast({ title: "Checked out" });
    } catch {
      toast({ title: "Could not undo check-in", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="glass-card p-3.5 flex items-center gap-3">
      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0", checkedInToday ? "bg-emerald-500/15" : "bg-rose-500/10")}>
        {checkedInToday ? <Check className="w-5 h-5 text-emerald-600" /> : <MapPin className="w-5 h-5 text-rose-600" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-foreground">{checkedInToday ? "Checked in for tonight" : "Check in to class"}</div>
        <div className="text-xs text-muted-foreground">{checkedInToday ? "You'll be at the top of tonight's list" : "Check in for tonight's practice"}</div>
      </div>
      {!checkedInToday ? (
        <button
          onClick={checkIn}
          disabled={busy || loading}
          className="px-4 py-2 rounded-full bg-rose-600 text-white text-sm font-medium flex items-center gap-1.5 no-select disabled:opacity-60 shrink-0"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          Check in
        </button>
      ) : (
        <button
          onClick={uncheck}
          disabled={busy}
          className="px-4 py-2 rounded-full bg-foreground/10 text-foreground text-sm font-medium flex items-center gap-1.5 no-select disabled:opacity-60 shrink-0"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
          Undo
        </button>
      )}
    </div>
  );
}