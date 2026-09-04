/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.tsx",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#6C5CE7",
          light: "#8B7CF7",
          dark: "#5A4BD1",
        },
        accent: {
          DEFAULT: "#FF6B4A",
          light: "#FF8B70",
          dark: "#E8532E",
        },
        surface: {
          light: "#FFFFFF",
          dark: "#1E1E2D",
        },
        card: {
          DEFAULT: "#1E1E2D",
          light: "#2A2A3C",
        },
        bg: {
          light: "#F5F5F7",
          dark: "#121212",
        },
        text: {
          primary: "#1E1E2D",
          secondary: "#6B7280",
          inverse: "#FFFFFF",
        },
      },
      fontFamily: {
        sans: ["Poppins", "sans-serif"],
        semibold: ["Poppins_600SemiBold", "sans-serif"],
        bold: ["Poppins_700Bold", "sans-serif"],
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "24px",
      },
      shadow: {
        card: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 4,
        },
      },
    },
  },
  plugins: [],
};
