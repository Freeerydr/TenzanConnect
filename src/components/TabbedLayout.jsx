import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import GlassNav from "@/components/GlassNav";
import Home from "@/pages/Home";
import Journal from "@/pages/Journal";
import Messages from "@/pages/Messages";
import Onboarding from "@/components/Onboarding";
import { randomSplit } from "@/lib/splitTransition";

const TAB_ROOTS = ["/", "/journal", "/messages"];

// Which tab a path belongs to — sub-pages stay attached to their parent tab
// so the keep-alive panel underneath is the one revealed when the split clears.
function tabForPath(path) {
  if (path === "/messages" || path.startsWith("/messages/")) return "messages";
  if (path === "/journal" || path.startsWith("/journal/")) return "journal";
  return "feed";
}

const TAB_GRADIENTS = {
  feed: "bg-gradient-to-b from-rose-50 via-white to-slate-100",
  journal: "bg-gradient-to-b from-violet-50 via-white to-slate-100",
  messages: "bg-gradient-to-b from-sky-50 via-white to-slate-100",
};

const SPLIT_TRANSITION = { duration: 0.54, ease: [0.4, 0, 0.2, 1] };

export default function TabbedLayout() {
  const location = useLocation();
  const path = location.pathname;
  const isTabRoot = TAB_ROOTS.includes(path);
  const activeTab = tabForPath(path);
  const [visited, setVisited] = useState({ journal: false, messages: false });
  const feedRef = useRef(null);
  const journalRef = useRef(null);
  const messagesRef = useRef(null);
  const prevPath = useRef(path);
  // split = { token, gradient } — two themed panels that recede along the diagonal.
  const [split, setSplit] = useState(null);

  useEffect(() => {
    if (path === "/journal") setVisited((v) => (v.journal ? v : { ...v, journal: true }));
    else if (path === "/messages") setVisited((v) => (v.messages ? v : { ...v, messages: true }));
  }, [path]);

  // Re-selecting the active tab scrolls its panel back to the top.
  useEffect(() => {
    const onScrollTop = (e) => {
      const tab = e.detail?.tab;
      const ref = tab === "journal" ? journalRef : tab === "messages" ? messagesRef : feedRef;
      ref.current?.scrollTo({ top: 0, behavior: "smooth" });
    };
    window.addEventListener("tenzan:scrollTabTop", onScrollTop);
    return () => window.removeEventListener("tenzan:scrollTabTop", onScrollTop);
  }, []);

  // On every navigation, fire the diagonal split — themed to the outgoing view
  // so the surface reads as the page itself parting along the slash.
  useLayoutEffect(() => {
    if (prevPath.current === path) return;
    const oldPath = prevPath.current;
    prevPath.current = path;
    const gradient = TAB_ROOTS.includes(oldPath) ? TAB_GRADIENTS[tabForPath(oldPath)] : "bg-background";
    setSplit({ token: Date.now() + Math.random(), gradient, ...randomSplit() });
  }, [path]);

  return (
    <div className="relative h-screen">
      <Onboarding />
      <GlassNav />
      <div
        ref={feedRef}
        className={cn(
          "h-screen overflow-y-auto overscroll-y-contain",
          TAB_GRADIENTS.feed,
          activeTab === "feed" ? "block" : "hidden"
        )}
      >
        <Home />
      </div>
      {visited.journal && (
        <div
          ref={journalRef}
          className={cn(
            "h-screen overflow-y-auto overscroll-y-contain",
            TAB_GRADIENTS.journal,
            activeTab === "journal" ? "block" : "hidden"
          )}
        >
          <Journal />
        </div>
      )}
      {visited.messages && (
        <div
          ref={messagesRef}
          className={cn(
            "h-screen overflow-y-auto overscroll-y-contain",
            TAB_GRADIENTS.messages,
            activeTab === "messages" ? "block" : "hidden"
          )}
        >
          <Messages />
        </div>
      )}

      {/* Sub-pages render underneath the split overlay. */}
      {!isTabRoot && (
        <div className="absolute inset-0 z-30 overflow-y-auto overscroll-y-contain">
          <Outlet />
        </div>
      )}

      {/* Diagonal split overlay — two themed halves recede apart, revealing the next page. */}
      {split && (
        <div key={split.token} className="fixed inset-0 z-40 overflow-hidden pointer-events-none">
          <motion.div
            className={cn("absolute inset-0", split.gradient)}
            style={{ clipPath: split.topClip, willChange: "transform" }}
            initial={{ x: 0, y: 0 }}
            animate={{ x: split.topX, y: split.topY }}
            transition={SPLIT_TRANSITION}
            onAnimationComplete={() => setSplit(null)}
          />
          <motion.div
            className={cn("absolute inset-0", split.gradient)}
            style={{ clipPath: split.bottomClip, willChange: "transform" }}
            initial={{ x: 0, y: 0 }}
            animate={{ x: split.bottomX, y: split.bottomY }}
            transition={SPLIT_TRANSITION}
          />
        </div>
      )}
    </div>
  );
}