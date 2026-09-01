import React, { useState, useRef, useEffect } from "react";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MatTapGame() {
  const [state, setState] = useState("idle");
  const [time, setTime] = useState(null);
  const [best, setBest] = useState(() => {
    const v = Number(localStorage.getItem("tenzan:mattapBest"));
    return Number.isFinite(v) && v > 0 ? v : null;
  });
  const startRef = useRef(0);
  const timerRef = useRef(null);

  const arm = () => {
    setState("waiting");
    setTime(null);
    const delay = 900 + Math.random() * 2400;
    timerRef.current = setTimeout(() => {
      setState("go");
      startRef.current = performance.now();
    }, delay);
  };

  const handle = () => {
    if (state === "waiting") {
      clearTimeout(timerRef.current);
      setState("early");
      return;
    }
    if (state === "go") {
      const ms = Math.round(performance.now() - startRef.current);
      setTime(ms);
      setState("result");
      if (best == null || ms < best) {
        setBest(ms);
        localStorage.setItem("tenzan:mattapBest", String(ms));
      }
      return;
    }
    arm();
  };

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const zone = {
    idle: "bg-foreground/5 text-foreground",
    waiting: "bg-amber-500/15 text-amber-700",
    go: "bg-emerald-500/20 text-emerald-700",
    result: "bg-rose-500/10 text-rose-700",
    early: "bg-rose-500/15 text-rose-700",
  }[state];

  const prompt = {
    idle: "Tap to start",
    waiting: "Wait for it…",
    go: "TAP!",
    result: time != null ? `${time} ms` : "",
    early: "Too soon!",
  }[state];

  return (
    <div className="glass-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-rose-600" />
          <span className="text-sm font-semibold text-foreground">Mat Tap</span>
          <span className="text-[10px] text-muted-foreground">reaction game</span>
        </div>
        {best != null && <span className="text-[11px] text-muted-foreground">Best <span className="font-semibold text-foreground">{best}ms</span></span>}
      </div>
      <button
        onClick={handle}
        className={cn("w-full h-28 rounded-2xl flex flex-col items-center justify-center gap-1 transition-colors no-select", zone)}
      >
        <span className="text-lg font-bold">{prompt}</span>
        {state === "idle" && <span className="text-[11px] opacity-70">Tap when it turns green</span>}
        {(state === "result" || state === "early") && <span className="text-[11px] opacity-80">Tap to try again</span>}
      </button>
    </div>
  );
}