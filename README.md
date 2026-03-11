# Lingui + Next.js App Router — Production-Readiness Architecture Review

**Review date:** 2026-03-11
**Stack:** Next.js 16.1.6 · React 19.2.3 · @lingui/core 5.9.2 · @lingui/swc-plugin 5.11.0 · Tailwind 4 · TypeScript 5
**Rendering strategy:** Dynamic rendering (`force-dynamic`) — all routes rendered on every request
**Locale count:** 2 (en, es) · **String count:** 12 per locale · **All translations complete**

---

## 1. Architecture Summary

### Routing & Locale Segments

The app uses a single `[lang]` dynamic segment under `src/app/[lang]/` to partition all localized content. Two leaf pages exist (`page.tsx` and `hellotesting/page.tsx`), along with a translated 404 page (`not-found.tsx`) and a translated error boundary (`error.tsx`).

The root layout at `src/app/layout.tsx` is a pass-through — it owns only global CSS imports and static `<Metadata>`. It returns `{children}` directly without wrapping in `<html>` or `<body>`. The `<html>` and `<body>` elements live in `src/app/[lang]/layout.tsx`, which has access to the `lang` parameter and renders `<html lang={lang}>` — giving every locale an accurate document language attribute.

`src/app/[lang]/layout.tsx` declares `export const dynamic = "force-dynamic"`, which forces all routes under the `[lang]` subtree to render dynamically on every request. No `generateStaticParams` is present — the app relies entirely on server-side rendering rather than build-time prerendering.

### Locale Resolution

Locale resolution follows a three-tier priority chain inside `src/middleware.ts`:

1. **URL prefix** — If the pathname starts with a known locale (`/en/...`, `/es/...`), the request passes through. The middleware sets a `NEXT_LOCALE` cookie (1-year expiry, `sameSite: lax`) and injects an `x-locale` request header for potential downstream use.
2. **Cookie** — If the URL has no valid locale prefix, `getRequestLocale()` checks the `NEXT_LOCALE` cookie against the whitelist.
3. **Accept-Language** — If no cookie exists, the `negotiator` library matches the browser's `Accept-Language` header against supported locales.

The resolved locale is used to redirect the user to the correct prefixed URL (e.g. `/` → `/en`).

### Invalid Locale Handling

Three layers of validation prevent unsupported locales from rendering:

- **Middleware layer** (`src/middleware.ts`, lines 47–52): Any pathname whose first segment matches `/^[a-z]{2}(-[a-z]{2})?$/i` but isn't in the whitelist gets stripped and redirected. For example, `/fr/about` → `/en/about` (assuming English is the resolved preference). This prevents nested-junk URLs like `/en/fr/about`.
- **Layout layer** (`src/app/[lang]/layout.tsx`, line 36): `getAllLocales().includes(lang)` is checked and `notFound()` is triggered for any locale that somehow bypasses middleware (direct server-side navigation, cached route manifests, etc.).
- **Catalog loader layer** (`src/lib/i18n.ts`, lines 34–37): `getI18nInstance()` validates the locale parameter against the config whitelist before any `import()` call. Invalid locales fall back to `"en"` with a `console.warn`. This is defense-in-depth — it should never be reached in normal operation.

### Translation Catalog Loading

`src/lib/i18n.ts` is guarded by `import "server-only"` — it cannot be imported from client components. Catalogs are loaded lazily via dynamic `import(`../locales/${locale}.ts`)` and cached in a `Map<string, Messages>`. A second `Map<string, I18n>` caches fully-constructed `I18n` instances. After the first request for a given locale, all subsequent requests reuse cached data with zero allocation.

The compiled catalog files (`src/locales/en.ts`, `src/locales/es.ts`) use `JSON.parse()` for the message payload. V8 parses `JSON.parse(string)` faster than equivalent JavaScript object literals — this is the recommended Lingui pattern for performance.

### Server-Side i18n

