import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";
import eslint from "@eslint/js";

export default defineConfig([
  {
    files: ["**/*.{ts,mts,cts}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: { globals: globals.node },
    rules: {
      "@typescript-eslint/no-empty-object-type": [
        "error",
        {
          allowObjectTypes: "always",
        },
      ],
    },
  },
  eslint.configs.recommended,
  tseslint.configs.strict,
  tseslint.configs.stylistic,
]);
