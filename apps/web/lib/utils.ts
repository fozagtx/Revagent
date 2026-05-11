import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

export function demoFounderHeaders(founderId: string): HeadersInit {
  return { "x-founder-id": founderId, "content-type": "application/json" };
}

export const DEMO_FOUNDER_ID = process.env.NEXT_PUBLIC_DEMO_FOUNDER_ID ?? "00000000-0000-0000-0000-000000000000";
