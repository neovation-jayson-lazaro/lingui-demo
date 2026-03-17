import { Trans } from "@lingui/react/macro";
import { notFound } from "next/navigation";
import { activateI18n } from "@/lib/i18n";
import { LocaleLink } from "@/components/LocaleLink";
import styles from "@/styles/page-content.module.css";
import { USERS } from "../data";

type Props = {
  params: Promise<{ lang: string; slug: string }>;
};

export default async function UserDetailPage({ params }: Props) {
  const { lang, slug } = await params;
  await activateI18n(lang, ["common", "users"]);

  const user = USERS.find((u) => u.slug === slug);
  if (!user) notFound();

  return (
    <div className={styles.wrapper}>
      <main className={styles.content}>
        <h2 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
          <Trans>User Details</Trans>
        </h2>
        <div className="flex flex-col items-center gap-2 text-lg text-zinc-600 dark:text-zinc-400">
          <p>
            <Trans>Name: {user.name}</Trans>
          </p>
          <p>
            <Trans>ID: {user.id}</Trans>
          </p>
          <p>
            <Trans>Slug: {user.slug}</Trans>
          </p>
        </div>
        <LocaleLink
          href="/users"
          className="rounded-full border border-zinc-300 bg-white px-6 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
        >
          <Trans>Back to Users</Trans>
        </LocaleLink>
      </main>
    </div>
  );
}
