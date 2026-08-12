import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/gatekpt/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // XIV × Apple — royal blue + green, pure black, cold precision
        apple: {
          blue:      "#0A56D6",   // royal blue — primary interactive accent
          green:     "#32D74B",   // Apple system green dark-mode — data up
          red:       "#FF453A",   // Apple system red dark-mode — data down
          orange:    "#FF9F0A",
          yellow:    "#FFD60A",
          indigo:    "#0A56D6",   // alias → royal blue
          teal:      "#32D74B",   // alias → green
          // label hierarchy
          label:     "#FFFFFF",
          label2:    "rgba(255,255,255,0.55)",
          label3:    "rgba(255,255,255,0.25)",
          label4:    "rgba(255,255,255,0.12)",
          // fill hierarchy
          fill:      "rgba(255,255,255,0.08)",
          fill2:     "rgba(255,255,255,0.05)",
          fill3:     "rgba(255,255,255,0.04)",
          fill4:     "rgba(255,255,255,0.03)",
          // background hierarchy — pure black base
          bg:        "#000000",
          bg2:       "#111111",
          bg3:       "#191919",
          bg4:       "#222222",
          sep:       "rgba(255,255,255,0.07)",
          sepOpaque: "#1A1A1A",
        },
        jarvis: {
          cyan:   "#0A56D6",
          blue:   "#0A56D6",
          purple: "rgba(255,255,255,0.45)",
          dim:    "#000000",
          panel:  "#111111",
          border: "#1A1A1A",
        },
      },
      fontFamily: {
        display: ["var(--font-inter)", "-apple-system", "BlinkMacSystemFont", "system-ui", "sans-serif"],
        body:    ["var(--font-inter)", "-apple-system", "BlinkMacSystemFont", "system-ui", "sans-serif"],
        mono: [
          "var(--font-jbmono)",
          "ui-monospace",
          "Menlo",
          "monospace",
        ],
      },
      fontSize: {
        // Apple-style large display number sizes
        "display-xl": ["4.5rem", { lineHeight: "1", letterSpacing: "-0.03em", fontWeight: "200" }],
        "display-lg": ["3rem",   { lineHeight: "1", letterSpacing: "-0.025em", fontWeight: "200" }],
        "display-md": ["2rem",   { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "300" }],
      },
      boxShadow: {
        // Apple-style depth shadows (no color glow)
        "apple-xl": "0 20px 60px rgba(0,0,0,0.8), 0 8px 20px rgba(0,0,0,0.4)",
        "apple-lg": "0 10px 40px rgba(0,0,0,0.6), 0 4px 12px rgba(0,0,0,0.3)",
        "apple-md": "0 4px 20px rgba(0,0,0,0.5)",
        "apple-sm": "0 2px 8px rgba(0,0,0,0.4)",
        // Keep for backwards compat
        neon:       "0 0 0 1px rgba(10,132,255,0.12)",
        "neon-sm":  "0 0 0 1px rgba(10,132,255,0.08)",
      },
      borderRadius: {
        apple: "13px",
        "apple-lg": "20px",
        "apple-xl": "28px",
      },
      backdropBlur: {
        apple: "40px",
      },
      animation: {
        "pulse-slow": "pulse-slow 3s ease-in-out infinite",
        fade: "gatekpt-fade 2.4s ease-in-out infinite",
        "fade-in-up": "fade-in-up 0.6s ease-out forwards",
        "spin-slow": "spin 3s linear infinite",
      },
      keyframes: {
        "pulse-slow": {
          "0%, 100%": { opacity: "0.7" },
          "50%": { opacity: "1" },
        },
        "gatekpt-fade": {
          "0%, 100%": { opacity: "0.25" },
          "50%": { opacity: "0.9" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
