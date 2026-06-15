import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#14503b",
          dark: "#0f3d2e",
          deep: "#0f2a20",
          light: "#1b6b4f",
          mist: "#f4f8f6",
          line: "#dde3e7"
        }
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "Helvetica Neue", "Arial", "sans-serif"],
        mono: ["ui-monospace", "Menlo", "Consolas", "monospace"]
      }
    }
  },
  plugins: []
};
export default config;
