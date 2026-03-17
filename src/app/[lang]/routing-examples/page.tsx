import { Trans } from "@lingui/react/macro";
import { activateI18n } from "@/lib/i18n";
import { LocaleLink } from "@/components/LocaleLink";
import { NavigateHomeButton } from "./NavigateHomeButton";
import { ApiGreeting } from "./ApiGreeting";
import styles from "@/styles/page-content.module.css";

type Props = {
  params: Promise<{ lang: string }>;
};

export default async function RoutingExamples({ params }: Props) {
  await activateI18n((await params).lang, ["common", "routing-examples"]);
  return (
    <div className={styles.wrapper}>
      <main className={styles.content}>
        <h2 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
          <Trans>Routing Examples</Trans>
        </h2>

        <section className="flex w-full flex-col items-center gap-4">
          <h3 className="text-2xl font-semibold text-zinc-800 dark:text-zinc-100">
            <Trans>Navigation Link</Trans>
          </h3>
          <LocaleLink
            href="/"
            className="rounded-full border border-zinc-300 bg-white px-6 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            <Trans>Return to Home</Trans>
          </LocaleLink>
        </section>

        <section className="flex w-full flex-col items-center gap-4">
          <h3 className="text-2xl font-semibold text-zinc-800 dark:text-zinc-100">
            <Trans>Redirect to Home</Trans>
          </h3>
          <LocaleLink
            href="/routing-examples/go-home"
            className="rounded-full border border-zinc-300 bg-white px-6 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            <Trans>Redirect Home</Trans>
          </LocaleLink>
        </section>

        <section className="flex w-full flex-col items-center gap-4">
          <h3 className="text-2xl font-semibold text-zinc-800 dark:text-zinc-100">
            <Trans>Programmatic Client-Side Navigation</Trans>
          </h3>
          <NavigateHomeButton />
        </section>

        <section className="flex w-full flex-col items-center gap-4">
          <h3 className="text-2xl font-semibold text-zinc-800 dark:text-zinc-100">
            <Trans>Dynamic Slug Route</Trans>
          </h3>
          <LocaleLink
            href="/users"
            className="rounded-full border border-zinc-300 bg-white px-6 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            <Trans>Link to /users</Trans>
          </LocaleLink>
        </section>

        <section className="flex w-full flex-col items-center gap-4">
          <h3 className="text-2xl font-semibold text-zinc-800 dark:text-zinc-100">
            <Trans>Streaming / Suspense with Loading</Trans>
          </h3>
          <LocaleLink
            href="/routing-examples/slow-page"
            className="rounded-full border border-zinc-300 bg-white px-6 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            <Trans>Navigate to Page</Trans>
          </LocaleLink>
        </section>

        <section className="flex w-full flex-col items-center gap-4">
          <h3 className="text-2xl font-semibold text-zinc-800 dark:text-zinc-100">
            <Trans>API Route Localization</Trans>
          </h3>
          <ApiGreeting />
        </section>
      </main>
    </div>
  );
}
