import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#050c1f",
        "ink-soft": "#0b1533",
        "glass-border": "rgba(157, 187, 255, 0.22)",
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 0 rgba(83, 193, 255, 0)" },
          "50%": { boxShadow: "0 0 24px rgba(83, 193, 255, 0.35)" },
        },
      },
      animation: {
        "pulse-glow": "pulseGlow 2.8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
