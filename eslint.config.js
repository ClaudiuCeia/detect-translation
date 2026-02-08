const js = require("@eslint/js");
const tseslint = require("typescript-eslint");
const jest = require("eslint-plugin-jest");
const prettier = require("eslint-config-prettier");

module.exports = tseslint.config(
  {
    ignores: [
      "dist/**",
      "dist-browser/**",
      "pkg/**",
      "node_modules/**",
      "eslint.config.js",
      "jest.config.js",
      "jest.environment.jsdom.js",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.json", "./tsconfig.eslint.json"],
        tsconfigRootDir: __dirname,
      },
    },
  },
  {
    files: [".bin/**/*.ts"],
    rules: {
      "@typescript-eslint/no-implied-eval": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "no-new-func": "off",
    },
  },
  {
    files: ["**/*.test.ts", "**/*.spec.ts"],
    ...jest.configs["flat/recommended"],
  },
  prettier,
);
