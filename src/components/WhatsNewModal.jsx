import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Sparkles, Shield, X } from "lucide-react";
import { APP_VERSION, CHANGELOG } from "@/lib/changelog";

const SEEN_KEY = "tenzan_whats_new_seen_version";

export default function WhatsNewModal() {
  const [open, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let seen = null;
      try { seen = localStorage.getItem(SEEN_KEY); } catch {}
      if (seen === APP_VERSION) return; // already shown on this device

      try {
        const me = await base44.auth.me();
        if (cancelled) return;
        setIsAdmin(me?.role === "admin");
        setOpen(true);
      } catch {
        // Not logged in (e.g. still on the login screen) — don't show yet;
        // it'll show right after they land on an authenticated page instead.
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const dismiss = () => {
    try { localStorage.setItem(SEEN_KEY, APP_VERSION); } catch {}
    setOpen(false);
  };

  const latest = CHANGELOG[0];
  if (!latest) return null;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={dismiss}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: "100%", opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0.5 }}
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
            className="relative w-full sm:max-w-md glass-card rounded-b-none sm:rounded-3xl p-5 space-y-4"
            style={{ paddingBottom: "calc(var(--safe-bottom) + 1.25rem)" }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-rose-500/15 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-rose-600" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-foreground">What's new</h2>
                  <div className="text-[11px] text-muted-foreground">{latest.date}</div>
                </div>
              </div>
              <button
                onClick={dismiss}
                className="w-11 h-11 rounded-full flex items-center justify-center bg-foreground/5 no-select"
                aria-label="Close"
              >
                <X className="w-4 h-4 text-foreground" />
              </button>
            </div>

            {latest.forEveryone?.length > 0 && (
              <ul className="space-y-2">
                {latest.forEveryone.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}

            {isAdmin && latest.forAdmins?.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-foreground/10">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-amber-700 uppercase tracking-wide">
                  <Shield className="w-3.5 h-3.5" /> For admins
                </div>
                <ul className="space-y-2">
                  {latest.forAdmins.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button
              onClick={dismiss}
              className="w-full py-2.5 rounded-xl bg-rose-600 text-white text-sm font-medium no-select"
            >
              Got it
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
