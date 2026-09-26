import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Stardew-inspired cozy dark palette: soil browns, warm gold, leaf green
        ink: {
          950: "#161009",
          900: "#1e160d",
          850: "#271d12",
          800: "#322517",
          700: "#41321f",
          600: "#5a4630",
        },
        xp: {
          DEFAULT: "#f2b83b", // stardew gold
          dim: "#b45309",
        },
        gtm: "#5eb8e0", // river sky
        tfe: "#b389e8", // wild plum
        reef: "#7fc860", // meadow leaf
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
        pixel: ["var(--font-pixel)", "monospace"],
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "xp-fill": {
          "0%": { width: "0%" },
          "100%": { width: "var(--xp-target)" },
        },
        "pulse-subtle": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
        "pop-in": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.16s ease-out both",
        "xp-fill": "xp-fill 0.9s cubic-bezier(0.22, 1, 0.36, 1) both",
        "pulse-subtle": "pulse-subtle 2s ease-in-out infinite",
        "pop-in": "pop-in 0.25s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