The `[lang]/layout.tsx` calls `getI18nInstance(lang)` followed by `setI18n(i18n)` to establish the i18n context for layout-level `<Trans>` usage. Each page uses the `activateI18n()` convenience helper from `src/lib/i18n.ts`, which combines both calls into one:

```ts
await activateI18n((await params).lang);
```

This is required because Lingui's RSC integration stores the i18n instance in a `React.cache`-based scope — each Server Component execution context needs its own `setI18n` call. The layout's call does not propagate to child page components. `<Trans>` from `@lingui/react/macro` is used for all translatable strings in Server Components.

### Client-Side i18n

`src/components/LinguiClientProvider.tsx` wraps children with Lingui's `I18nProvider`. It receives `initialLocale` and `initialMessages` as serialized props from the server layout, then constructs a client-side `I18n` instance via `useMemo`. The memo is keyed on both `initialLocale` and `initialMessages`, so the instance rebuilds when the user switches languages — no stale state persists across locale changes.

Client components (`not-found.tsx`, `error.tsx`, `AdditionalTextToggle.tsx`) inherit i18n context from this provider without needing their own setup. They use `<Trans>` from `@lingui/react/macro` directly.

### Language Switching

`src/components/LanguageSwitcher.tsx` renders a `<select>` dropdown populated from `lingui.config.ts`. On change, it reads the current pathname via `usePathname()`, swaps the first path segment (the locale), reads `window.location.search` and `window.location.hash` to preserve query parameters and hash fragments, and calls `router.push()` with the full reconstructed URL. This triggers a server-side re-render that loads the new locale's layout, which passes updated messages to `LinguiClientProvider`.

### Locale-Aware Links

`src/components/LocaleLink.tsx` is a `"use client"` wrapper around Next.js `<Link>` that automatically prefixes the `href` with the current locale extracted from `usePathname()`. Pages use `<LocaleLink href="/hellotesting">` instead of manually interpolating `/${lang}/hellotesting`, preventing broken links when the prefix is forgotten.

### Middleware

`src/middleware.ts` handles all locale routing concerns:

- Locale-prefixed requests pass through with cookie persistence and header injection.
- Bare URLs (`/`, `/about`) get redirected to the preferred-locale-prefixed version.
- Unknown locale-like prefixes (`/fr/...` when `fr` is not supported) get stripped and redirected.
- The matcher excludes `/api`, `_next/static`, `_next/image`, `favicon.ico`, and common image extensions.

### Build Tooling

`@lingui/swc-plugin` handles compile-time transformation of `<Trans>` macros into runtime calls. The `package.json` includes `lingui:extract`, `lingui:compile`, and `lingui:verify` scripts for the catalog workflow. `lingui.config.ts` defines a single catalog covering all of `src/`.

---

## 2. Critical Issues

### 2.1 `force-dynamic` eliminates static generation — every request hits the server

**Affected file:** `src/app/[lang]/layout.tsx` (line 7)

```ts
export const dynamic = "force-dynamic";
```

This directive forces every route under `[lang]` to render dynamically on every request. No page is prerendered at build time — Next.js cannot serve static HTML from the CDN edge. Every visitor hits the Node.js server, which must execute the full React render pipeline for every page load.

**Impact:** For a 2-locale, 12-string demo this is imperceptible. In production with real traffic, this is the single most consequential architectural choice in the codebase:

- **TTFB increases** — CDN cannot serve cached HTML; every request waits for server rendering.
- **Server cost scales linearly** with traffic — no build-time amortization of render work.
- **No ISR option** — `force-dynamic` overrides `revalidate` settings, preventing incremental static regeneration as a middle ground.

**Why it might be here:** Moving `<html>` and `<body>` into the `[lang]` layout (to render `<html lang={lang}>` dynamically) may have required this flag during development. However, `<html lang={lang}>` in a layout that uses `params` does not inherently require `force-dynamic` — Next.js can still statically generate routes with `generateStaticParams` and a dynamic segment param.

