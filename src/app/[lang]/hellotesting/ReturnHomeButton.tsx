"use client";

import { Trans } from "@lingui/react/macro";
import { useLocaleRouter } from "@/hooks/locale-hooks";

export function ReturnHomeButton() {
  const router = useLocaleRouter();

  return (
    <button
      type="button"
      onClick={() => router.push("/")}
      className="rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
    >
      <Trans>Return to Home</Trans>
    </button>
  );
}
