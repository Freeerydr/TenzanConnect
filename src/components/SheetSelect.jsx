import React, { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { Check, ChevronDown } from "lucide-react";

export default function SheetSelect({ value, onChange, options, placeholder, triggerClassName }) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  if (!isMobile) {
    return (
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className={triggerClassName}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn("flex items-center justify-between gap-2 text-left", triggerClassName)}
      >
        <span className={cn("truncate", !selected && "text-muted-foreground")}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown className="w-4 h-4 opacity-50 shrink-0" />
      </button>
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="max-h-[80vh]">
          <DrawerHeader className="pb-2">
            <DrawerTitle>{placeholder || "Select"}</DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto px-3" style={{ paddingBottom: "calc(var(--safe-bottom) + 1rem)" }}>
            {options.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className={cn(
                  "w-full flex items-center justify-between gap-3 px-3 py-3 rounded-xl text-sm text-left no-select",
                  o.value === value ? "bg-foreground/5" : "hover:bg-foreground/5"
                )}
              >
                <span className="text-foreground">{o.label}</span>
                {o.value === value && <Check className="w-4 h-4 text-rose-600 shrink-0" />}
              </button>
            ))}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}