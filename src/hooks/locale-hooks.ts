"use client";

import type { Route } from "next";
import { usePathname, useRouter } from "next/navigation";
import { locales, type Locale } from "../../lingui.config";
import type { AppRoute } from "@/lib/routes";

function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export function useLocalePathname() {
  const pathname = usePathname();
  const [, first, ...rest] = pathname.split("/");
  const candidate = first ?? "";
  const locale: Locale = isLocale(candidate) ? candidate : "en";
  const pathnameWithoutLocale = (rest.length ? `/${rest.join("/")}` : "/") as AppRoute;
  return { pathname, locale, pathnameWithoutLocale } as const;
}

/**
 * Locale-aware wrapper around Next.js useRouter.
 * Automatically prefixes the current locale to every navigation call.
 */
export function useLocaleRouter() {
  const router = useRouter();
  const { locale } = useLocalePathname();

  type NavOptions = Parameters<typeof router.push>[1];

  function toLocaleRoute(path: AppRoute): Route {
    const suffix = path === "/" ? "" : path;
    return `/${locale}${suffix}` as Route;
  }

  function push(path: AppRoute, options?: NavOptions) {
    router.push(toLocaleRoute(path), options);
  }

  function replace(path: AppRoute, options?: NavOptions) {
    router.replace(toLocaleRoute(path), options);
  }

  function prefetch(path: AppRoute) {
    router.prefetch(toLocaleRoute(path));
  }

  return { ...router, push, replace, prefetch, locale };
}