**Recommended fix:** Remove `force-dynamic` and restore `generateStaticParams`:

```tsx
// src/app/[lang]/layout.tsx
import linguiConfig from "../../../lingui.config";

export function generateStaticParams() {
  return linguiConfig.locales.map((lang) => ({ lang }));
}
```

This tells Next.js to prerender every route for each locale at build time — restoring full SSG with zero TTFB from the CDN edge. The `<html lang={lang}>` attribute will be baked into each prerendered HTML file with the correct value. If certain routes need dynamic data in the future, use per-route `revalidate` or `dynamic` overrides instead of a layout-level blanket.

### 2.2 `not-found.tsx` links to `/` instead of a locale-prefixed path

**Affected file:** `src/app/[lang]/not-found.tsx` (line 17)

```tsx
<Link href="/">
```

The "Back to Home" link navigates to `/`, which triggers a middleware redirect to the user's preferred locale. This works, but it causes an unnecessary round trip (302 redirect) and breaks the client-side navigation model — Next.js performs a full page navigation instead of an SPA transition.

**Recommended fix:** Use `LocaleLink` instead:

```tsx
import { LocaleLink } from "@/components/LocaleLink";

<LocaleLink href="/">
  <Trans>Back to Home</Trans>
</LocaleLink>
```

This preserves client-side navigation and avoids the redirect.

---

## 3. Medium Risks

### 3.1 No CI check for translation completeness

**Affected files:** `src/locales/es.po`, `package.json`

All 12 Spanish translations are currently complete, but while the `lingui:verify` script exists in `package.json`, there is no evidence it is wired into a CI pipeline. A developer can add new `<Trans>` strings, run `lingui extract`, and ship the build without translating the new entries — the app will silently fall back to English source text for those strings.

**Recommended fix:** Run `npm run lingui:verify` as a CI step. The `--strict` flag in that script causes `lingui compile` to fail if any locale has empty `msgstr` entries, turning missing translations into a build-breaking error rather than a silent runtime fallback. Example GitHub Actions step:

```yaml
- name: Verify translations
  run: npm run lingui:verify
```

### 3.2 `LOCALE_LABELS` in LanguageSwitcher is maintained separately from `lingui.config.ts`

**Affected file:** `src/components/LanguageSwitcher.tsx` (lines 6–9)

```ts
const LOCALE_LABELS: Record<string, string> = {
  en: "English",
  es: "Español",
};
```

When a new locale is added to `lingui.config.ts`, the switcher will render the raw locale code (e.g. `"FR"`) via the fallback `locale.toUpperCase()` — not a human-readable label. This is a silent regression that produces a degraded but functional UI.

**Recommended fix:** Either colocate the labels with the config:

```ts
// lingui.config.ts
export const localeLabels: Record<string, string> = {
  en: "English",
  es: "Español",
};
```

Or use `Intl.DisplayNames` for automatic locale-native labels:

```ts
const displayNames = new Intl.DisplayNames([locale], { type: "language" });
const label = displayNames.of(locale); // "English", "español", etc.
```

### 3.3 Module-level `Map` caches in `i18n.ts` persist across requests in long-running servers

**Affected file:** `src/lib/i18n.ts` (lines 12–13)

```ts
const catalogCache = new Map<string, Messages>();
const instanceCache = new Map<string, I18n>();
```

With `force-dynamic`, the server process persists across requests. The `Map` caches grow with each new locale and never shrink. For 2 locales this is trivially small. However, if locales expand significantly or if multiple `I18n` instances are inadvertently created for the same locale through race conditions during concurrent requests, the cache could accumulate stale entries.

**Current risk:** Negligible at this scale. This becomes relevant when locale count exceeds ~50 or when `I18n` instances hold large catalog data.

