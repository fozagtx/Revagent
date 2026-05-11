import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          ink: "#0b1220",
          slate: "#1f3a5f",
          accent: "#22d3ee",
          warn: "#f59e0b",
          ok: "#22c55e",
          danger: "#ef4444",
        },
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica Neue", "Arial"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "Liberation Mono"],
      },
    },
  },
  plugins: [],
} satisfies Config;
