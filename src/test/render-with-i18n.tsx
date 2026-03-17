import { type ReactElement } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { I18nProvider } from "@lingui/react";
import type { I18n } from "@lingui/core";
import type { CatalogName, Locale } from "../../lingui.config";
import { createTestI18n } from "./setup-i18n";

interface I18nRenderOptions extends Omit<RenderOptions, "wrapper"> {
  locale?: Locale;
  catalogs?: CatalogName[];
}

export async function renderWithI18n(
  ui: ReactElement,
  { locale = "en", catalogs = ["common"], ...options }: I18nRenderOptions = {}
) {
  const i18n = await createTestI18n(locale, catalogs);

  function Wrapper({ children }: { children: React.ReactNode }) {
    return <I18nProvider i18n={i18n}>{children}</I18nProvider>;
  }

  return {
    i18n,
    ...render(ui, { wrapper: Wrapper, ...options }),
  };
}
