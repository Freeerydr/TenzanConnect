import React from "react";
import { Image } from "@/components/ui/image";

const LOGO_URL = "https://media.base44.com/images/public/6a8519af96596fe0e3c1a6eb/721f4b13b_TENZAN_JJ_LOGO_FULL_BLUE_AND_WHITE-12.png";

export default function AuthLayout({ title, subtitle, footer, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl overflow-hidden shadow-lg shadow-rose-500/20 mb-4">
            <Image src={LOGO_URL} fittingType="fill" className="w-full h-full scale-[1.35]" />
          </div>
          <div className="text-xs font-semibold tracking-[0.2em] text-rose-600 uppercase">Tenzan Connect</div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground mt-2">{title}</h1>
          {subtitle && <p className="text-muted-foreground mt-2">{subtitle}</p>}
        </div>
        <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
          {children}
        </div>
        {footer && (
          <p className="text-center text-sm text-muted-foreground mt-6">{footer}</p>
        )}
      </div>
    </div>
  );
}