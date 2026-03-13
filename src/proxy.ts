import { type NextRequest, NextResponse } from "next/server";
import Negotiator from "negotiator";
import { locales } from "../lingui.config";

const LOCALE_COOKIE = "NEXT_LOCALE";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

// Lingui requires URL-based locale routing: every page lives under /[lang]/...
// This proxy ensures every request reaches a valid locale-prefixed URL.
//
// Flow:
//   1. If the URL already has a valid locale prefix → pass through, persist cookie
//   2. If the URL has no locale or an unsupported one → resolve preferred locale
//      (cookie → Accept-Language → fallback), redirect to /{locale}/...
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the URL already starts with a supported locale prefix
  const pathnameLocale = locales.find(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameLocale) {
    // Valid locale in URL — pass the request through.
    // Inject x-locale header for potential use by downstream API routes.
    const headers = new Headers(request.headers);
    headers.set("x-locale", pathnameLocale);

    const response = NextResponse.next({ request: { headers } });

    // Persist the locale preference in a cookie so subsequent visits
    // (e.g. navigating to "/") remember the user's last language.
    if (request.cookies.get(LOCALE_COOKIE)?.value !== pathnameLocale) {
      response.cookies.set(LOCALE_COOKIE, pathnameLocale, {
        path: "/",
        maxAge: COOKIE_MAX_AGE,
        sameSite: "lax",
      });
    }
    return response;
  }

  // No valid locale prefix found — prepend the resolved locale and redirect.
  // The original pathname is preserved so invalid paths like /xyz/hellotesting
  // become /fr/xyz/hellotesting and fall through to a localized 404.
  const locale = getRequestLocale(request);
  request.nextUrl.pathname = `/${locale}${pathname}`;

  const response = NextResponse.redirect(request.nextUrl);
  response.cookies.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: COOKIE_MAX_AGE,
    sameSite: "lax",
  });
  return response;
}

// Determines the preferred locale for a request using a priority chain:
//   1. NEXT_LOCALE cookie (user's explicit previous choice)
//   2. Accept-Language header (browser preference, negotiated against supported locales)
//   3. First locale in config (ultimate fallback)
function getRequestLocale(request: NextRequest): string {
  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  if (cookieLocale && (locales as readonly string[]).includes(cookieLocale)) {
    return cookieLocale;
  }

  const langHeader = request.headers.get("accept-language") || undefined;
  const languages = new Negotiator({
    headers: { "accept-language": langHeader },
  }).languages(locales.slice());

  return languages[0] || locales[0] || "en";
}

// Matcher excludes API routes, static assets, and images — proxy only
// runs for page navigations that need locale routing.
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
