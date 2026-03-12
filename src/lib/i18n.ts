import "server-only";

import type { Route } from "next";
import { cache } from "react";
import { redirect } from "next/navigation";
import { type I18n, type Messages, setupI18n } from "@lingui/core";
import { setI18n } from "@lingui/react/server";
import { locales, type Locale } from "../../lingui.config";
import type { AppRoute } from "./routes";

const catalogCache = new Map<string, Messages>();

async function loadCatalog(locale: string): Promise<Messages> {
  if (catalogCache.has(locale)) return catalogCache.get(locale)!;
  const { messages } = await import(`../locales/${locale}.ts`);
  catalogCache.set(locale, messages);
  return messages;
}

export function getAllLocales(): readonly Locale[] {
  return locales;
}

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

const getI18nInstanceCached = cache(async (locale: string): Promise<I18n> => {
  const messages = await loadCatalog(locale);
  return setupI18n({ locale, messages: { [locale]: messages } });
});

export async function getI18nInstance(locale: string): Promise<I18n> {
  if (!(locales as readonly string[]).includes(locale)) {
    console.warn(`Unsupported locale "${locale}", falling back to "en"`);
    locale = "en";
  }
  return getI18nInstanceCached(locale);
}

export async function activateI18n(lang: string) {
  const i18n = await getI18nInstance(lang);
  setI18n(i18n);
  return { lang, i18n };
}

/**
 * Server-only locale-aware redirect. The `as Route` assertion is safe because
 * the dynamic [lang] segment makes any /{slug}{suffix} a valid DynamicRoute.
 */
export function localeRedirect(lang: Locale, path: AppRoute): never {
  const suffix = path === "/" ? "" : path;
  redirect(`/${lang}${suffix}` as Route);
}