**Recommended fix (future-proofing):** No immediate action needed. If locales grow, consider using `React.cache` per-request for instances (instead of module-level `Map`) to avoid cross-request state sharing in serverless environments where cold starts already clear module caches.

### 3.4 No `<head>` alternate hreflang tags

**Impact:** Search engines cannot discover alternate-language versions of a page from the HTML alone. Without `<link rel="alternate" hreflang="es" href="/es/..." />` tags, Google relies on sitemap cross-references or its own content analysis to associate locale variants.

**Recommended fix:** Add hreflang tags via `generateMetadata` in `src/app/[lang]/layout.tsx`:

```tsx
import type { Metadata } from "next";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const allLocales = getAllLocales();
  const alternates: Record<string, string> = {};
  for (const locale of allLocales) {
    alternates[locale] = `/${locale}`;
  }
  return {
    alternates: {
      languages: alternates,
    },
  };
}
```

---

## 4. Performance Assessment

### 4.1 Dynamic rendering is the dominant performance concern

With `force-dynamic`, every page request runs through the full React server render pipeline. There is no static HTML cache at the CDN edge. This is the single largest performance lever in the app — removing `force-dynamic` and restoring `generateStaticParams` would reduce TTFB to effectively zero for all locale-page combinations.

### 4.2 Catalog size is negligible

`en.ts` is ~500 bytes. `es.ts` is ~530 bytes. The RSC payload overhead from serializing `initialMessages` into `LinguiClientProvider` props is minimal. At this scale, there is no measurable bundle impact.

**When to act:** If a single compiled catalog exceeds ~50 KB (roughly 2,000–3,000 strings), split catalogs by route in `lingui.config.ts`:

```ts
catalogs: [
  { path: "src/locales/{locale}/common", include: ["src/components/"] },
  { path: "src/locales/{locale}/home", include: ["src/app/[lang]/page.tsx"] },
  { path: "src/locales/{locale}/hellotesting", include: ["src/app/[lang]/hellotesting/"] },
],
```

This gives each route only the strings it needs, reducing per-page RSC payload.

### 4.3 Server-side instances are cached

`src/lib/i18n.ts` uses `Map`-based caches for both raw `Messages` objects and constructed `I18n` instances. After the first request for a locale, all subsequent requests reuse the cached instance. No repeated `setupI18n` calls, no repeated dynamic imports, no repeated `JSON.parse`.

### 4.4 Client-side instance uses useMemo

`LinguiClientProvider` creates its `I18n` instance inside `useMemo`, keyed on `initialLocale` and `initialMessages`. It only reconstructs when the locale actually changes (i.e. language switch), not on every render.

### 4.5 No unnecessary client bundles

The `server-only` guard on `src/lib/i18n.ts` prevents the server catalog loader from being bundled into client JavaScript. Client components receive pre-resolved messages as serialized props — they never import catalog files directly.

### 4.6 Font loading runs on every request

`Geist` and `Geist_Mono` are instantiated at the top of `src/app/[lang]/layout.tsx`. Under `force-dynamic`, these font-loading calls run on every request. Next.js caches the Google Fonts response internally, so the actual network overhead is minimal after the first request — but the function invocations are unnecessary repeated work. With SSG restored, font loading runs once at build time per locale.

---

## 5. Missing Components

### 5.1 `generateStaticParams` — Critical (see section 2.1)

The absence of `generateStaticParams` combined with `force-dynamic` means no routes are prerendered. Restoring it is the highest-impact change for production readiness.

### 5.2 Dynamic route i18n example — Informational

No `[slug]` or catch-all route exists yet. The current architecture would support it without changes: add a `[slug]` segment under `[lang]`, call `activateI18n` in the page, and extend `generateStaticParams` to emit locale × slug combinations. Not a gap — just an untested pattern in this codebase.

### 5.3 RTL locale support — Informational

