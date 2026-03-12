"use client";

import type { Route } from "next";
import Link, { type LinkProps } from "next/link";
import type { AppRoute } from "@/lib/routes";
import { useLocalePathname } from "@/hooks/locale-hooks";

type Props = Omit<LinkProps<Route>, "href"> & {
  href: AppRoute;
  children: React.ReactNode;
  className?: string;
};

export function LocaleLink({ href, ...props }: Props) {
  const { locale } = useLocalePathname();
  const suffix = href === "/" ? "" : href;
  const localizedHref = `/${locale}${suffix}` as Route;
  return <Link href={localizedHref} {...props} />;
}
