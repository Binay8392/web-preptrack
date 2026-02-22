import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
}

export function GlassCard({ children, className }: GlassCardProps) {
  return <section className={cn("glass-card rounded-2xl p-5", className)}>{children}</section>;
}
