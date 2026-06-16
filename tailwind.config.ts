import type { Config } from "tailwindcss";

// Light theme palette — #00C246 brand with supporting greens, neutrals
// from the brand chips, and accent colors for category tags.
const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#E6FBEE",
          100: "#C0F4D4",
          200: "#86E7AA",
          300: "#3FDB7C",
          400: "#00DA49",
          500: "#00C246", // primary
          600: "#0B9F40", // hover / active
          700: "#077A33",
          800: "#055624",
          900: "#004438",
        },
        ink: {
          50:  "#F9F9F9", // page bg
          100: "#E4E6E6", // borders, dividers
          200: "#C8CCCB", // hairline borders, disabled
          300: "#9CA39F", // placeholder, hint text
          400: "#6F7672", // muted text
          500: "#494E4B", // body secondary
          600: "#2F3431", // body primary
          700: "#23282B", // strong text
          800: "#1B1F1D",
          900: "#171B18", // headings
          950: "#0F1311",
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
        soft:   "0 1px 2px rgba(15, 19, 17, 0.04), 0 1px 1px rgba(15, 19, 17, 0.03)",
        card:   "0 1px 3px rgba(15, 19, 17, 0.05), 0 8px 24px -16px rgba(15, 19, 17, 0.08)",
        lift:   "0 4px 12px rgba(15, 19, 17, 0.06), 0 16px 48px -24px rgba(0, 194, 70, 0.18)",
        glow:   "0 0 0 1px rgba(0, 194, 70, 0.35), 0 8px 30px -8px rgba(0, 194, 70, 0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
