import React from "react";
import { CalendarClock } from "lucide-react";

const CLASSES_URL = "https://www.tenzanjiujitsu.com/classes";

export default function PrivateWithKeith() {
  return (
    <div className="glass-card p-3 h-full">
      <a
        href={CLASSES_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full flex items-center gap-3 no-select"
        aria-label="Book a private lesson with Professor Keith"
      >
        <div className="w-9 h-9 rounded-full bg-violet-500/15 flex items-center justify-center shrink-0">
          <CalendarClock className="w-4 h-4 text-violet-600" />
        </div>
        <div className="flex-1 text-left">
          <div className="text-sm font-semibold text-foreground">Private with Keith</div>
          <div className="text-xs text-muted-foreground">View classes & book a private lesson</div>
        </div>
      </a>
    </div>
  );
}
