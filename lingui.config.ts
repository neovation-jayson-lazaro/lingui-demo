import type { LinguiConfig } from "@lingui/conf";

export const locales = ["en", "en-CA", "en-US", "fr", "fr-CA", "es", "de", "ja"] as const;
export type Locale = (typeof locales)[number];

export const catalogNames = [
  "common",
  "home",
  "pluralization",
  "select-variation",
  "parameterized-strings",
  "routing-examples",
  "users",
] as const;
export type CatalogName = (typeof catalogNames)[number];

const config: LinguiConfig = {
  locales: [...locales],
  sourceLocale: "en",
  fallbackLocales: {
    "en-CA": "en",
    "en-US": "en",
    "fr-CA": "fr",
    default: "en",
  },
  catalogs: [
    {
      path: "src/locales/{locale}/common",
      include: [
        "src/components/",
        "src/app/*/layout.tsx",
        "src/app/*/not-found.tsx",
        "src/app/*/error.tsx",
      ],
    },
    {
      path: "src/locales/{locale}/home",
      include: ["src/app/*/page.tsx"],
    },
    {
      path: "src/locales/{locale}/pluralization",
      include: ["src/app/*/pluralization/**/*.*"],
    },
    {
      path: "src/locales/{locale}/select-variation",
      include: ["src/app/*/select-variation/**/*.*"],
    },
    {
      path: "src/locales/{locale}/parameterized-strings",
      include: ["src/app/*/parameterized-strings/**/*.*"],
    },
    {
      path: "src/locales/{locale}/routing-examples",
      include: ["src/app/*/routing-examples/**/*.*", "src/app/api/greeting/**/*.*"],
    },
    {
      path: "src/locales/{locale}/users",
      include: ["src/app/*/users/**/*.*"],
    },
  ],
};

export default config;
