import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { X, Loader2, AlertTriangle, Bell, BellRing, Shield, LogOut, ChevronRight, Sparkles, BookOpen, Mail, Moon, Trash2 } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import InstallApp from "@/components/InstallApp";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function SettingsSheet({ open, onClose }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [push, setPush] = useState(() => typeof window !== "undefined" && localStorage.getItem("tenzan_push") === "on" && "Notification" in window && Notification.permission === "granted");
  const [beginner, setBeginner] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const [dark, setDark] = useState(false);
  const [me, setMe] = useState(null);
  const [demoting, setDemoting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    base44.auth.me().then((u) => { setBeginner(!!u?.beginner_mode); setMe(u); }).catch(() => {});
  }, []);

  useEffect(() => { setDark(resolvedTheme === "dark"); }, [resolvedTheme]);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    setTheme(next ? "dark" : "light");
  };

  const demoteSelf = async () => {
    setBusy(true);
    try {
      await base44.entities.User.update(me.id, { role: "user" });
      await base44.auth.logout();
      window.location.href = "/login";
    } catch (e) {
      toast({ title: "Could not remove admin access", description: e?.message || "Try again", variant: "destructive" });
      setBusy(false);
      setDemoting(false);
    }
  };

  const deleteAccount = async () => {
    setBusy(true);
    try {
      await base44.entities.User.delete(me.id);
      await base44.auth.logout();
      window.location.href = "/login";
    } catch (e) {
      toast({ title: "Could not delete account", description: e?.message || "Try again", variant: "destructive" });
      setBusy(false);
      setDeleting(false);
    }
  };

  const toggleBeginner = async () => {
    const next = !beginner;
    setBeginner(next);
    try {
      await base44.auth.updateMe({ beginner_mode: next });
    } catch {
      setBeginner(!next);
      toast({ title: "Could not update preference", variant: "destructive" });
    }
  };

  const doLogout = async () => {
    await base44.auth.logout();
    window.location.href = "/login";
  };

  const togglePush = async () => {
    if (!push) {
      if (typeof window === "undefined" || !("Notification" in window)) {
        toast({ title: "Push not supported on this device", variant: "destructive" });
        return;
      }
      const perm = await Notification.requestPermission();
      if (perm === "granted") {
        localStorage.setItem("tenzan_push", "on");
        setPush(true);
        toast({ title: "Push notifications enabled" });
      } else {
        toast({ title: "Permission denied", variant: "destructive" });
      }
    } else {
      localStorage.setItem("tenzan_push", "off");
      setPush(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
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
              <h2 className="text-base font-semibold text-foreground">Settings</h2>
              <button
                onClick={onClose}
                className="w-11 h-11 rounded-full flex items-center justify-center bg-foreground/5 no-select"
              >
                <X className="w-4 h-4 text-foreground" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-foreground/5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-rose-500/15 flex items-center justify-center">
                    <Bell className="w-4 h-4 text-rose-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">Notifications</div>
                    <div className="text-[11px] text-muted-foreground">New posts & replies</div>
                  </div>
                </div>
                <button
                  onClick={() => setNotifications(!notifications)}
                  className={cn(
                    "w-11 h-6 rounded-full transition-colors relative no-select",
                    notifications ? "bg-rose-500" : "bg-foreground/20"
                  )}
                >
                  <span className={cn("absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all", notifications ? "left-[1.375rem]" : "left-0.5")} />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-foreground/5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-violet-500/15 flex items-center justify-center">
                    <BellRing className="w-4 h-4 text-violet-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">Push notifications</div>
                    <div className="text-[11px] text-muted-foreground">Announcements & messages on your device</div>
                  </div>
                </div>
                <button
                  onClick={togglePush}
                  className={cn(
                    "w-11 h-6 rounded-full transition-colors relative no-select",
                    push ? "bg-violet-500" : "bg-foreground/20"
                  )}
                >
                  <span className={cn("absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all", push ? "left-[1.375rem]" : "left-0.5")} />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-foreground/5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-emerald-500/15 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">Beginner mode</div>
                    <div className="text-[11px] text-muted-foreground">Show guides, Q&A, and admin help</div>
                  </div>
                </div>
                <button
                  onClick={toggleBeginner}
                  className={cn(
                    "w-11 h-6 rounded-full transition-colors relative no-select",
                    beginner ? "bg-emerald-500" : "bg-foreground/20"
                  )}
                >
                  <span className={cn("absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all", beginner ? "left-[1.375rem]" : "left-0.5")} />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-foreground/5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-slate-500/15 flex items-center justify-center">
                    <Moon className="w-4 h-4 text-slate-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">Dark mode</div>
                    <div className="text-[11px] text-muted-foreground">Switch between light and dark theme</div>
                  </div>
                </div>
                <button
                  onClick={toggleDark}
                  className={cn(
                    "w-11 h-6 rounded-full transition-colors relative no-select",
                    dark ? "bg-slate-700" : "bg-foreground/20"
                  )}
                >
                  <span className={cn("absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all", dark ? "left-[1.375rem]" : "left-0.5")} />
                </button>
              </div>

              <InstallApp />

              <button
                onClick={doLogout}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-foreground/5 hover:bg-foreground/10 transition-colors no-select"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-sky-500/15 flex items-center justify-center">
                    <LogOut className="w-4 h-4 text-sky-600" />
                  </div>
                  <div className="text-sm font-medium text-foreground text-left">Log out</div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>

              <button
                onClick={() => setDeleting(true)}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 transition-colors no-select"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-rose-500/15 flex items-center justify-center">
                    <Trash2 className="w-4 h-4 text-rose-600" />
                  </div>
                  <div className="text-sm font-medium text-rose-600 text-left">Delete account</div>
                </div>
                <ChevronRight className="w-4 h-4 text-rose-400" />
              </button>
            </div>

            {beginner && (
              <div className="space-y-2">
                <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide px-1">Beginner resources</div>
                <button
                  onClick={() => navigate("/beginner/etiquette")}
                  className="w-full flex items-center justify-between p-3 rounded-2xl bg-foreground/5 hover:bg-foreground/10 transition-colors no-select"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-emerald-500/15 flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium text-foreground">Etiquette guide</div>
                      <div className="text-[11px] text-muted-foreground">How to show up on the mats</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
                <button
                  onClick={() => navigate("/beginner/message-admin")}
                  className="w-full flex items-center justify-between p-3 rounded-2xl bg-foreground/5 hover:bg-foreground/10 transition-colors no-select"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-rose-500/15 flex items-center justify-center">
                      <Mail className="w-4 h-4 text-rose-600" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium text-foreground">Message admin</div>
                      <div className="text-[11px] text-muted-foreground">Ask Professor Keith or the team</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            )}

            <div className="pt-2 border-t border-foreground/10 space-y-2">
              {me?.role === "admin" && (
                !demoting ? (
                  <button
                    onClick={() => setDemoting(true)}
                    className="w-full flex items-center justify-between p-3 rounded-2xl bg-amber-50 hover:bg-amber-100 transition-colors no-select"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-amber-500/15 flex items-center justify-center">
                        <Shield className="w-4 h-4 text-amber-600" />
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-medium text-amber-700">Turn off admin</div>
                        <div className="text-[11px] text-amber-600/80">Remove your admin access (failsafe)</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-amber-400" />
                  </button>
                ) : (
                  <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 space-y-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                      <p className="text-xs text-amber-700 leading-relaxed">
                        This removes your admin access immediately and logs you out. You'll need another admin to restore it.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setDemoting(false)}
                        disabled={busy}
                        className="flex-1 py-2.5 rounded-xl bg-white text-xs font-medium text-foreground border border-foreground/10 no-select"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={demoteSelf}
                        disabled={busy}
                        className="flex-1 py-2.5 rounded-xl bg-amber-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50 no-select"
                      >
                        {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
                        {busy ? "Removing…" : "Confirm"}
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>

            <p className="text-[10px] text-center text-muted-foreground/70 flex items-center justify-center gap-1">
              <Shield className="w-3 h-3" /> Tenzan BJJ · Seattle, WA
            </p>

            <AlertDialog open={deleting} onOpenChange={setDeleting}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-rose-600">Delete account?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This permanently deletes your profile and signs you out. Your posts and journal entries remain but become inaccessible. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
                  <button
                    onClick={deleteAccount}
                    disabled={busy}
                    className="inline-flex items-center justify-center gap-1.5 rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50 no-select"
                  >
                    {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete forever"}
                  </button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}