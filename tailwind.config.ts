import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ["Arial", "Helvetica", "sans-serif"] },
      colors: {
        ink: "#17211f",
        muted: "#68736f",
        canvas: "#f5f7f4",
        brand: "#246b55",
        line: "#e6ebe6"
      },
      boxShadow: { soft: "0 12px 40px rgba(24, 43, 35, .06)" }
    }
  },
  plugins: []
};

export default config;
