"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}

export function Field({
  label,
  hint,
  error,
  required,
  htmlFor,
  className,
  children,
}: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className="text-xs font-semibold tracking-ui text-navy"
      >
        {label}
        {required && <span className="ml-0.5 text-error">*</span>}
      </label>
      {children}
      {error ? (
        <p
          className="text-xs text-error tracking-ui"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-neutral-500 tracking-ui">{hint}</p>
      ) : null}
    </div>
  );
}

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }
>(({ className, invalid, ...props }, ref) => {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        "frosted-input rounded-xl px-3.5 h-11 text-sm tracking-ui text-navy",
        "placeholder:text-neutral-500",
        invalid && "border-error/70 focus:border-error focus:shadow-[0_0_0_3px_rgba(239,68,68,0.18)]",
        className,
      )}
      {...props}
    />
  );
});
Input.displayName = "Input";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => {
  return (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          "frosted-input rounded-xl pl-3.5 pr-9 h-11 text-sm tracking-ui text-navy",
          "appearance-none cursor-pointer w-full",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <svg
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="m6 9 6 6 6-6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
});
Select.displayName = "Select";

interface FileDropProps {
  accept?: string;
  onFile: (file: File) => void;
  disabled?: boolean;
  hint?: string;
  className?: string;
  children?: React.ReactNode;
}

export function FileDrop({
  accept,
  onFile,
  disabled,
  hint,
  className,
  children,
}: FileDropProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [over, setOver] = React.useState(false);

  function trigger() {
    if (!disabled) inputRef.current?.click();
  }

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled || undefined}
      onClick={trigger}
      onKeyDown={(e) => {
        if (disabled) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          trigger();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        if (disabled) return;
        const f = e.dataTransfer.files[0];
        if (f) onFile(f);
      }}
      className={cn(
        "relative cursor-pointer rounded-hero p-6 sm:p-8 md:p-10 text-center",
        "border-2 border-dashed transition-all duration-charms ease-charms",
        over
          ? "border-blue-600 bg-blue-100/60"
          : "border-[rgba(121,173,248,0.45)] bg-white/50 hover:border-blue-500 hover:bg-white/70",
        disabled && "opacity-60 cursor-not-allowed",
        className,
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        disabled={disabled}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
      />
      {children}
      {hint && (
        <p className="mt-3 text-xs text-neutral-500 tracking-ui">{hint}</p>
      )}
    </div>
  );
}
