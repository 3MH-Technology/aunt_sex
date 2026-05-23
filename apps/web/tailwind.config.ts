import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          black: "#0A0A0B",
          dark: "#0D0D10",
          panel: "#16161A",
          card: "#1C1C22",
          hover: "#24242B",
          border: "#2A2A33",
          accent: "#FF2D55",
          "accent-red": "#EF4444",
          "accent-pink": "#FF6B8A",
          "accent-purple": "#8B5CF6",
          glow: "rgba(255, 45, 85, 0.2)",
          "glow-pink": "rgba(255, 107, 138, 0.3)",
        },
        adult: {
          dark: "#0D0D12",
          card: "#1A1A24",
          hover: "#252533",
          pink: "#FF2D55",
          "pink-light": "#FF6B8A",
          purple: "#8B5CF6",
          gold: "#F59E0B",
          red: "#DC2626",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      boxShadow: {
        glow: "0 0 20px rgba(255, 45, 85, 0.35)",
        "glow-pink": "0 0 20px rgba(255, 107, 138, 0.3)",
        "glow-purple": "0 0 20px rgba(139, 92, 246, 0.3)",
        card: "0 4px 20px rgba(0,0,0,0.5)",
        soft: "0 2px 8px rgba(0,0,0,0.3)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        shimmer: "shimmer 1.5s infinite",
        pulse: "pulse 2s infinite",
        "neon-pulse": "neonPulse 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        neonPulse: {
          "0%, 100%": { boxShadow: "0 0 10px rgba(255, 45, 85, 0.3)" },
          "50%": { boxShadow: "0 0 25px rgba(255, 45, 85, 0.6)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
