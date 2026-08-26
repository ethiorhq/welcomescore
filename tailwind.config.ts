import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      colors: {
        base: "#12141C",
        surface: "#1B1E29",
        text: "#F2EEE6",
        muted: "#8B8F9E",
        accent: "#E8A23D",
        good: "#7A9B76",
      },
    },
  },
  plugins: [],
};

export default config;
