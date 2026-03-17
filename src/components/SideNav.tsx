"use client";

import { useState, useEffect } from "react";
import { Trans } from "@lingui/react/macro";
import { LocaleLink } from "@/components/LocaleLink";
import type { AppRoute } from "@/lib/routes";
import { useLocalePathname } from "@/hooks/locale-hooks";

const NAV_ITEMS: { label: React.ReactNode; href: AppRoute }[] = [
  { label: <Trans>Home</Trans>, href: "/" },
  { label: <Trans>Pluralization Example</Trans>, href: "/pluralization" },
  { label: <Trans>Select Variation Example</Trans>, href: "/select-variation" },
  { label: <Trans>Parameterized String Examples</Trans>, href: "/parameterized-strings" },
  { label: <Trans>Routing Examples</Trans>, href: "/routing-examples" },
  { label: <Trans>Users</Trans>, href: "/users" },
];

export function SideNav() {
  const [open, setOpen] = useState(false);
  const { pathnameWithoutLocale } = useLocalePathname();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("keydown", onKey);
      return () => document.removeEventListener("keydown", onKey);
    }
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        className="fixed top-5 left-5 z-50 flex h-10 w-10 flex-col items-center justify-center gap-[5px] rounded-lg bg-zinc-900/80 backdrop-blur-sm transition-colors hover:bg-zinc-700/90 dark:bg-zinc-100/80 dark:hover:bg-zinc-300/90"
      >
        <span
          className={`block h-[2px] w-5 rounded-full bg-white transition-all duration-300 ease-in-out dark:bg-zinc-900 ${
            open ? "translate-y-[7px] rotate-45" : ""
          }`}
        />
        <span
          className={`block h-[2px] w-5 rounded-full bg-white transition-all duration-300 ease-in-out dark:bg-zinc-900 ${
            open ? "scale-x-0 opacity-0" : ""
          }`}
        />
        <span
          className={`block h-[2px] w-5 rounded-full bg-white transition-all duration-300 ease-in-out dark:bg-zinc-900 ${
            open ? "-translate-y-[7px] -rotate-45" : ""
          }`}
        />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      <nav
        className="fixed top-20 left-5 z-40 flex flex-col gap-4"
        aria-hidden={!open}
      >
        {NAV_ITEMS.map((item, i) => {
          const isActive = pathnameWithoutLocale === item.href;
          return (
            <LocaleLink
              key={i}
              href={item.href}
              className={`text-lg font-semibold drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)] transition-all duration-300 ease-out dark:drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] ${
                isActive
                  ? "text-orange-500 dark:text-orange-400"
                  : "text-zinc-900 hover:text-zinc-600 dark:text-zinc-50 dark:hover:text-zinc-300"
              } ${
                open
                  ? "translate-x-0 opacity-100"
                  : "-translate-x-6 opacity-0 pointer-events-none"
              }`}
              style={{ transitionDelay: open ? `${i * 75}ms` : "0ms" }}
            >
              {item.label}
            </LocaleLink>
          );
        })}
      </nav>
    </>
  );
}
