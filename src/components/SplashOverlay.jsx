import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Image } from "@/components/ui/image";

const LOGO_URL = "https://media.base44.com/images/public/6a8519af96596fe0e3c1a6eb/721f4b13b_TENZAN_JJ_LOGO_FULL_BLUE_AND_WHITE-12.png";

/**
 * Full-screen branded splash shown while the app boots.
 * Once `loading` becomes false, the screen splits along a diagonal
 * and the two halves recede apart to reveal the app underneath.
 */
export default function SplashOverlay({ loading, onDone }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (!loading) {
      const t = setTimeout(() => setExiting(true), 360);
      return () => clearTimeout(t);
    }
  }, [loading]);

  const handleAnimComplete = () => {
    if (exiting) onDone?.();
  };

  const Logo = (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
      <div className="w-24 h-24 rounded-3xl overflow-hidden shadow-2xl shadow-rose-500/40">
        <Image
          src={LOGO_URL}
          fittingType="fill"
          className="w-full h-full scale-[1.35]"
        />
      </div>
      <div className="text-center">
        <div className="text-base font-semibold tracking-tight text-foreground">Tenzan BJJ</div>
        <div className="text-[10px] text-muted-foreground tracking-[0.2em] uppercase">Seattle, WA</div>
      </div>
    </div>
  );

  const transition = { duration: 0.78, ease: [0.4, 0, 0.2, 1] };

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden pointer-events-none">
      {/* Upper-left half — recedes up-left */}
      <motion.div
        className="absolute inset-0 bg-background"
        style={{ clipPath: "polygon(0 0, 100% 0, 0 100%)" }}
        initial={{ x: 0, y: 0 }}
        animate={exiting ? { x: "-120%", y: "-120%" } : { x: 0, y: 0 }}
        transition={transition}
        onAnimationComplete={handleAnimComplete}
      >
        {Logo}
      </motion.div>

      {/* Lower-right half — recedes down-right */}
      <motion.div
        className="absolute inset-0 bg-background"
        style={{ clipPath: "polygon(100% 0, 100% 100%, 0 100%)" }}
        initial={{ x: 0, y: 0 }}
        animate={exiting ? { x: "120%", y: "120%" } : { x: 0, y: 0 }}
        transition={transition}
      >
        {Logo}
      </motion.div>
    </div>
  );
}