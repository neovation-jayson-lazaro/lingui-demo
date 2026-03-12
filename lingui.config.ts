import type { LinguiConfig } from "@lingui/conf";

export const locales = ["en", "fr", "es", "de"] as const;
export type Locale = (typeof locales)[number];

const config: LinguiConfig = {
  locales: [...locales],
  sourceLocale: "en",
  catalogs: [
    {
      path: "src/locales/{locale}",
      include: ["src/"],
    },
  ],
};

export default config;
