# Lingui + Next.js App Router — Developer Guide

A concise reference for integrating [LinguiJS](https://lingui.dev) with the Next.js App Router, covering setup, string patterns, typed routing, CLI workflow, and end-to-end localization.

---

## 1. Setup & Build Pipeline

### Configuration files

- **`lingui.config.ts`** — single source of truth for locales, source locale, fallbacks, catalog names, and catalog-to-file mappings. Exports `locales`, `Locale`, `catalogNames`, and `CatalogName` types consumed by runtime code and the CLI.
- **`babel.config.js`** — declares `next/babel` preset and `@lingui/babel-plugin-lingui-macro`. Required because React Compiler and Lingui macros both need Babel.
- **`next.config.ts`** — enables `reactCompiler: true` and `typedRoutes: true`.
- **`src/lib/i18n.ts`** — server-only module: catalog loading, `React.cache`-scoped I18n instances, `activateI18n`, `createI18nInstance` (for API routes), `localeRedirect`.
- **`src/lib/routes.ts`** — manually maintained `AppRoute` union used by all navigation helpers.

### How the build pipeline works

1. `next/babel` — parses TypeScript and JSX
2. `@lingui/babel-plugin-lingui-macro` — transforms `<Trans>` macros into runtime `i18n._()` calls
3. React Compiler — injected by Next.js via `reactCompiler: true`

The Lingui CLI (`extract`, `compile`) operates independently — it reads source files and manages `.po` / compiled `.ts` catalogs. The Babel plugin only handles runtime macro transformation.

### Per-route catalog splitting

Catalogs are split by feature/route to keep per-page payloads small:

- **`common`** — shared components, layout, error, and 404 pages
- **`home`** — home page
- **`pluralization`** — pluralization demo
- **`select-variation`** — select variation demo
- **`parameterized-strings`** — parameterized string demo
- **`routing-examples`** — routing example pages + API route
- **`users`** — users listing and detail pages

Each catalog maps to a `path` and `include` glob in `lingui.config.ts`. Pages load only the catalogs they need via `activateI18n(lang, ["common", "feature"])`.

---

## 2. Server-Side i18n Initialization

### Why every Server Component needs `setI18n`

Lingui's RSC integration stores the active I18n instance in a `React.cache`-scoped slot — not React context. Each Server Component that renders `<Trans>` must call `setI18n()` before rendering. The layout's call does not propagate to child pages.

### Key files and roles

- **`src/app/[lang]/layout.tsx`** — validates the `[lang]` param with `isLocale()`, calls `getI18nInstance()` + `setI18n()`, wraps children in `<LinguiClientProvider>` with serializable `initialLocale` and `initialMessages` props.
- **`src/app/[lang]/page.tsx`** (and every page) — calls `await activateI18n(lang, catalogs)` at the top of its render function. This combines `getI18nInstance` + `setI18n` into one call.
- **`src/lib/i18n.ts`** — guarded by `import "server-only"`. Catalogs are loaded via dynamic `import()` and cached in a module-level `Map` (immutable data, safe to share). I18n instances are `React.cache`-scoped per request (mutable, request-isolated).

### Passing i18n to client components

The server-side `I18n` object is not serializable. The layout passes only `initialLocale` (string) and `initialMessages` (plain object) to `LinguiClientProvider`, which reconstructs a client-side instance.

---

## 3. Client Provider Pattern

### Key files

- **`src/components/LinguiClientProvider.tsx`** — wraps children with `I18nProvider`. Uses `useMemo` keyed on `initialLocale` + `initialMessages` to avoid reconstructing the instance on every render. No runtime fetch — catalog data arrives via RSC serialization.
- **Client components** (e.g. `RolePicker.tsx`, `NavigateHomeButton.tsx`) — use `<Trans>` from `@lingui/react/macro` directly. They inherit I18n from `I18nProvider` context.

---

## 4. String Internationalization Patterns

### `<Trans>` — basic translated string

Use in both Server and Client Components. The Babel macro transforms it into a runtime `i18n._()` call.

```tsx
<Trans>Hello World</Trans>
```

### `<Trans>` with interpolation — parameterized string

Embed variables directly inside `<Trans>`. Lingui extracts them as `{0}`, `{1}`, etc. in `.po` files.

```tsx
<Trans>Hello, my name is {name}</Trans>
```

### `i18n.number()` / `i18n.date()` — locale-aware formatting

Format numbers, dates, and times according to the active locale using `Intl.NumberFormat` and `Intl.DateTimeFormat` under the hood. The `i18n` instance is returned by `activateI18n` on the server. Pass the formatted values as variables into `<Trans>`.

```tsx
import { Trans } from "@lingui/react/macro";
import { activateI18n } from "@/lib/i18n";

export default async function Home({ params }: Props) {
  const { lang } = await params;
  const { i18n } = await activateI18n(lang, ["common", "home"]);

  const visitorCount = i18n.number(1_000_000);
  const formattedDate = i18n.date(new Date(), { dateStyle: "long" });
  const formattedTime = i18n.date(new Date(), { timeStyle: "short" });

  return (
    <>
      <p><Trans>You are visitor {visitorCount}!</Trans></p>
      <p><Trans>Today's date and time is {formattedDate} {formattedTime}</Trans></p>
    </>
  );
}
```

Output varies by locale — e.g. `1,000,000` in `en`, `1 000 000` in `fr`, `1.000.000` in `de`. Date and time formatting follows each locale's conventions (month/day order, 12h vs 24h clock, etc.).

### List formatting — using `Intl.ListFormat` with Lingui

Lingui does not provide a built-in list formatter. Use the browser's `Intl.ListFormat` API directly with the active locale. Since `activateI18n` returns the locale, you can pass it straight to `Intl.ListFormat`.

```tsx
const { lang } = await params;
const { i18n } = await activateI18n(lang, ["common", "home"]);

const items = ["HTML", "CSS", "JavaScript"];
const formattedList = new Intl.ListFormat(lang, { type: "conjunction" }).format(items);

<Trans>Supported technologies: {formattedList}</Trans>
```

Output varies by locale — e.g. `HTML, CSS, and JavaScript` in `en`, `HTML, CSS et JavaScript` in `fr`, `HTML, CSS und JavaScript` in `de`, `HTML、CSS、JavaScript` in `ja`.

### `<Plural>` — pluralization via ICU format

Use explicit message IDs with ICU `{count, plural, ...}` syntax in `.po` files for full plural rule control.

```tsx
<Plural id="courseCount" value={count}
  _0="There are no courses"
  one="There is # course"
  other="There are # courses"
/>
```

### `<Select>` — select variation

ICU `{value, select, ...}` for role-based or enum-based text.

```tsx
<Select id="permissionMessage" value={role}
  _user="View your courses"
  _admin="View all courses"
  other="View your courses"
/>
```

### `useLingui()` + `` t`...` `` — imperative strings in Client Components

For strings in attributes, `<option>` values, or non-JSX contexts.

```tsx
const { t } = useLingui();
<option value="admin">{t`Admin`}</option>
```

### `i18n.t()` with explicit ID — API routes and non-React contexts

For Route Handlers where React context is unavailable. Use `createI18nInstance()` (bypasses `React.cache`).

```ts
const i18n = await createI18nInstance(locale, ["routing-examples"]);
return NextResponse.json({
  message: i18n.t({ id: "apiGreeting", message: "Fetch Completed!" }),
});
```

### Module-level translation safety

Never resolve translations at module evaluation time. Always call `activateI18n` or `setI18n` inside render functions so `generateStaticParams` produces correct per-locale HTML.

---

## 5. Routing Patterns

### Typed localized routing system

**Route definitions:**
- `src/lib/routes.ts` is a manually maintained list of locale-agnostic route strings (`"/"`, `"/users"`, etc.)
- `AppRoute` is a union type derived from this list
- Add new entries when creating pages under `src/app/[lang]/`

**Two layers of route typing:**
1. **Next.js `typedRoutes`** — constrains `<Link href>` to known routes including `[lang]` segments
2. **`AppRoute` union** — constrains navigation helpers to known locale-agnostic routes

**Fallback handling:**
- Proxy (`src/proxy.ts`) — redirects bare URLs to locale-prefixed versions; resolution chain: cookie → `Accept-Language` → config default
- Layout (`src/app/[lang]/layout.tsx`) — `isLocale(lang)` check → `notFound()` for invalid locales
- Catalog loader (`src/lib/i18n.ts`) — falls back to `"en"` with `console.warn` for unsupported locales

### Typed localized navigation

**Declarative link — `LocaleLink`:**
- File: `src/components/LocaleLink.tsx`
- Accepts `href: AppRoute`, auto-prefixes current locale
- Usage: `<LocaleLink href="/users">Users</LocaleLink>` → renders `<Link href="/fr/users">`

**Imperative navigation — `useLocaleRouter`:**
- File: `src/hooks/locale-hooks.ts`
- Wraps `useRouter()` with `push`, `replace`, `prefetch` that accept `AppRoute`
- Usage: `router.push("/users")` → navigates to `/fr/users`

**Language switching — `LanguageSwitcher`:**
- File: `src/components/LanguageSwitcher.tsx`
- Swaps the locale segment in the URL, preserving path, query params, and hash
- Uses `useRouter()` directly (not `useLocaleRouter`) to avoid double-prefixing

### Localized navigation hooks

**`useLocalePathname()`:**
- Returns `{ pathname, locale, pathnameWithoutLocale }`
- `locale` is narrowed to `Locale` type via type guard
- Used by `LocaleLink`, `LanguageSwitcher`, and `ApiGreeting`

**`useLocaleRouter()`:**
- Returns the full `useRouter()` API with `push`, `replace`, `prefetch` overridden to accept `AppRoute`
- Used by components that need programmatic navigation (e.g. `NavigateHomeButton`)

### Server-side localized navigation

**`localeRedirect(lang, path)`:**
- File: `src/lib/i18n.ts`
- Accepts typed `Locale` × `AppRoute`, calls `redirect()` with locale prefix
- Return type is `never` — halts rendering like `notFound()`
- Lives in a `"server-only"` module — cannot be imported in client code
- Usage: `localeRedirect(lang, "/")` → redirects to `/fr`

**`createI18nInstance(locale, catalogs)`:**
- For API Route Handlers and other non-React server contexts
- Bypasses `React.cache` (unavailable outside React render)
- Usage: `const i18n = await createI18nInstance("fr", ["routing-examples"])`

### Proxy / middleware integration

- **File:** `src/proxy.ts` (Next.js 16 `proxy` convention, replaces deprecated `middleware`)
- Locale-prefixed URLs pass through with cookie persistence and `x-locale` header injection
- Bare URLs redirect to preferred-locale-prefixed version
- Resolution chain: URL prefix → `NEXT_LOCALE` cookie → `Accept-Language` → config default
- Matcher excludes `/api`, `_next/static`, `_next/image`, and static assets

### All `as Route` casts are concentrated in four files

- `src/components/LocaleLink.tsx`
- `src/components/LanguageSwitcher.tsx`
- `src/hooks/locale-hooks.ts`
- `src/lib/i18n.ts`

No page or application component constructs locale-prefixed paths manually.

---

## 6. End-to-End Integration Example

This shows how typed routes, localization, Lingui, and React Compiler work together in a single page.

**1. Route exists in `src/lib/routes.ts`:**

```ts
export const appRoutes = ["/", "/users", "/routing-examples", /* ... */] as const;
export type AppRoute = (typeof appRoutes)[number];
```

**2. SSR page loads catalogs and renders translated content:**

```tsx
// src/app/[lang]/users/page.tsx
import { Trans } from "@lingui/react/macro";
import { activateI18n } from "@/lib/i18n";
import { LocaleLink } from "@/components/LocaleLink";

export default async function UsersPage({ params }: Props) {
  const { lang } = await params;
  await activateI18n(lang, ["common", "users"]);

  return (
    <>
      <h2><Trans>Users</Trans></h2>
      <LocaleLink href="/routing-examples">
        <Trans>Go to Routing Examples</Trans>
      </LocaleLink>
    </>
  );
}
```

**3. Client component island uses imperative navigation:**

```tsx
// src/app/[lang]/routing-examples/NavigateHomeButton.tsx
"use client";
import { Trans } from "@lingui/react/macro";
import { useLocaleRouter } from "@/hooks/locale-hooks";

export function NavigateHomeButton() {
  const router = useLocaleRouter();
  return (
    <button onClick={() => router.push("/")}>
      <Trans>Navigate to Home</Trans>
    </button>
  );
}
```

**4. API route uses `createI18nInstance` for headless localization:**

```ts
// src/app/api/greeting/route.ts
import { createI18nInstance, isLocale } from "@/lib/i18n";

export async function GET(request: NextRequest) {
  const locale = isLocale(param) ? param : "en";
  const i18n = await createI18nInstance(locale, ["routing-examples"]);
  return NextResponse.json({
    message: i18n.t({ id: "apiGreeting", message: "Fetch Completed!" }),
  });
}
```

**5. React Compiler auto-memoizes all client components** — no manual `React.memo` needed. Lingui macros compile to standard function calls that are fully compatible.

---

## 7. Lingui CLI Workflow

### Available scripts

```bash
pnpm lingui:extract      # Scan source for <Trans> → update .po files
pnpm lingui:compile      # Compile .po → .ts catalogs (--typescript --strict)
pnpm lingui:verify       # Extract (--clean) + compile (CI gate)
```

### Adding a new translatable string

1. Add `<Trans>`, `<Plural>`, `<Select>`, `t`...``, or `i18n.t()` in your component
2. Run `pnpm lingui:extract` — new `msgid` entries appear in all `.po` files
3. Fill in translations in each locale's `.po` file
4. Run `pnpm lingui:compile` — generates compiled `.ts` catalogs
5. Verify the app renders the translated string

### Adding a new locale

1. Add the locale code to `lingui.config.ts` `locales` array
2. Add fallback entry if needed (e.g. `"fr-CA": "fr"`)
3. Run `pnpm lingui:extract` — creates `.po` files for the new locale
4. Fill in all translations
5. Run `pnpm lingui:compile`
6. Add the locale label to `LOCALE_LABELS` in `LanguageSwitcher.tsx`

No changes needed in the proxy, layout, catalog loader, or navigation helpers — they all read from `lingui.config.ts` dynamically.

### Adding a new page

1. Create the page under `src/app/[lang]/`
2. Call `await activateI18n(lang, ["common", "your-catalog"])` at the top
3. Add a catalog entry in `lingui.config.ts` if the page has its own catalog
4. Add the new route to `src/lib/routes.ts`
5. Run `pnpm lingui:extract` then `pnpm lingui:compile`

### Adding a new catalog

1. Add the catalog name to `catalogNames` in `lingui.config.ts`
2. Add a `catalogs[]` entry with `path` and `include` glob
3. Run `pnpm lingui:extract` — creates `.po` files per locale for the new catalog
4. Reference the catalog in `activateI18n(lang, ["common", "new-catalog"])`

### CI/CD integration

```yaml
- name: Verify translations
  run: pnpm lingui:verify

- name: Test
  run: pnpm test

- name: Build
  run: pnpm build
```

The `--strict` flag in `lingui:compile` fails the build if any locale has empty translations.

### Common pitfalls

- **Forgetting to compile before build** — Next.js reads compiled `.ts` catalogs, not `.po` files
- **Adding strings without extracting** — new strings won't appear in `.po` files until `lingui extract` runs
- **Adding pages without updating `routes.ts`** — `AppRoute` will be stale; TypeScript catches this at compile time
- **API route files not in catalog `include`** — `lingui extract` will mark their explicit IDs as obsolete and eventually remove them
- **Module-level translation resolution** — freezes to whichever locale was active at import time; always resolve inside render functions

---

## 8. Testing with Vitest

### Overview

Tests use [Vitest](https://vitest.dev) with `@testing-library/react` and `jsdom`. Lingui macros (`<Trans>`, `<Plural>`, etc.) require compile-time transformation, which is handled by a custom Vite plugin in `vitest.config.ts` that runs `@lingui/babel-plugin-lingui-macro` on any file importing from `@lingui/react/macro` or `@lingui/core/macro`.

### Why a custom plugin?

`@vitejs/plugin-react` v6 (Vite 8) uses OXC for JSX transforms instead of Babel. Lingui macros need Babel to compile `<Trans>` into runtime `i18n._()` calls. The custom `linguiMacroPlugin` in `vitest.config.ts` bridges this gap — it runs Babel's Lingui macro transformation only on files that need it, preserving ESM syntax so Vite can handle the rest.

### Test infrastructure

- **`vitest.config.ts`** — custom Lingui macro plugin + `@vitejs/plugin-react`, `jsdom` environment, `@/` path alias
- **`src/test/setup.ts`** — global setup: imports `@testing-library/jest-dom/vitest` matchers, auto-cleanup after each test
- **`src/test/setup-i18n.ts`** — loads compiled Lingui catalogs and creates an `I18n` instance for a given locale
- **`src/test/render-with-i18n.tsx`** — `renderWithI18n(ui, { locale, catalogs })` wrapper that wraps the component in `I18nProvider` with loaded translations

### Writing a test for a translated component

```tsx
import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MyComponent } from "./MyComponent";
import { renderWithI18n } from "../test/render-with-i18n";

describe("MyComponent", () => {
  it("renders translated text in English", async () => {
    await renderWithI18n(<MyComponent />, { locale: "en", catalogs: ["common"] });
    expect(screen.getByText("Expected English text")).toBeInTheDocument();
  });

  it("renders translated text in French", async () => {
    await renderWithI18n(<MyComponent />, { locale: "fr", catalogs: ["common"] });
    expect(screen.getByText("Texte français attendu")).toBeInTheDocument();
  });

  it("handles user interaction", async () => {
    const user = userEvent.setup();
    await renderWithI18n(<MyComponent />);
    await user.click(screen.getByRole("button"));
    expect(screen.getByText("Toggled text")).toBeInTheDocument();
  });
});
```

### Available scripts

```bash
pnpm test              # Single run
pnpm test:watch        # Watch mode
```

### Key considerations

- **Only test client components** — async Server Components import `server-only` and use `setI18n`, which aren't available in a jsdom environment. Test client component islands instead.
- **Catalogs must be compiled** — tests import from compiled `.ts` catalog files. Run `pnpm lingui:compile` before testing if translations have changed.
- **`renderWithI18n` defaults** — locale defaults to `"en"`, catalogs default to `["common"]`. Override as needed for page-specific catalogs.
- **Assertions use translated strings** — assert against the text users actually see (the translated `msgstr`), not message IDs.

### CI integration

```yaml
- name: Test
  run: pnpm test
```

---

## 9. File Structure

```
lingui-demo/
├── lingui.config.ts              ← locales, catalog names, catalog-to-file mappings
├── next.config.ts                ← reactCompiler + typedRoutes
├── vitest.config.ts              ← custom Lingui macro plugin + jsdom environment
├── babel.config.js               ← next/babel + @lingui/babel-plugin-lingui-macro
└── src/
    ├── proxy.ts                  ← locale detection, redirect, cookie persistence
    ├── test/
    │   ├── setup.ts              ← jest-dom matchers + cleanup
    │   ├── setup-i18n.ts         ← catalog loader for test I18n instances
    │   └── render-with-i18n.tsx  ← renderWithI18n() helper
    ├── app/
    │   ├── layout.tsx            ← root: metadata + globals.css
    │   ├── api/
    │   │   └── greeting/
    │   │       └── route.ts      ← API route with localized JSON response
    │   └── [lang]/
    │       ├── layout.tsx        ← setI18n, LinguiClientProvider, generateStaticParams
    │       ├── page.tsx          ← home page (SSR)
    │       ├── not-found.tsx     ← translated 404 (client)
    │       ├── error.tsx         ← translated error boundary (client)
    │       ├── parameterized-strings/
    │       │   ├── page.tsx      ← SSR page with activateI18n
    │       │   └── NameForm.tsx  ← client island for interactive input
    │       ├── pluralization/
    │       │   ├── page.tsx      ← SSR page
    │       │   └── CourseCounter.tsx  ← client island with <Plural>
    │       ├── select-variation/
    │       │   ├── page.tsx      ← SSR page
    │       │   └── RolePicker.tsx    ← client island with <Select>
    │       ├── routing-examples/
    │       │   ├── page.tsx      ← SSR page with all routing demos
    │       │   ├── NavigateHomeButton.tsx  ← client: useLocaleRouter().push()
    │       │   ├── ApiGreeting.tsx         ← client: fetch localized API
    │       │   ├── go-home/
    │       │   │   └── page.tsx  ← server-only redirect via localeRedirect
    │       │   └── slow-page/
    │       │       ├── page.tsx  ← SSR with artificial delay (streaming demo)
    │       │       └── loading.tsx  ← translated Suspense fallback
    │       └── users/
    │           ├── data.ts       ← shared user data
    │           ├── page.tsx      ← SSR users listing
    │           └── [slug]/
    │               └── page.tsx  ← SSR dynamic user detail
    ├── components/
    │   ├── LinguiClientProvider.tsx  ← useMemo-based I18nProvider
    │   ├── LanguageSwitcher.tsx      ← locale switching with URL segment swap
    │   ├── LocaleLink.tsx            ← typed locale-aware <Link>
    │   ├── AdditionalTextToggle.tsx  ← toggle with translated text
    │   ├── AdditionalTextToggle.test.tsx  ← Vitest: translations + interaction
    │   ├── SideNav.tsx               ← animated navigation menu
    │   └── PageHeader.tsx            ← locale display + language switcher
    ├── hooks/
    │   └── locale-hooks.ts       ← useLocalePathname + useLocaleRouter
    ├── lib/
    │   ├── i18n.ts               ← server-only: catalog loading, activateI18n,
    │   │                            createI18nInstance, localeRedirect
    │   └── routes.ts             ← manually maintained AppRoute union
    ├── styles/
    │   ├── page-content.module.css
    │   └── page-header.module.css
    └── locales/
        ├── en/                   ← source locale (per-catalog .po + compiled .ts + .js)
        ├── en-CA/
        ├── en-US/
        ├── fr/
        ├── fr-CA/
        ├── es/
        ├── de/
        └── ja/
```
