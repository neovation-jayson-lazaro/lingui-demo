import { type I18n, type Messages, setupI18n } from "@lingui/core";
import type { CatalogName, Locale } from "../../lingui.config";

export async function loadTestCatalog(
  locale: Locale,
  catalog: CatalogName
): Promise<Messages> {
  const { messages } = await import(`../locales/${locale}/${catalog}.ts`);
  return messages;
}

export async function createTestI18n(
  locale: Locale,
  catalogs: CatalogName[] = ["common"]
): Promise<I18n> {
  const merged: Messages = {};
  for (const catalog of catalogs) {
    Object.assign(merged, await loadTestCatalog(locale, catalog));
  }
  return setupI18n({ locale, messages: { [locale]: merged } });
}
