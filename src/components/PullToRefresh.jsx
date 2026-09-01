import React, { useState, useRef } from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

// Walk up the DOM to find the nearest scrollable ancestor so this works
// whether the page scrolls the window or a per-tab scroll container.
function findScrollable(el) {
  let node = el?.parentElement;
  while (node) {
    const style = window.getComputedStyle(node);
    if (/(auto|scroll)/.test(style.overflowY)) return node;
    node = node.parentElement;
  }
  return null;
}

export default function PullToRefresh({ onRefresh, children }) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);
  const scrollEl = useRef(null);
  const containerRef = useRef(null);
  const THRESHOLD = 70;

  const resolveScrollEl = () => {
    if (!scrollEl.current && containerRef.current) {
      scrollEl.current =
        findScrollable(containerRef.current) ||
        document.scrollingElement ||
        document.documentElement;
    }
    return scrollEl.current;
  };

  const onTouchStart = (e) => {
    const el = resolveScrollEl();
    const atTop = (el?.scrollTop ?? window.scrollY) <= 0;
    if (atTop && !refreshing) {
      startY.current = e.touches[0].clientY;
      pulling.current = true;
    } else {
      pulling.current = false;
    }
  };

  const onTouchMove = (e) => {
    if (!pulling.current || refreshing) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0) {
      setPull(Math.min(delta * 0.5, 100));
    }
  };

  const onTouchEnd = async () => {
    if (!pulling.current) return;
    pulling.current = false;
    if (pull >= THRESHOLD) {
      setRefreshing(true);
      setPull(40);
      try {
        await onRefresh?.();
      } finally {
        setRefreshing(false);
        setPull(0);
      }
    } else {
      setPull(0);
    }
  };

  const progress = Math.min(pull / THRESHOLD, 1);

  return (
    <div ref={containerRef} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      <div
        className="flex items-center justify-center overflow-hidden transition-[height] duration-200"
        style={{ height: pull, opacity: pull > 0 || refreshing ? 1 : 0 }}
      >
        <RefreshCw
          className={cn("w-5 h-5 text-muted-foreground", refreshing && "animate-spin")}
          style={{ transform: `rotate(${progress * 360}deg)` }}
        />
      </div>
      {children}
    </div>
  );
}