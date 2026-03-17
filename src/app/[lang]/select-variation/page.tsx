import { Trans } from "@lingui/react/macro";
import { activateI18n } from "@/lib/i18n";
import styles from "@/styles/page-content.module.css";
import { RolePicker } from "./RolePicker";

type Props = {
  params: Promise<{ lang: string }>;
};

export default async function SelectVariation({ params }: Props) {
  await activateI18n((await params).lang, ["common", "select-variation"]);

  return (
    <div className={styles.wrapper}>
      <main className={styles.content}>
        <h2 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
          <Trans>Select Variation Example</Trans>
        </h2>
        <RolePicker />
      </main>
    </div>
  );
}
