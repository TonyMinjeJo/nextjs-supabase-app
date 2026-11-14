import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

// utils는 어디서든 "@/lib/utils"로만 import (상대경로 금지)
const utilsPathPattern = {
  regex: "^\\.{1,2}/(.*/)?utils$",
  message: "utils는 반드시 '@/lib/utils'로 import하세요.",
};

// 의존성 방향: app → components(event/admin) → lib → components/ui
const restrict = (...patterns) => ({
  "no-restricted-imports": [
    "error",
    { patterns: [...patterns, utilsPathPattern] },
  ],
});

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    rules: restrict(),
  },
  {
    files: ["lib/**/*.{ts,tsx}"],
    rules: restrict({
      group: ["@/app/*", "@/components/*"],
      message: "lib는 app/components를 import할 수 없습니다.",
    }),
  },
  {
    files: ["components/**/*.{ts,tsx}"],
    rules: restrict({
      group: ["@/app/*"],
      message: "components는 app을 import할 수 없습니다.",
    }),
  },
  {
    files: ["components/event/**/*.{ts,tsx}"],
    rules: restrict(
      {
        group: ["@/app/*"],
        message: "components는 app을 import할 수 없습니다.",
      },
      {
        group: ["@/components/admin/*"],
        message: "event는 admin을 import할 수 없습니다 (admin → event만 허용).",
      },
    ),
  },
  {
    files: ["components/ui/**/*.{ts,tsx}"],
    rules: restrict({
      group: ["@/app/*", "@/components/event/*", "@/components/admin/*"],
      message: "ui는 lib/utils와 ui 형제만 import할 수 있습니다.",
    }),
  },
  // Prettier와 충돌하는 포맷 규칙 비활성화 (반드시 마지막)
  prettier,
  globalIgnores([
    ".next/**",
    "node_modules/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "shrimp_data/**",
  ]),
]);

export default eslintConfig;
