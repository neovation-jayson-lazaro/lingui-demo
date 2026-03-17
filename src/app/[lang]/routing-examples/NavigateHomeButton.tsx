"use client";

import { Trans } from "@lingui/react/macro";
import { useLocaleRouter } from "@/hooks/locale-hooks";

export function NavigateHomeButton() {
  const router = useLocaleRouter();

  return (
    <button
      onClick={() => router.push("/")}
      className="rounded-full border border-zinc-300 bg-white px-6 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
    >
      <Trans>Navigate to Home</Trans>
    </button>
  );
}
