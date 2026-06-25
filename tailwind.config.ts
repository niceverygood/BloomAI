import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        plum: { DEFAULT: "#2E1B33", soft: "#3A2A40" },
        coral: { DEFAULT: "#FF6B81", deep: "#E6435F", soft: "#FFE3E6" },
        peach: { DEFAULT: "#FFF4EF", deep: "#FFE9DF" },
        sage: { DEFAULT: "#4FA98E", soft: "#E3F4EE" },
        gold: { DEFAULT: "#F2A23C", soft: "#FFF0DA" },
        ink: "#3A2A40",
        muted: "#7A6A80",
        line: "#EFE6EA",
      },
      fontFamily: {
        sans: [
          "Pretendard",
          "Apple SD Gothic Neo",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 6px 20px rgba(46,27,51,0.05)",
        pop: "0 14px 34px rgba(216,76,106,0.16)",
      },
    },
  },
  plugins: [],
};

export default config;
