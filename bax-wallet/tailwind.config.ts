import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        sectionBackground: "#F9F9F9",
        itemBackground: "#F4F4F4",
        background: "var(--background)",
        foreground: "var(--foreground)",
        loadingGradient: "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)",
        brand: {
          light: "#E0F2FE",
          DEFAULT: "#0284C7",
          dark: "#0369A1",
        },
        accent: {
          light: "#FDE68A",
          DEFAULT: "#F59E0B",
          dark: "#B45309",
        },
        gray: {
          50: "#F9FAFB",
          100: "#F3F4F6",
          200: "#E5E7EB",
          300: "#D1D5DB",
          400: "#9CA3AF",
          500: "#6B7280",
          600: "#4B5563",
          700: "#374151",
          800: "#1F2937",
          900: "#111827",
        },
      },
      fontFamily: {
        sans: ["DM Sans", "Inter", "system-ui", "Avenir", "Helvetica", "Arial", "sans-serif"],
        mono: ["Fira Code", "ui-monospace", "SFMono-Regular"],
      },
      borderRadius: {
        xl: "1rem",
        skeleton: "8px",
      },
      boxShadow: {
        DEFAULT: "0 2px 4px rgba(0, 0, 0, 0.1)",
      },
    },
  },
  plugins: [],
} satisfies Config;
