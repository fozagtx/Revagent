import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "ghost" | "white" | "danger" | "subtle";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      iconLeft,
      iconRight,
      children,
      ...props
    },
    ref,
  ) => {
    const variants: Record<Variant, string> = {
      primary: "btn-cta text-white border border-white/20",
      white: "bg-white border-2 border-white text-blue-700 hover:bg-blue-100",
      ghost:
        "bg-white text-blue-700 border border-[rgba(0,37,97,0.06)] hover:bg-blue-100/40",
      subtle:
        "bg-transparent text-neutral-700 hover:bg-blue-700/10 hover:text-navy",
      danger: "bg-red-600 text-white border border-white/20 hover:bg-red-500",
    };

    const sizes: Record<Size, string> = {
      sm: "h-9 px-4 text-xs gap-1.5",
      md: "h-11 px-6 text-sm gap-2",
      lg: "h-12 px-7 text-base gap-2",
    };

    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        className={cn(
          "inline-flex items-center justify-center rounded-2xl font-semibold tracking-ui",
          "transition duration-charms ease-charms",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "select-none whitespace-nowrap",
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      >
        {loading ? (
          <Spinner />
        ) : iconLeft ? (
          <span className="shrink-0 [&_svg]:w-4 [&_svg]:h-4" aria-hidden="true">
            {iconLeft}
          </span>
        ) : null}
        {children}
        {!loading && iconRight && (
          <span className="shrink-0 [&_svg]:w-4 [&_svg]:h-4" aria-hidden="true">
            {iconRight}
          </span>
        )}
      </button>
    );
  },
);
Button.displayName = "Button";

function Spinner() {
  return (
    <svg
      className="animate-spin shrink-0"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="3"
      />
      <path
        d="M21 12a9 9 0 0 1-9 9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
