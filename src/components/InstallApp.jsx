import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Smartphone, Share, PlusSquare, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

function isStandalone() {
  return (
    (typeof window !== "undefined" && window.matchMedia?.("(display-mode: standalone)").matches) ||
    (typeof navigator !== "undefined" && navigator.standalone === true)
  );
}

function isIOS() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /iphone|ipad|ipod/i.test(ua) && !(window.MSStream && true);
}

export default function InstallApp() {
  const { toast } = useToast();
  const [deferred, setDeferred] = useState(null);
  const [showIOS, setShowIOS] = useState(false);
  const [installed, setInstalled] = useState(isStandalone());

  useEffect(() => {
    const onBIP = (e) => {
      e.preventDefault();
      setDeferred(e);
    };
    const onInstalled = () => {
      setDeferred(null);
      setInstalled(true);
      toast({ title: "Tenzan Connect installed" });
    };
    window.addEventListener("beforeinstallprompt", onBIP);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBIP);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [toast]);

  const onClick = async () => {
    if (deferred) {
      deferred.prompt();
      try {
        const { outcome } = await deferred.userChoice;
        if (outcome === "accepted") setInstalled(true);
      } catch {}
      setDeferred(null);
      return;
    }
    if (isIOS()) {
      setShowIOS(true);
      return;
    }
    toast({ title: "Add to Home Screen", description: "Open your browser menu → Add to Home Screen." });
  };

  if (installed) return null;

  return (
    <>
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between p-3 rounded-2xl bg-foreground/5 hover:bg-foreground/10 transition-colors no-select"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-blue-500/15 flex items-center justify-center">
            <Smartphone className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-left">
            <div className="text-sm font-medium text-foreground">Install app</div>
            <div className="text-[11px] text-muted-foreground">Add Tenzan Connect to your home screen</div>
          </div>
        </div>
        <PlusSquare className="w-4 h-4 text-muted-foreground" />
      </button>

      <AnimatePresence>
        {showIOS && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowIOS(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative glass-card p-5 max-w-xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Add to Home Screen</h3>
                <button onClick={() => setShowIOS(false)} className="w-9 h-9 rounded-full bg-foreground/5 flex items-center justify-center no-select">
                  <X className="w-4 h-4 text-foreground" />
                </button>
              </div>
              <ol className="space-y-2.5 text-xs text-foreground leading-relaxed">
                <li className="flex gap-2">
                  <span className="font-semibold text-rose-600">1.</span>
                  <span>Tap the <Share className="inline w-3.5 h-3.5 text-blue-600 align-text-bottom" /> <b>Share</b> button in Safari's toolbar.</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-rose-600">2.</span>
                  <span>Scroll down and tap <b>Add to Home Screen</b>.</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-rose-600">3.</span>
                  <span>Tap <b>Add</b> — Tenzan Connect launches like a native app.</span>
                </li>
              </ol>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}