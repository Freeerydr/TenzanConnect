import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home as HomeIcon, BookOpen, Plus, User, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Image } from "@/components/ui/image";
import SettingsSheet from "@/components/SettingsSheet";

const LOGO_URL = "https://media.base44.com/images/public/6a8519af96596fe0e3c1a6eb/721f4b13b_TENZAN_JJ_LOGO_FULL_BLUE_AND_WHITE-12.png";

const navItems = [
  { to: "/", label: "Feed", icon: HomeIcon, tab: "feed", match: (p) => p === "/" || p.startsWith("/post/") },
  {
    to: "/journal",
    label: "Journal",
    icon: BookOpen,
    tab: "journal",
    match: (p) => p === "/journal" || (p.startsWith("/journal/") && p !== "/journal/new"),
  },
  { to: "/messages", label: "Messages", icon: MessageCircle, tab: "messages", match: (p) => p.startsWith("/messages") },
  { to: "/journal/new", label: "New", icon: Plus, match: (p) => p === "/journal/new" },
];

export default function GlassNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleNav = (item) => {
    // Re-selecting the active tab resets it to its root view (scroll to top).
    if (item.tab && item.to === location.pathname) {
      window.dispatchEvent(new CustomEvent("tenzan:scrollTabTop", { detail: { tab: item.tab } }));
    } else {
      navigate(item.to);
    }
  };

  return (
    <>
      {/* Top bar */}
      <header
        className="fixed top-0 left-0 right-0 z-50 px-3"
        style={{ paddingTop: "calc(var(--safe-top) + 0.75rem)" }}
      >
        <div className="mx-auto max-w-3xl">
          <div className="glass-bar flex items-center justify-between px-4 py-2.5">
            <Link to="/" className="flex items-center group no-select">
              <div className="w-11 h-11 rounded-full overflow-hidden shadow-lg shadow-rose-500/20">
                <Image
                  src={LOGO_URL}
                  fittingType="fill"
                  className="w-full h-full scale-[1.35]"
                />
              </div>
            </Link>

            <nav className="flex items-center gap-1 no-select">
              {navItems.map((item) => {
                const active = item.match(location.pathname);
                const Icon = item.icon;
                return (
                  <button
                    key={item.to}
                    onClick={() => handleNav(item)}
                    className={cn(
                      "flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-full text-[10px] font-medium transition-all",
                      active
                        ? "bg-foreground/10 text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </button>
                );
              })}
            </nav>

            <button
              onClick={() => setSettingsOpen(true)}
              className="w-11 h-11 rounded-full flex items-center justify-center bg-foreground/5 hover:bg-foreground/10 transition-colors no-select"
              aria-label="Account and settings"
            >
              <User className="w-4 h-4 text-foreground" />
            </button>
          </div>
        </div>
      </header>

      <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}