/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#1E6638", // deep emerald
          dark: "#15502C",
          mid: "#387050",
          light: "#E7F3EC"
        },
        mint: "#34C77B", // success / PASS
        amber: "#E0A53A", // warning / RETAKE
        danger: "#D64545", // VIOLATION
        ink: "#1B2A22"
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "Segoe UI", "Roboto", "sans-serif"]
      },
      boxShadow: {
        soft: "0 8px 30px rgba(30,102,56,0.12)",
        card: "0 2px 12px rgba(0,0,0,0.08)"
      },
      borderRadius: {
        xl2: "1.25rem"
      }
    }
  },
  plugins: []
};
