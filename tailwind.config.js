/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#2D2D2D",
        accent: "#4A90E2",
        background: "#FFFFFF",
        sidebar: "#F8F9FA",
        success: "#10B981",
        warning: "#F59E0B",
        error: "#EF4444",
        gray: {
          100: "#F8F9FA",
          200: "#E9ECEF",
          300: "#DEE2E6",
          400: "#CED4DA",
          500: "#ADB5BD",
          600: "#6C757D",
          700: "#495057",
          800: "#343A40",
          900: "#212529",
        },
      },
      fontFamily: {
        sans: ["Pretendard", "system-ui", "sans-serif"],
      },
      spacing: {
        0.5: "4px",
        1: "8px",
        1.5: "12px",
        2: "16px",
        2.5: "20px",
        3: "24px",
        4: "32px",
        5: "40px",
        6: "48px",
        7: "56px",
        8: "64px",
      },
      maxWidth: {
        container: "800px",
      },
      width: {
        sidebar: "280px",
      },
      zIndex: {
        sidebar: 40,
        header: 30,
        overlay: 20,
        logo: 50,
      },
      transitionDuration: {
        300: "300ms",
      },
    },
  },
  plugins: [],
};
