"use client";

import { Trans } from "@lingui/react/macro";
import styles from "@/styles/page-content.module.css";

export default function Loading() {
  return (
    <div className={styles.wrapper}>
      <main className={styles.content}>
        <p className="text-lg text-zinc-500 dark:text-zinc-400">
          <Trans>Loading...</Trans>
        </p>
      </main>
    </div>
  );
}
