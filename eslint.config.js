import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
      // 디자인 토큰 강제 — 하드코딩 방지(CLAUDE.md §1). 청소 완료 후 warn→error 승격 예정.
      "no-restricted-syntax": [
        "warn",
        {
          selector: "Literal[value=/text-\\[[0-9.]+px\\]/]",
          message: "폰트 크기 하드코딩 금지 — designTokens.ts 토큰(text-mini/chip/xs/body/sm/title/h2/heading/display)을 쓰세요 (CLAUDE.md §1).",
        },
        {
          selector: "TemplateElement[value.cooked=/text-\\[[0-9.]+px\\]/]",
          message: "폰트 크기 하드코딩 금지 — designTokens.ts 토큰을 쓰세요 (CLAUDE.md §1).",
        },
        {
          selector: "Literal[value=/(text|bg|border)-\\[#[0-9a-fA-F]/]",
          message: "색 하드코딩 금지 — 디자인 SSOT 색 토큰/역할 토큰을 쓰세요 (CLAUDE.md §1).",
        },
      ],
    },
  },
);
