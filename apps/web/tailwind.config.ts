import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ["var(--font-heading)", "system-ui", "sans-serif"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
          light: "var(--primary-light)",
          glow: "#00d4ff",
        },
        accent: {
          DEFAULT: "#00d4ff",
          dark: "#00b4d8",
          glow: "#00ffff",
        },
        card: {
          DEFAULT: "var(--card)",
          border: "var(--card-border)",
        },
        risk: {
          low: "#00D68F",
          medium: "#FBBF24",
          high: "#f97316",
          critical: "#F87171",
        },
      },
      keyframes: {
        wave: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "float-reverse": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(10px)" },
        },
        "glow-pulse": {
          "0%, 100%": {
            opacity: "1",
            filter: "drop-shadow(0 0 8px #00d4ff)",
          },
          "50%": {
            opacity: "0.8",
            filter: "drop-shadow(0 0 20px #00d4ff)",
          },
        },
        "glow-pulse-accent": {
          "0%, 100%": {
            opacity: "1",
            filter: "drop-shadow(0 0 8px #00ffff)",
          },
          "50%": {
            opacity: "0.8",
            filter: "drop-shadow(0 0 20px #00ffff)",
          },
        },
      },
      animation: {
        wave: "wave 3s ease-in-out infinite",
        float: "float 3s ease-in-out infinite",
        "float-reverse": "float-reverse 3s ease-in-out infinite",
        glow: "glow-pulse 3s ease-in-out infinite",
        "glow-accent": "glow-pulse-accent 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;

