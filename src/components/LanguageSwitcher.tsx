"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useLocalePathname } from "@/hooks/locale-hooks";
import { locales } from "../../lingui.config";

const LOCALE_LABELS: Record<string, string> = {
  en: "English",
  "en-CA": "English (Canada)",
  "en-US": "English (US)",
  fr: "Français",
  "fr-CA": "Français (Canada)",
  es: "Español",
  de: "Deutsch",
  ja: "日本語",
};

export function LanguageSwitcher() {
  const { pathname, locale: currentLocale } = useLocalePathname();
  const router = useRouter();
  const segments = pathname.split("/");

  const switchLocale = (newLocale: string) => {
    const newSegments = [...segments];
    newSegments[1] = newLocale;
    const newPath = newSegments.join("/");
    const { search, hash } = window.location;
    router.push(`${newPath}${search}${hash}` as Route);
  };

  return (
    <select
      value={currentLocale}
      onChange={(e) => switchLocale(e.target.value)}
      className="h-8 rounded-md border border-zinc-300 bg-white px-2 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:border-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:border-zinc-500 dark:focus:border-zinc-400 dark:focus:ring-zinc-400"
    >
      {locales.map((locale) => (
        <option key={locale} value={locale}>
          {LOCALE_LABELS[locale] ?? locale.toUpperCase()}
        </option>
      ))}
    </select>
  );
}
