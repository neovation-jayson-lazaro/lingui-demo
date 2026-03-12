import { Trans } from "@lingui/react/macro";
import { activateI18n } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { LocaleLink } from "@/components/LocaleLink";
import { AdditionalTextToggle } from "@/components/AdditionalTextToggle";
import { ReturnHomeButton } from "./ReturnHomeButton";

type Props = {
  params: Promise<{ lang: string }>;
};

export default async function HelloTesting({ params }: Props) {
  const { lang } = await params;
  await activateI18n(lang);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-col items-center gap-8 p-16">
        <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
          <Trans>Hello Testing</Trans>
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          <Trans>
            This text is translated using LinguiJS in the Next.js App Router.
          </Trans>
        </p>
        <p className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-500">
          <Trans>Active locale:</Trans>{" "}
          <LanguageSwitcher />
        </p>
        <AdditionalTextToggle />
        <div className="flex flex-wrap gap-3">
          <ReturnHomeButton />
          <LocaleLink
            href="/hellotesting/go-home"
            className="rounded-full border border-zinc-300 bg-white px-6 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            <Trans>Go to Redirect</Trans>
          </LocaleLink>
        </div>
      </main>
    </div>
  );
}
