import React, { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { UserPlus, X, Send } from "lucide-react";

const CLASS_LINK = "https://tenzanjiujitsu.com/classes";

export default function InviteFriend() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");

  const send = () => {
    const to = email.trim();
    if (!to) {
      toast({ title: "Enter an email address", variant: "destructive" });
      return;
    }
    const subject = encodeURIComponent("Come roll with us at Tenzan Jiu-Jitsu");
    const body = encodeURIComponent(
      `Hey! Come train with us at Tenzan Jiu-Jitsu. Check out the class schedule here: ${CLASS_LINK}`
    );
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
    toast({ title: `Opening your email to ${to}` });
    setEmail("");
    setOpen(false);
  };

  return (
    <div className="glass-card p-3 h-full">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="w-full flex items-center gap-3 no-select"
          aria-label="Invite a friend"
        >
          <div className="w-9 h-9 rounded-full bg-rose-500/15 flex items-center justify-center shrink-0">
            <UserPlus className="w-4 h-4 text-rose-600" />
          </div>
          <div className="flex-1 text-left">
            <div className="text-sm font-semibold text-foreground">Invite a friend</div>
            <div className="text-xs text-muted-foreground">Invite a friend to roll with us</div>
          </div>
        </button>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-rose-500/15 flex items-center justify-center shrink-0">
              <UserPlus className="w-4 h-4 text-rose-600" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-foreground">Invite a friend</div>
              <div className="text-xs text-muted-foreground">We'll email them the class schedule</div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-foreground/5 no-select"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-2">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="friend@email.com"
              className="flex-1 min-w-0 text-sm text-foreground bg-foreground/5 rounded-xl px-3 py-2 outline-none"
              onKeyDown={(e) => { if (e.key === "Enter") send(); }}
            />
            <button
              onClick={send}
              className="w-10 h-10 shrink-0 rounded-xl bg-rose-600 text-white flex items-center justify-center no-select"
              aria-label="Send invite"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}