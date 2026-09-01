import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import ProfileForm from "@/components/ProfileForm";
import {
  MessageSquare, BookOpen, MessageCircle, CalendarCheck, Users,
  Shield, Megaphone, ClipboardCheck, CalendarDays, Quote,
  ArrowRight, ArrowLeft, Check, X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const USER_STEPS = [
  { icon: MessageCircle, title: "Welcome to Tenzan Connect", body: "Your team hub for the Tenzan Jiu-Jitsu community. Here's a quick tour of what you can do." },
  { icon: MessageSquare, title: "The Feed", body: "Share updates, roll reports, and questions. Like, reply, and tap any post to open the full thread." },
  { icon: BookOpen, title: "Training Journal", body: "Log sessions and get AI coaching feedback. Track techniques, goals, rolls, injuries, and competitions." },
  { icon: MessageCircle, title: "Messages", body: "DM any teammate — every member is listed, so you can start a chat with anyone on the team." },
  { icon: CalendarCheck, title: "Check in & Events", body: "Tap to check in for practice and track your streak. Browse and RSVP to team events." },
  { icon: Users, title: "Members", body: "View profiles, follow teammates, and update your own bio, belt, and training days anytime." },
];

const ADMIN_STEPS = [
  { icon: Shield, title: "Welcome, Admin", body: "You have the standard member tools plus a few extra powers. Here's the admin tour." },
  { icon: Megaphone, title: "Announcements", body: "Pin announcements to the top of the feed and manage posts across the community." },
  { icon: ClipboardCheck, title: "Attendance", body: "Record who's present, add walk-ins, link them to members, and view weekly trends and participation rates." },
  { icon: CalendarDays, title: "Events", body: "Create events that auto-announce in the feed and manage RSVPs from the team." },
  { icon: Users, title: "Members & Promotions", body: "Invite new members, award belt promotions, and manage admin roles." },
  { icon: Quote, title: "Quote of the Week", body: "Set up to 52 quotes that cycle weekly through the entire year." },
];

export default function Onboarding() {
  const { user: me } = useAuth();
  const [step, setStep] = useState("loading"); // loading | profile | tutorial | done
  const [index, setIndex] = useState(0);
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (!me) return;
    let cancelled = false;
    const seen = localStorage.getItem(`tenzan:tutorialSeen:${me.id}`);
    base44.entities.Profile.filter({ user_id: me.id }, "-created_date", 1)
      .then((list) => {
        if (cancelled) return;
        const hasProfile = list && list.length > 0;
        if (!hasProfile) setStep("profile");
        else if (!seen) setStep("tutorial");
        else setStep("done");
      })
      .catch(() => { if (!cancelled) setStep("done"); });
    return () => { cancelled = true; };
  }, [me]);

  if (!me || step === "done" || step === "loading") return null;

  const saveProfile = async (data) => {
    setSavingProfile(true);
    try {
      await base44.entities.Profile.create({
        user_id: me.id,
        user_name: data.user_name || me.full_name || me.email || "Member",
        bio: data.bio,
        avatar_url: data.avatar_url,
        belt: data.belt,
        stripes: data.stripes,
        training_days: data.training_days,
      });
      setIndex(0);
      setStep("tutorial");
    } catch {
      // ignore — let them retry or skip
    } finally {
      setSavingProfile(false);
    }
  };

  const finishTutorial = () => {
    localStorage.setItem(`tenzan:tutorialSeen:${me.id}`, "1");
    setStep("done");
  };

  const steps = me.role === "admin" ? ADMIN_STEPS : USER_STEPS;
  const s = steps[index];
  const isLast = index === steps.length - 1;
  const Icon = s?.icon;

  return (
    <div className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-md">
        {step === "profile" && (
          <div className="space-y-3">
            <div className="text-center px-1">
              <h2 className="text-xl font-bold text-foreground">Set up your profile</h2>
              <p className="text-sm text-muted-foreground mt-1">
                First time here? Add a name, photo, and belt so teammates recognize you.
              </p>
            </div>
            <ProfileForm
              initial={{ user_name: me.full_name || me.email || "" }}
              onSave={saveProfile}
              onCancel={() => { setIndex(0); setStep("tutorial"); }}
            />
            {savingProfile && (
              <p className="text-center text-xs text-muted-foreground">Saving…</p>
            )}
          </div>
        )}

        {step === "tutorial" && (
          <div className="glass-card p-6 space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-rose-600 uppercase tracking-wide">
                {me.role === "admin" ? "Admin tour" : "Quick tour"} · {index + 1}/{steps.length}
              </span>
              <button onClick={finishTutorial} className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:bg-foreground/5 no-select" aria-label="Skip tour">
                <X className="w-4 h-4" />
              </button>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                <div className="w-14 h-14 rounded-2xl bg-rose-500/15 flex items-center justify-center mx-auto">
                  {Icon && <Icon className="w-7 h-7 text-rose-600" />}
                </div>
                <h3 className="text-lg font-bold text-foreground text-center">{s.title}</h3>
                <p className="text-sm text-muted-foreground text-center leading-relaxed">{s.body}</p>
              </motion.div>
            </AnimatePresence>

            <div className="flex items-center justify-center gap-1.5">
              {steps.map((_, i) => (
                <span
                  key={i}
                  className={cn("h-1.5 rounded-full transition-all", i === index ? "w-6 bg-rose-600" : "w-1.5 bg-foreground/20")}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              {index > 0 ? (
                <button
                  onClick={() => setIndex((i) => i - 1)}
                  className="w-11 h-11 rounded-full glass-card flex items-center justify-center text-foreground no-select shrink-0"
                  aria-label="Back"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={finishTutorial}
                  className="text-xs font-medium text-muted-foreground px-2 no-select"
                >
                  Skip
                </button>
              )}
              <button
                onClick={() => (isLast ? finishTutorial() : setIndex((i) => i + 1))}
                className="flex-1 py-3 rounded-xl bg-rose-600 text-white text-sm font-semibold flex items-center justify-center gap-1.5 no-select"
              >
                {isLast ? (<><Check className="w-4 h-4" /> Get started</>) : (<>Next <ArrowRight className="w-4 h-4" /></>)}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}