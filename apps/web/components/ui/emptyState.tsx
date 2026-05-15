import * as React from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-10 px-6",
        "rounded-2xl border border-dashed border-[rgba(189,215,255,0.7)] bg-white/40",
        className,
      )}
    >
      {icon && (
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700 [&_svg]:h-5 [&_svg]:w-5">
          {icon}
        </div>
      )}
      <p className="font-semibold tracking-ui text-navy">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-neutral-600 leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
