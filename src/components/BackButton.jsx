import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * iOS WebView-safe back button.
 * Pops history with navigate(-1) when there is a previous entry,
 * otherwise falls back to the provided static route.
 */
export default function BackButton({ to = "/", label, className, ...props }) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(to);
    }
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className={cn(
        "inline-flex items-center gap-1.5 min-h-[44px] -ml-1.5 px-1.5 text-sm text-muted-foreground hover:text-foreground active:text-foreground no-select",
        className
      )}
      {...props}
    >
      <ArrowLeft className="w-5 h-5" />
      {label}
    </button>
  );
}