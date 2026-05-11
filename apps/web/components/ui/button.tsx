import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "ghost" | "danger";

export const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }
>(({ className, variant = "primary", ...props }, ref) => {
  const styles = {
    primary: "bg-brand-accent text-brand-ink hover:bg-cyan-300",
    ghost: "bg-transparent border border-slate-600 text-slate-100 hover:bg-slate-800",
    danger: "bg-brand-danger text-white hover:bg-red-500",
  }[variant];
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed",
        styles,
        className,
      )}
      {...props}
    />
  );
});
Button.displayName = "Button";
