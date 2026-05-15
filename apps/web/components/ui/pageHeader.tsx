import * as React from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn("rise-in", className)}>
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1">
          {eyebrow && (
            <p className="font-mono text-[11px] uppercase tracking-wider text-blue-700">
              {eyebrow}
            </p>
          )}
          <h1 className="mt-1 font-serif text-2xl sm:text-3xl md:text-4xl text-navy tracking-tight leading-[1.1] break-words">
            {title}
          </h1>
          {description && (
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-neutral-700">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        )}
      </div>
    </header>
  );
}
