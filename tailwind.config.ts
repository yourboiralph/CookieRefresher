import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ["JetBrains Mono", "monospace"],
        display: ["Syne", "sans-serif"],
      },
      colors: {
        bg: "#0a0a0f",
        surface: "#111118",
        surface2: "#1a1a24",
        border: "#2a2a3a",
        accent: "#7c6aff",
        accent2: "#ff6a9b",
        accent3: "#6affd4",
        dim: "#6b6b85",
      },
      animation: {
        "fade-down": "fadeDown 0.5s ease both",
        "fade-up": "fadeUp 0.4s ease both",
        pulse2: "pulse2 2s infinite",
      },
      keyframes: {
        fadeDown: {
          from: { opacity: "0", transform: "translateY(-16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        fadeUp: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        pulse2: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.3" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
