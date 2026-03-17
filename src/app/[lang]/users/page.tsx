import type { Route } from "next";
import Link from "next/link";
import { Trans } from "@lingui/react/macro";
import { activateI18n } from "@/lib/i18n";
import { LocaleLink } from "@/components/LocaleLink";
import styles from "@/styles/page-content.module.css";
import { USERS } from "./data";

type Props = {
  params: Promise<{ lang: string }>;
};

export default async function UsersPage({ params }: Props) {
  const { lang } = await params;
  await activateI18n(lang, ["common", "users"]);

  return (
    <div className={styles.wrapper}>
      <main className={styles.content}>
        <h2 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
          <Trans>Users</Trans>
        </h2>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          <Trans>Select a user to view their details.</Trans>
        </p>
        <div className="flex w-full flex-col items-center gap-3">
          {USERS.map((user) => (
            <Link
              key={user.slug}
              href={`/${lang}/users/${user.slug}` as Route}
              className="rounded-full border border-zinc-300 bg-white px-6 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
            >
              {user.name} ({user.slug})
            </Link>
          ))}
        </div>
        <LocaleLink
          href="/routing-examples"
          className="rounded-full border border-zinc-300 bg-white px-6 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
        >
          <Trans>Go to Routing Examples</Trans>
        </LocaleLink>
      </main>
    </div>
  );
}
