import { notFound } from "next/navigation";
import { setI18n } from "@lingui/react/server";
import { getI18nInstance, isLocale } from "@/lib/i18n";
import { LinguiClientProvider } from "@/components/LinguiClientProvider";
import { SideNav } from "@/components/SideNav";
import { PageHeader } from "@/components/PageHeader";
import { locales, catalogNames } from "../../../lingui.config";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

type Props = {
  params: Promise<{ lang: string }>;
  children: React.ReactNode;
};

// This layout is the Lingui integration point for the entire [lang] subtree.
// It performs two essential steps:
//   1. setI18n(i18n) — stores the I18n instance in React.cache so Server
//      Components in this request can resolve <Trans> strings.
//   2. <LinguiClientProvider> — wraps children with I18nProvider so Client
//      Components can resolve <Trans> strings via React context.
export default async function LangLayout({ params, children }: Props) {
  const { lang } = await params;

  if (!isLocale(lang)) notFound();

  const i18n = await getI18nInstance(lang, [...catalogNames]);
  setI18n(i18n);

  return (
    <LinguiClientProvider initialLocale={lang} initialMessages={i18n.messages}>
      <SideNav />
      <div className="flex min-h-screen flex-col bg-zinc-50 font-sans dark:bg-black">
        <PageHeader />
        {children}
      </div>
    </LinguiClientProvider>
  );
}
