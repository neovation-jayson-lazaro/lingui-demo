import { Trans } from "@lingui/react/macro";
import { activateI18n } from "@/lib/i18n";
import { LocaleLink } from "@/components/LocaleLink";
import { AdditionalTextToggle } from "@/components/AdditionalTextToggle";
import styles from "@/styles/page-content.module.css";

type Props = {
  params: Promise<{ lang: string }>;
};

export default async function Home({ params }: Props) {
  const { lang } = await params;
  const { i18n } = await activateI18n(lang, ["common", "home"]);

  const now = new Date();
  const visitorCount = i18n.number(1_000_000);
  const formattedDate = i18n.date(now, { dateStyle: "long" });
  const formattedTime = i18n.date(now, { timeStyle: "short" });

  return (
    <div className={styles.wrapper}>
      <main className={styles.content}>
        <h2 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
          <Trans>Home</Trans>
        </h2>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          <Trans>
            This text is translated using LinguiJS in the Next.js App Router.
          </Trans>
        </p>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          <Trans>
            This centered text also gets translated. You are visitor {visitorCount}!
          </Trans>
        </p>
        <p className="text-lg text-zinc-600 dark:text-zinc-400" suppressHydrationWarning>
          <Trans>
            Today&apos;s date and time is {formattedDate} {formattedTime}
          </Trans>
        </p>
        <LocaleLink
          href="/routing-examples"
          className="rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          <Trans>Go to Routing Examples</Trans>
        </LocaleLink>
      </main>
    </div>
  );
}