Neither `en` nor `es` requires right-to-left text direction. If RTL locales (Arabic, Hebrew, etc.) are added in the future, the `<html dir>` attribute will need to be set dynamically. Since `<html>` already lives in the `[lang]` layout with access to `lang`, this would be a straightforward addition:

```tsx
const RTL_LOCALES = new Set(["ar", "he", "fa", "ur"]);

<html lang={lang} dir={RTL_LOCALES.has(lang) ? "rtl" : "ltr"}>
```

### 5.4 Sitemap with locale alternates — Informational

No `sitemap.ts` or `sitemap.xml` exists. For SEO, a sitemap that lists all locale variants of each page helps search engines discover and associate translated versions. Next.js supports dynamic sitemaps via `src/app/sitemap.ts`.

---

## 6. Edge Cases & Security

### Cookie validation — Safe

The `NEXT_LOCALE` cookie value is checked against the locale whitelist in `getRequestLocale()` (`src/middleware.ts`, line 73). An attacker setting `NEXT_LOCALE=../../etc/passwd` gets no match and falls through to `Accept-Language` negotiation. The cookie value never reaches a filesystem path or dynamic import without passing the whitelist check first.

### Dynamic import path injection — Safe

`getI18nInstance()` validates the locale parameter against `locales.includes(locale)` before any `import()` call (`src/lib/i18n.ts`, line 34). An unsupported value is replaced with `"en"`. The `loadCatalog` function is module-private — it cannot be called directly from outside `i18n.ts`. Even if it were, the `import(`../locales/${locale}.ts`)` path is constrained to the `src/locales/` directory by the relative path prefix.

### Route-level validation — Safe

`[lang]/layout.tsx` line 36 calls `notFound()` for unknown locale segments. Visiting `/xyz/anything` produces a proper 404 response — it does not render a page with an invalid locale.

### Open redirect via locale prefix stripping — Safe

The middleware's locale-like prefix regex (`/^[a-z]{2}(-[a-z]{2})?$/i`) only matches two-letter codes with an optional region suffix. It strips the prefix and redirects to a same-origin URL constructed via `request.nextUrl` — which preserves the host. There is no vector for open redirect or path traversal.

### x-locale header spoofing — No impact

The middleware overwrites the `x-locale` header for valid-locale paths (line 28). No layout or page reads this header — the `[lang]` layout uses the URL parameter directly, and the root layout does not consume locale information at all. Spoofing `x-locale` in an inbound request has zero effect on rendered output. The header remains in middleware for potential future use by API routes or edge functions.

### Unsupported locale in URL — Safe

Triple-layer validation: middleware redirects to a known locale, the layout's `notFound()` catches any value that bypasses middleware, and the catalog loader falls back to `"en"` as final defense-in-depth. There is no code path where an unsupported locale reaches a `<Trans>` component or an unvalidated catalog import.

### Query parameter preservation during language switch — Safe

`LanguageSwitcher` reads `window.location.search` and `window.location.hash` and appends them to the new path. Query parameters and hash fragments survive locale changes.

---

## 7. File Structure

