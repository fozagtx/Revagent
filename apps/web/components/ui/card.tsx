import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "neu" | "white" | "hero" | "outline";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: Variant;
  padded?: boolean;
}

export function Card({
  className,
  variant = "neu",
  padded = true,
  ...props
}: CardProps) {
  const base: Record<Variant, string> = {
    neu: "neu border border-[rgba(189,215,255,0.4)] rounded-2xl",
    white: "frosted rounded-2xl",
    hero: "rounded-hero overflow-hidden bg-white shadow-neu-card border border-[rgba(189,215,255,0.4)]",
    outline: "bg-white/60 backdrop-blur-sm border border-[rgba(189,215,255,0.5)] rounded-2xl",
  };

  return (
    <div
      className={cn(base[variant], padded && variant !== "hero" && "p-5", className)}
      {...props}
    />
  );
}

export function CardTitle({
  className,
  as: As = "h2",
  ...props
}: React.HTMLAttributes<HTMLHeadingElement> & { as?: "h1" | "h2" | "h3" | "h4" }) {
  return (
    <As
      className={cn(
        "text-lg font-semibold tracking-ui text-navy leading-snug",
        className,
      )}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-sm tracking-ui text-neutral-600 leading-relaxed", className)}
      {...props}
    />
  );
}

export function CardEyebrow({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        "font-mono text-[11px] uppercase tracking-wider text-blue-700",
        className,
      )}
      {...props}
    />
  );
}
