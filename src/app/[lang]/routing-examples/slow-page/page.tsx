import { Trans } from "@lingui/react/macro";
import { activateI18n } from "@/lib/i18n";
import { LocaleLink } from "@/components/LocaleLink";
import styles from "@/styles/page-content.module.css";

type Props = {
  params: Promise<{ lang: string }>;
};

export default async function SlowPage({ params }: Props) {
  await activateI18n((await params).lang, ["common", "routing-examples"]);
  await new Promise((resolve) => setTimeout(resolve, 3000));

  return (
    <div className={styles.wrapper}>
      <main className={styles.content}>
        <h2 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
          <Trans>Page</Trans>
        </h2>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          <Trans>This content was loaded after a 3-second delay.</Trans>
        </p>
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
