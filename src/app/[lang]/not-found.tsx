"use client";

import { Trans } from "@lingui/react/macro";
import { LocaleLink } from "@/components/LocaleLink";
import styles from "@/styles/page-content.module.css";

export default function NotFound() {
  return (
    <div className={styles.wrapper}>
      <main className={styles.content}>
        <h2 className="text-6xl font-bold text-zinc-900 dark:text-zinc-50">
          404
        </h2>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          <Trans>Page not found</Trans>
        </p>
        <LocaleLink
          href="/"
          className="rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          <Trans>Back to Home</Trans>
        </LocaleLink>
      </main>
    </div>
  );
}
