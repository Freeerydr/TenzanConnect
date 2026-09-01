import { cn } from "@/lib/utils";
import { BELT_COLOR, beltLabel } from "@/lib/belts";

export default function BeltBadge({ belt, stripes }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize", BELT_COLOR[belt] || BELT_COLOR.white)}>
      {beltLabel(belt)}
      {stripes > 0 && (
        <span className="flex flex-col gap-0.5">
          {Array.from({ length: stripes }).map((_, i) => (
            <span key={i} className="w-2 h-1 bg-white/90 rounded-full" />
          ))}
        </span>
      )}
    </span>
  );
}