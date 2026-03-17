import { Trans } from "@lingui/react/macro";
import { activateI18n } from "@/lib/i18n";
import styles from "@/styles/page-content.module.css";
import { NameForm } from "./NameForm";

const APP_NAME = "LinguiDemo";

type Props = {
  params: Promise<{ lang: string }>;
};

export default async function ParameterizedStrings({ params }: Props) {
  await activateI18n((await params).lang, ["common", "parameterized-strings"]);

  return (
    <div className={styles.wrapper}>
      <main className={styles.content}>
        <h2 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
          <Trans>Parameterized String Examples</Trans>
        </h2>

        <NameForm />

        <section className="flex w-full flex-col items-center gap-4">
          <h3 className="text-2xl font-semibold text-zinc-800 dark:text-zinc-100">
            <Trans>String with Placeholder</Trans>
          </h3>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            <Trans>I am using {APP_NAME}</Trans>
          </p>
        </section>
      </main>
    </div>
  );
}
