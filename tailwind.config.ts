import type { Config } from "tailwindcss";

// Palette derived from the ConverSight brand chips.
// - brand (greens) for primary surfaces, success, CTAs
// - ink (neutrals) for backgrounds, borders, body text
// - sky / amber / violet for category accents and badges
const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary green
        brand: {
          50:  "#E6FBEE",
          100: "#C0F4D4",
          200: "#86E7AA",
          300: "#3FDB7C",
          400: "#00DA49", // primary action
          500: "#00C246", // hover
          600: "#0B9F40", // active / shadow tint
          700: "#077A33",
          800: "#055624",
          900: "#004438", // deepest green, near-black with tint
        },
        // Neutrals — slate replacement
        ink: {
          50:  "#F9F9F9",
          100: "#E4E6E6",
          200: "#C8CCCB",
          300: "#9CA39F",
          400: "#6F7672",
          500: "#494E4B",
          600: "#2F3431",
          700: "#23282B", // border
          800: "#1B1F1D", // surface
          900: "#171B18", // bg
          950: "#0F1311", // deep bg
        },
        accent: {
          blue:   "#00C1FA",
          azure:  "#0061FF",
          navy:   "#0A429C",
          amber:  "#FFC700",
          orange: "#FF6F14",
          rust:   "#D0570A",
          violet: "#7E18FF",
          indigo: "#4900C8",
          plum:   "#12016F",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(0, 218, 73, 0.35), 0 8px 30px -8px rgba(0, 218, 73, 0.35)",
        "brand-soft": "0 12px 32px -12px rgba(0, 218, 73, 0.30)",
      },
    },
  },
  plugins: [],
};

export default config;
