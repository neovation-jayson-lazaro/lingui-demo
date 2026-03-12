import { isLocale, localeRedirect } from "@/lib/i18n";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ lang: string }>;
};

export default async function GoHomePage({ params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  localeRedirect(lang, "/");
}
