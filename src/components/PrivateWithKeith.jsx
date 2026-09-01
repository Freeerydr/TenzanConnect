import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { CalendarClock, Loader2 } from "lucide-react";

const KEITH_HANDLE = "keithbookman91";

export default function PrivateWithKeith() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  const open = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const me = await base44.auth.me();
      const users = await base44.entities.User.list("-created_date", 500);
      const keith = (users || []).find((u) => {
        const email = (u.email || "").toLowerCase().trim();
        const name = (u.full_name || "").toLowerCase().trim();
        return email === KEITH_HANDLE || email.startsWith(KEITH_HANDLE + "@") || name === KEITH_HANDLE;
      });
      if (!keith) { toast({ title: "Couldn't find Keith's account", variant: "destructive" }); return; }
      if (keith.id === me.id) { toast({ title: "That's you!" }); return; }
      const convos = await base44.entities.Conversation.list("-updated_date", 200);
      const existing = convos.find((c) => c.participant_ids?.includes(keith.id));
      if (existing) { navigate(`/messages/${existing.id}`); return; }
      const convo = await base44.entities.Conversation.create({
        participant_ids: [me.id, keith.id],
        participant_names: [me.full_name || me.email || "You", keith.full_name || keith.email || "Keith"],
        last_message: "",
      });
      navigate(`/messages/${convo.id}`);
    } catch {
      toast({ title: "Could not open conversation", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="glass-card p-3 h-full">
      <button
        onClick={open}
        disabled={busy}
        className="w-full flex items-center gap-3 no-select disabled:opacity-60"
        aria-label="Message Professor Keith"
      >
        <div className="w-9 h-9 rounded-full bg-violet-500/15 flex items-center justify-center shrink-0">
          {busy ? <Loader2 className="w-4 h-4 text-violet-600 animate-spin" /> : <CalendarClock className="w-4 h-4 text-violet-600" />}
        </div>
        <div className="flex-1 text-left">
          <div className="text-sm font-semibold text-foreground">Private with Keith</div>
          <div className="text-xs text-muted-foreground">Open a 1-on-1 with Professor Keith</div>
        </div>
      </button>
    </div>
  );
}