module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#2563eb",
        secondary: "#0f172a",
        background: "#f8fafc",
        surface: "#ffffff",
        border: "#e2e8f0",
        text: {
          DEFAULT: "#0f172a",
          muted: "#64748b",
        },
        success: "#16a34a",
        error: "#dc2626",
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 20px 60px rgba(15, 23, 42, 0.08)",
      },
    },
  },
  plugins: [],
};
