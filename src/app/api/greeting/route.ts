import { type NextRequest, NextResponse } from "next/server";
import { createI18nInstance, isLocale } from "@/lib/i18n";

export async function GET(request: NextRequest) {
  const param = request.nextUrl.searchParams.get("locale") ?? "en";
  const locale = isLocale(param) ? param : "en";
  const i18n = await createI18nInstance(locale, ["routing-examples"]);

  return NextResponse.json({
    locale,
    message: i18n.t({ id: "apiGreeting", message: "Fetch Completed!" }),
  });
}
