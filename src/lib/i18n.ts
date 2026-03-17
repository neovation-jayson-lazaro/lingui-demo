import "server-only";

import type { Route } from "next";
import { cache } from "react";
import { redirect } from "next/navigation";
import { type I18n, type Messages, setupI18n } from "@lingui/core";
import { setI18n } from "@lingui/react/server";
import { locales, type Locale, type CatalogName } from "../../lingui.config";
import type { AppRoute } from "./routes";

const catalogCache = new Map<string, Messages>();

async function loadCatalog(locale: string, catalog: CatalogName): Promise<Messages> {
  const key = `${locale}/${catalog}`;
  if (catalogCache.has(key)) return catalogCache.get(key)!;
  const { messages } = await import(`../locales/${locale}/${catalog}.ts`);
  catalogCache.set(key, messages);
  return messages;
}

async function loadCatalogs(locale: string, catalogs: CatalogName[]): Promise<Messages> {
  const all: Messages = {};
  for (const catalog of catalogs) {
    Object.assign(all, await loadCatalog(locale, catalog));
  }
  return all;
}

export function getAllLocales(): readonly Locale[] {
  return locales;
}

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

const getI18nInstanceCached = cache(
  async (locale: string, catalogKey: string, catalogs: CatalogName[]): Promise<I18n> => {
    const messages = await loadCatalogs(locale, catalogs);
    return setupI18n({ locale, messages: { [locale]: messages } });
  }
);

export async function getI18nInstance(
  locale: string,
  catalogs: CatalogName[] = ["common"]
): Promise<I18n> {
  if (!(locales as readonly string[]).includes(locale)) {
    console.warn(`Unsupported locale "${locale}", falling back to "en"`);
    locale = "en";
  }
  const catalogKey = catalogs.sort().join("+");
  return getI18nInstanceCached(locale, catalogKey, catalogs);
}

export async function activateI18n(lang: string, catalogs: CatalogName[] = ["common"]) {
  const i18n = await getI18nInstance(lang, catalogs);
  setI18n(i18n);
  return { lang, i18n };
}

/**
 * Create an I18n instance without React.cache — suitable for Route Handlers
 * and other non-React server contexts where React.cache is unavailable.
 */
export async function createI18nInstance(
  locale: string,
  catalogs: CatalogName[] = ["common"]
): Promise<I18n> {
  if (!(locales as readonly string[]).includes(locale)) {
    locale = "en";
  }
  const messages = await loadCatalogs(locale, catalogs);
  return setupI18n({ locale, messages: { [locale]: messages } });
}

/**
 * Server-only locale-aware redirect. The `as Route` assertion is safe because
 * the dynamic [lang] segment makes any /{slug}{suffix} a valid DynamicRoute.
 */
export function localeRedirect(lang: Locale, path: AppRoute): never {
  const suffix = path === "/" ? "" : path;
  redirect(`/${lang}${suffix}` as Route);
}
