"use client";

import { Trans } from "@lingui/react/macro";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import styles from "@/styles/page-header.module.css";

export function PageHeader() {
  return (
    <header className={styles.header}>
      <h1 className={styles.title}>LinguiDemo</h1>
      <div className={styles.locale}>
        <Trans>Active locale:</Trans>
        <LanguageSwitcher />
      </div>
    </header>
  );
}
