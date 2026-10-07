import nextPlugin from "@next/eslint-plugin-next";

export default [
  {
    ignores: [".next/**", "node_modules/**", "out/**", "build/**"],
  },
  nextPlugin.configs["core-web-vitals"],
];
