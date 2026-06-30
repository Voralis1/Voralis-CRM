import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Surfaces
        base: "var(--bg-base)",
        surface: "var(--bg-surface)",
        elevated: "var(--bg-elevated)",
        hovered: "var(--bg-hover)",
        // Accent violet/indigo
        accent: {
          DEFAULT: "var(--accent)",
          hover: "var(--accent-hover)",
          soft: "var(--accent-soft)",
          dim: "var(--accent-dim)",
          border: "var(--accent-border)",
        },
        // Sidebar sombre
        sidebar: {
          DEFAULT: "var(--sidebar-bg)",
          elevated: "var(--sidebar-elevated)",
          active: "var(--sidebar-active)",
          text: "var(--sidebar-text)",
          strong: "var(--sidebar-strong)",
          border: "var(--sidebar-border)",
        },
        // Texte
        ink: {
          DEFAULT: "var(--text-primary)",
          muted: "var(--text-secondary)",
          faint: "var(--text-muted)",
          inverse: "var(--text-inverse)",
        },
        // Bordures
        line: {
          DEFAULT: "var(--border-subtle)",
          strong: "var(--border-default)",
        },
        // États sémantiques + couleurs KPI
        success: "var(--status-success)",
        warning: "var(--status-warning)",
        danger: "var(--status-danger)",
        info: "var(--status-info)",
        cyan: "var(--status-cyan)",
        violet: "var(--status-violet)",
        neutral: "var(--status-neutral)",
        // Compat héritée (ancien token "brand") remappée sur la palette dark/vert
        brand: {
          DEFAULT: "var(--green-primary)",
          dark: "#22c55e",
          deep: "var(--bg-surface)",
          light: "var(--green-primary)",
          mist: "var(--bg-hover)",
          line: "var(--border-subtle)",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "DM Sans", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "JetBrains Mono", "Fira Code", "monospace"],
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        pill: "var(--radius-pill)",
      },
      boxShadow: {
        card: "var(--shadow-card)",
        modal: "var(--shadow-modal)",
      },
    },
  },
  plugins: [],
};

export default config;