```
lingui-demo/
├── lingui.config.ts                  ← 2 locales (en, es), single catalog covering src/
├── next.config.ts                    ← @lingui/swc-plugin for macro transformation
├── package.json                      ← lingui:extract + lingui:compile + lingui:verify scripts
├── tsconfig.json                     ← @/* path alias → ./src/*
└── src/
    ├── middleware.ts                  ← locale redirect, cookie persistence, Accept-Language fallback
    ├── app/
    │   ├── layout.tsx                ← root: metadata + globals.css only, no <html>/<body>
    │   ├── globals.css               ← Tailwind v4 imports
    │   └── [lang]/
    │       ├── layout.tsx            ← <html lang={lang}>, validates locale → notFound(),
    │       │                            setI18n(), LinguiClientProvider, force-dynamic
    │       ├── page.tsx              ← Home: activateI18n() + <Trans> + LanguageSwitcher + LocaleLink
    │       ├── hellotesting/
    │       │   └── page.tsx          ← Hello Testing: activateI18n() + <Trans> + LanguageSwitcher + LocaleLink
    │       ├── not-found.tsx         ← "use client" translated 404, inherits i18n from provider
    │       └── error.tsx             ← "use client" translated error boundary, inherits i18n from provider
    ├── components/
    │   ├── LinguiClientProvider.tsx   ← useMemo-based I18nProvider, rebuilds on locale change
    │   ├── LanguageSwitcher.tsx       ← <select> dropdown, swaps [lang] segment, preserves query/hash
    │   ├── LocaleLink.tsx            ← locale-aware <Link> wrapper, auto-prefixes href with current locale
    │   └── AdditionalTextToggle.tsx  ← "use client" toggle with translated text, demonstrates client <Trans>
    ├── lib/
    │   └── i18n.ts                   ← "server-only"; getI18nInstance + activateI18n + getAllLocales + Map caches
    └── locales/
        ├── en.po                     ← source locale (12 strings)
        ├── en.ts                     ← compiled English catalog (~500 bytes)
        ├── es.po                     ← Spanish translations (12/12 complete)
        └── es.ts                     ← compiled Spanish catalog (~530 bytes)
```

---

## 8. Suggested Architecture & Fixes

### Priority 1: Restore static generation (Critical)

Remove `force-dynamic` from `src/app/[lang]/layout.tsx` and add `generateStaticParams`:

```tsx
// src/app/[lang]/layout.tsx — remove this line:
// export const dynamic = "force-dynamic";

// Add this:
import linguiConfig from "../../../lingui.config";

export function generateStaticParams() {
  return linguiConfig.locales.map((lang) => ({ lang }));
}
```

**Result:** Every locale × page combination is prerendered at build time. TTFB drops to zero from CDN. `<html lang={lang}>` is baked into each prerendered HTML file with the correct locale value. Server costs become proportional to build frequency, not traffic volume.

### Priority 2: Fix `not-found.tsx` link (High)

Replace the raw `<Link href="/">` with `<LocaleLink href="/">` to avoid the redirect round trip and maintain client-side navigation.

### Priority 3: Add hreflang metadata (Medium)

Add `generateMetadata` to `src/app/[lang]/layout.tsx` to emit `<link rel="alternate" hreflang>` tags for each supported locale. See section 3.4 for the implementation.

### Priority 4: Wire `lingui:verify` into CI (Medium)

Ensure `npm run lingui:verify` runs in the CI pipeline. The script already exists — it just needs to be called.

### Priority 5: Colocate locale labels (Low)

Move `LOCALE_LABELS` into `lingui.config.ts` or use `Intl.DisplayNames` to eliminate the maintenance gap between config and UI. See section 3.2.

---

## 9. Verdict

**The codebase is architecturally sound for Lingui-based localization but has one critical production-readiness issue: `force-dynamic` eliminates static generation.**

Everything else is correctly implemented: locale-segmented routing with `[lang]`, triple-layer locale validation (middleware → layout → catalog loader), lazy-loaded and cached translation catalogs guarded by `server-only`, proper server/client i18n context separation with `activateI18n`, translated error boundaries and 404 pages, accurate `<html lang={lang}>` per locale, cookie-based locale persistence, query/hash-preserving language switching, locale-aware `<LocaleLink>`, and safe input validation at every layer.

Once `force-dynamic` is removed and `generateStaticParams` is restored, the app achieves full SSG with correct per-locale `<html lang>` attributes — the ideal production configuration. The remaining items are low-to-medium severity enhancements:

- **hreflang tags** — improves SEO discoverability of locale variants
- **CI translation gate** — prevents silent fallback to English for untranslated strings
- **`not-found.tsx` link fix** — avoids unnecessary redirect on 404 "Back to Home"
- **Colocated locale labels** — eliminates maintenance gap in language switcher
