import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        erfor: {
          ink: "#071d22",
          deep: "#062c28",
          green: "#0f7a3d",
          lime: "#2fa84f",
          mist: "#edf7f1",
          gold: "#f59e0b",
          danger: "#dc2626"
        }
      },
      boxShadow: {
        soft: "0 18px 50px rgba(7, 29, 34, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
