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
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          light: "var(--primary-light)",
          glow: "#f97316",
        },
        accent: {
          DEFAULT: "#23c9ff",
          dark: "#1ab3e8",
        },
        card: {
          DEFAULT: "var(--card)",
          border: "var(--card-border)",
        },
        risk: {
          low: "#22c55e",
          medium: "#eab308",
          high: "#f97316",
          critical: "#ef4444",
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
            filter: "drop-shadow(0 0 8px #f97316)",
          },
          "50%": {
            opacity: "0.8",
            filter: "drop-shadow(0 0 20px #f97316)",
          },
        },
        "glow-pulse-accent": {
          "0%, 100%": {
            opacity: "1",
            filter: "drop-shadow(0 0 8px #23c9ff)",
          },
          "50%": {
            opacity: "0.8",
            filter: "drop-shadow(0 0 20px #23c9ff)",
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

