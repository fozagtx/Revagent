import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "neu" | "white" | "hero";

export function Card({
  className,
  variant = "neu",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { variant?: Variant }) {
  const base = {
    neu: "neu border border-[rgba(189,215,255,0.4)] rounded-2xl p-5",
    white: "frosted rounded-2xl p-5",
    hero: "rounded-hero overflow-hidden bg-white shadow-neu-card border border-[rgba(189,215,255,0.4)]",
  }[variant];

  return <div className={cn(base, className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn("text-lg font-semibold tracking-ui text-navy", className)}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-sm tracking-ui text-neutral-600", className)}
      {...props}
    />
  );
}
