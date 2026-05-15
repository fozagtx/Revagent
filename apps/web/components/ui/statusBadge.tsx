import * as React from "react";
import { cn } from "@/lib/utils";

export type StatusTone =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "error"
  | "pending";

interface StatusBadgeProps {
  tone?: StatusTone;
  pulse?: boolean;
  className?: string;
  children: React.ReactNode;
}

const TONES: Record<StatusTone, { bg: string; text: string; dot: string }> = {
  neutral: { bg: "bg-white", text: "text-neutral-600", dot: "bg-neutral-400" },
  info: { bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-600" },
  success: { bg: "bg-success/12", text: "text-success", dot: "bg-success" },
  warning: { bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-700" },
  error: { bg: "bg-error/12", text: "text-error", dot: "bg-error" },
  pending: { bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-600" },
};

export function StatusBadge({
  tone = "neutral",
  pulse = false,
  className,
  children,
}: StatusBadgeProps) {
  const t = TONES[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold tracking-ui",
        t.bg,
        t.text,
        className,
      )}
    >
      <span
        className={cn(
          "w-1.5 h-1.5 rounded-full",
          t.dot,
          pulse && "pulse-dot",
        )}
        aria-hidden="true"
      />
      {children}
    </span>
  );
}
