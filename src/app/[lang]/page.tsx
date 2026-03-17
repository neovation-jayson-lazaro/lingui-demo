import { Trans } from "@lingui/react/macro";
import { activateI18n } from "@/lib/i18n";
import { LocaleLink } from "@/components/LocaleLink";
import { AdditionalTextToggle } from "@/components/AdditionalTextToggle";
import styles from "@/styles/page-content.module.css";

type Props = {
  params: Promise<{ lang: string }>;
};

export default async function Home({ params }: Props) {
  await activateI18n((await params).lang, ["common", "home"]);

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
            This centered text also gets translated.
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
