import type { Route } from "next";
import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ lang: string }>;
};

export default async function GoHomePage({ params }: Props) {
  const { lang } = await params;
  redirect(`/${lang}` as Route);
}
