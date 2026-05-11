import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#002259",
          300: "#777F8B",
          400: "#8F9FB8",
          900: "#002259",
        },
        blue: {
          100: "#E9F3FF",
          150: "#D7E7FE",
          200: "#D3E8FF",
          300: "#BDD7FF",
          500: "#79ADF8",
          600: "#155DFC",
          700: "#2670DC",
          900: "#0042AB",
        },
        neutral: {
          50: "#F7F7F9",
          100: "#FFFFFF",
          200: "#F4F9FF",
          300: "#E0E8F2",
          400: "#D1D9E6",
          500: "#8F9FB8",
          550: "#798AA6",
          600: "#777F8B",
          700: "#5F6B7C",
          800: "#3F4A61",
          900: "#002259",
        },
        skeleton: {
          DEFAULT: "#EFF4F9",
          dark: "#E5ECF3",
        },
        toolbar: "#CBE2FC",
        success: "#0DDE53",
        error: "#EF4444",
      },
      backgroundImage: {
        sky: "linear-gradient(rgb(189,215,255) 0%, rgb(255,255,255) 39.45%)",
        cta: "linear-gradient(rgb(0,68,185) 5.5%, rgb(0,116,236) 35%, rgb(78,177,255) 65%, rgb(173,217,255) 95%)",
        orb: "radial-gradient(circle, rgba(121,173,248,0.22) 0%, rgba(189,215,255,0.14) 50%, rgba(255,255,255,0) 80%)",
      },
      boxShadow: {
        "neu-card": "rgba(255,255,255,0.75) -4px -4px 6px 0px inset, rgba(255,255,255,0.75) 4px 4px 6px 0px inset",
        "neu-search": "rgba(235,243,255,0.75) -2px -2px 4px 0px inset, rgba(235,243,255,0.75) 2px 2px 4px 0px inset",
      },
      borderRadius: {
        xs: "0.125rem",
        sm: "0.25rem",
        md: "0.375rem",
        lg: "0.5rem",
        xl: "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
        hero: "32px",
      },
      letterSpacing: {
        ui: "-0.5px",
        tight: "-0.025em",
        wide: "0.025em",
        wider: "0.05em",
      },
      transitionTimingFunction: {
        charms: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
      transitionDuration: {
        charms: "150ms",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui"],
        serif: ["var(--font-serif)", "ui-serif", "Georgia"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular"],
      },
    },
  },
  plugins: [],
} satisfies Config;
