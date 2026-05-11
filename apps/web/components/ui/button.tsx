import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "ghost" | "white" | "danger";

export const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }
>(({ className, variant = "primary", ...props }, ref) => {
  const styles = {
    // Gradient CTA — Sign-up style from the Charms system.
    primary:
      "btn-cta text-white border border-white/20",
    // White card on top of an image / colored background.
    white:
      "bg-white border-2 border-white text-blue-700 hover:bg-blue-100",
    // Soft outline used in form/secondary surfaces.
    ghost:
      "bg-white text-blue-700 border border-[rgba(0,37,97,0.06)] hover:bg-blue-100/40",
    danger:
      "bg-red-600 text-white border border-white/20 hover:bg-red-500",
  }[variant];

  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-2xl h-11 px-6",
        "text-sm font-semibold tracking-ui",
        "transition duration-charms ease-charms",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        styles,
        className,
      )}
      {...props}
    />
  );
});
Button.displayName = "Button";
