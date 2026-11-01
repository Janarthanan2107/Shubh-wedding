import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    ignores: [".next/**", "node_modules/**", "public/**", "prisma/dev.db", "playwright-report/**", "test-results/**"],
  },
];
